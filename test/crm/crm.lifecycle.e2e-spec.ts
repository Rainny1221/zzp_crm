import request from 'supertest';
import { authHeader } from './helpers/auth.helper';
import { expectBadRequest, unwrap } from './helpers/api.helper';
import { CRM_E2E_EMAIL_DOMAIN } from './helpers/db.helper';
import {
  setupCrmE2e,
  teardownCrmE2e,
  type CrmE2eContext,
} from './helpers/suite.helper';

type CreateCustomerResponse = {
  customerId: string;
  dealId: string;
  pipelineStage: string;
  status: string;
  productPackage: string;
  assigneeId: string | null;
};

type AssignmentResponse = {
  changed: boolean;
  assigneeId: string | null;
};

type PipelineStageResponse = {
  pipelineStage: string;
  status: string;
  failureReason: string | null;
  failureNote: string | null;
  changed: boolean;
};

type ProductPackageResponse = {
  productPackage: string;
  dealValue: number | null;
};

type PipelineRecord = {
  id: string;
  customer: {
    id: string;
    email: string | null;
    status: string;
    pipelineStage: string;
    productPackage: string | null;
    dealValue: number | null;
    failureReason: string | null;
    failureNote: string | null;
  };
  value: number;
};

describe('CRM lifecycle regression (e2e)', () => {
  let context: CrmE2eContext;

  beforeAll(async () => {
    context = await setupCrmE2e();
  });

  afterAll(async () => {
    await teardownCrmE2e(context);
  });

  it('creates a customer, moves it through CRM actions, and keeps read models consistent', async () => {
    const email = uniqueCrmEmail('lifecycle');

    const created = await createCustomer(context, {
      email,
      assigneeId: context.fixtures.users.sales.id,
    });

    expect(created.pipelineStage).toBe('new_lead');
    expect(created.status).toBe('new');
    expect(created.assigneeId).toBe(String(context.fixtures.users.sales.id));

    await request(context.httpServer)
      .get('/crm/customers')
      .query({ search: email })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ items: Array<{ customer: { id: string } }> }>(
          response.body,
        );
        expect(
          data.items.some((item) => item.customer.id === created.customerId),
        ).toBe(true);
      });

    await request(context.httpServer)
      .get(`/crm/customers/${created.customerId}`)
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          customer: { id: string; email: string; pipelineStage: string };
        }>(response.body);
        expect(data.customer.id).toBe(created.customerId);
        expect(data.customer.email).toBe(email);
        expect(data.customer.pipelineStage).toBe('new_lead');
      });

    const assignmentResponse = await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/assignment`)
      .set(authHeader(context.tokens.manager))
      .send({
        assigneeId: context.fixtures.users.manager.id,
        note: 'Reassign for E2E',
      })
      .expect(200);

    expect(unwrap<AssignmentResponse>(assignmentResponse.body)).toMatchObject({
      changed: true,
      assigneeId: String(context.fixtures.users.manager.id),
    });

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/assignment`)
      .set(authHeader(context.tokens.manager))
      .send({
        assigneeId: context.fixtures.users.manager.id,
        note: 'No-op reassignment',
      })
      .expect(200)
      .expect((response) => {
        expect(unwrap<AssignmentResponse>(response.body).changed).toBe(false);
      });

    await request(context.httpServer)
      .post(`/crm/customers/${created.customerId}/notes`)
      .set(authHeader(context.tokens.manager))
      .send({ content: 'Lifecycle note from E2E' })
      .expect(201);

    await request(context.httpServer)
      .post(`/crm/customers/${created.customerId}/interactions`)
      .set(authHeader(context.tokens.manager))
      .send({
        channel: 'call',
        outcomeCode: 'connected',
        summary: 'E2E call connected',
        occurredAt: '2026-05-03T08:00:00.000Z',
      })
      .expect(201);

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
      .set(authHeader(context.tokens.manager))
      .send({
        pipelineStage: 'qualified',
        note: 'Qualified by E2E',
      })
      .expect(200)
      .expect((response) => {
        expect(unwrap<PipelineStageResponse>(response.body)).toMatchObject({
          pipelineStage: 'qualified',
          status: 'trial',
          changed: true,
        });
      });

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/product-package`)
      .set(authHeader(context.tokens.manager))
      .send({
        productPackage: '399',
        dealValue: 399000,
        note: 'Package changed by E2E',
      })
      .expect(200)
      .expect((response) => {
        expect(unwrap<ProductPackageResponse>(response.body)).toMatchObject({
          productPackage: '399',
          dealValue: 399000,
        });
      });

    const tableRow = await getPipelineTableRow(context, {
      search: email,
      pipelineStage: 'qualified',
      productPackage: '399',
    });

    expect(tableRow).toMatchObject({
      id: created.dealId,
      value: 399000,
      customer: {
        id: created.customerId,
        email,
        status: 'trial',
        pipelineStage: 'qualified',
        productPackage: '399',
        dealValue: 399000,
      },
    });

    await request(context.httpServer)
      .get('/crm/pipeline/kanban')
      .query({ pipelineStage: 'qualified', productPackage: '399' })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          columns: Record<string, { items: PipelineRecord[] }>;
        }>(response.body);
        expect(data.columns.qualified).toBeDefined();
        expect(
          data.columns.qualified.items.some(
            (item) =>
              item.id === created.dealId &&
              item.customer.pipelineStage === 'qualified',
          ),
        ).toBe(true);
      });

    await request(context.httpServer)
      .get('/crm/pipeline/product-kanban')
      .query({ pipelineStage: 'qualified', productPackage: '399' })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          columns: Record<string, { items: PipelineRecord[] }>;
        }>(response.body);
        expect(data.columns['399']).toBeDefined();
        expect(
          data.columns['399'].items.some(
            (item) =>
              item.id === created.dealId &&
              item.customer.productPackage === '399',
          ),
        ).toBe(true);
      });

    await request(context.httpServer)
      .get('/crm/dashboard/admin')
      .query({ source: 'manual' })
      .set(authHeader(context.tokens.admin))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          kpiStrip: { totalCustomers: number };
          leadDistribution: Array<{ stage: string; count: number }>;
        }>(response.body);
        expect(data.kpiStrip.totalCustomers).toBeGreaterThanOrEqual(1);
        expect(
          data.leadDistribution.find((item) => item.stage === 'qualified')
            ?.count,
        ).toBeGreaterThanOrEqual(1);
      });

    await request(context.httpServer)
      .get('/crm/kpi/overview')
      .query({
        source: 'manual',
        stage: 'qualified',
        productPackage: '399',
      })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          summary: { totalLeads: number; pipelineValue: number };
          breakdowns: {
            packages: Array<{ productPackage: string; count: number }>;
          };
        }>(response.body);
        expect(data.summary.totalLeads).toBeGreaterThanOrEqual(1);
        expect(data.summary.pipelineValue).toBeGreaterThanOrEqual(399000);
        expect(
          data.breakdowns.packages.find((item) => item.productPackage === '399')
            ?.count,
        ).toBeGreaterThanOrEqual(1);
      });
  });

  it('keeps failure state consistent across detail, pipeline, dashboard, and feedback', async () => {
    const email = uniqueCrmEmail('failure');
    const created = await createCustomer(context, {
      email,
      assigneeId: context.fixtures.users.manager.id,
    });

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
      .set(authHeader(context.tokens.manager))
      .send({
        pipelineStage: 'fail',
        failureReason: 'high_price',
        failureNote: 'Customer price objection from E2E',
      })
      .expect(200)
      .expect((response) => {
        expect(unwrap<PipelineStageResponse>(response.body)).toMatchObject({
          pipelineStage: 'fail',
          status: 'failed',
          failureReason: 'high_price',
          failureNote: 'Customer price objection from E2E',
          changed: true,
        });
      });

    await request(context.httpServer)
      .get(`/crm/customers/${created.customerId}`)
      .set(authHeader(context.tokens.admin))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          customer: {
            status: string;
            pipelineStage: string;
            failureReason: string | null;
            failureNote: string | null;
          };
        }>(response.body);
        expect(data.customer).toMatchObject({
          status: 'failed',
          pipelineStage: 'fail',
          failureReason: 'high_price',
          failureNote: 'Customer price objection from E2E',
        });
      });

    const tableRow = await getPipelineTableRow(context, {
      search: email,
      pipelineStage: 'fail',
      status: 'failed',
    });

    expect(tableRow.customer).toMatchObject({
      status: 'failed',
      pipelineStage: 'fail',
      failureReason: 'high_price',
      failureNote: 'Customer price objection from E2E',
    });

    await request(context.httpServer)
      .get('/crm/dashboard/admin')
      .query({ source: 'manual' })
      .set(authHeader(context.tokens.admin))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          kpiStrip: { lostDeals: number };
          failureAnalysis: Array<{ failureReason: string; count: number }>;
        }>(response.body);
        expect(data.kpiStrip.lostDeals).toBeGreaterThanOrEqual(1);
        expect(
          data.failureAnalysis.find(
            (item) => item.failureReason === 'high_price',
          )?.count,
        ).toBeGreaterThanOrEqual(1);
      });

    await request(context.httpServer)
      .get('/crm/feedback')
      .query({ category: 'failure', customerId: created.customerId })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          items: Array<{ customerId: string | null; message: string }>;
        }>(response.body);
        expect(
          data.items.some(
            (item) =>
              item.customerId === created.customerId &&
              item.message === 'Customer price objection from E2E',
          ),
        ).toBe(true);
      });
  });

  it('rejects invalid customer create and pipeline-stage requests', async () => {
    await request(context.httpServer)
      .post('/crm/customers')
      .set(authHeader(context.tokens.manager))
      .send({ shopName: 'CRM E2E Missing Contact', source: 'manual' })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));

    await request(context.httpServer)
      .post('/crm/customers')
      .set(authHeader(context.tokens.manager))
      .send({
        email: uniqueCrmEmail('invalid-package'),
        productPackage: 'invalid',
      })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));

    await request(context.httpServer)
      .post('/crm/customers')
      .set(authHeader(context.tokens.manager))
      .send({
        email: uniqueCrmEmail('invalid-source'),
        source: 'invalid_source',
      })
      .expect(400);

    await request(context.httpServer)
      .post('/crm/customers')
      .set(authHeader(context.tokens.manager))
      .send({
        email: uniqueCrmEmail('negative-deal'),
        dealValue: -1,
      })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));

    const created = await createCustomer(context, {
      email: uniqueCrmEmail('stage-validation'),
      assigneeId: context.fixtures.users.manager.id,
    });

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
      .set(authHeader(context.tokens.manager))
      .send({ pipelineStage: 'invalid_stage' })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
      .set(authHeader(context.tokens.manager))
      .send({ pipelineStage: 'fail' })
      .expect(400);

    await request(context.httpServer)
      .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
      .set(authHeader(context.tokens.manager))
      .send({ pipelineStage: 'new_lead' })
      .expect(200)
      .expect((response) => {
        expect(unwrap<PipelineStageResponse>(response.body)).toMatchObject({
          pipelineStage: 'new_lead',
          status: 'new',
          changed: false,
        });
      });
  });
});

async function createCustomer(
  context: CrmE2eContext,
  params: {
    email: string;
    assigneeId?: number;
  },
): Promise<CreateCustomerResponse> {
  const response = await request(context.httpServer)
    .post('/crm/customers')
    .set(authHeader(context.tokens.manager))
    .send({
      shopName: 'CRM E2E Lifecycle',
      phone: '0901234567',
      email: params.email,
      source: 'manual',
      assigneeId: params.assigneeId,
      productPackage: 'trial',
      dealValue: 0,
      note: 'Created by CRM E2E',
    })
    .expect(201);

  return unwrap<CreateCustomerResponse>(response.body);
}

async function getPipelineTableRow(
  context: CrmE2eContext,
  query: Record<string, string>,
): Promise<PipelineRecord> {
  const response = await request(context.httpServer)
    .get('/crm/pipeline/table')
    .query(query)
    .set(authHeader(context.tokens.manager))
    .expect(200);

  const data = unwrap<{ rows: PipelineRecord[] }>(response.body);
  const row = data.rows[0];
  expect(row).toBeDefined();
  return row;
}

function uniqueCrmEmail(label: string): string {
  return `crm-e2e-${label}-${Date.now()}-${Math.floor(
    Math.random() * 1_000_000,
  )}${CRM_E2E_EMAIL_DOMAIN}`;
}
