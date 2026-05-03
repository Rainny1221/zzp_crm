import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  closeCrmTestApp,
  createCrmTestApp,
  type CrmTestApp,
} from './helpers/app.helper';
import { authHeader, getAccessTokenForUser } from './helpers/auth.helper';
import {
  CRM_E2E_EMAIL_DOMAIN,
  resetCrmFixtures,
  seedCrmBaseFixtures,
  type CrmBaseFixtures,
} from './helpers/db.helper';

type ApiSuccess<T> = {
  success: true;
  data: T;
};

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
};

type ProductPackageResponse = {
  productPackage: string;
  dealValue: number | null;
};

type KpiTargetResponse = {
  targetId: string;
  salesRepId: string;
  periodStart: string;
  periodEnd: string;
  leadsTarget: number;
  pipelineValueTarget: number;
};

type InboxItem = {
  id: string;
  isRead: boolean;
  readAt: string | null;
};

describe('CRM API regression (e2e)', () => {
  let testApp: CrmTestApp;
  let app: INestApplication;
  let httpServer: App;
  let fixtures: CrmBaseFixtures;
  let adminToken: string;
  let managerToken: string;
  let salesToken: string;
  let noAccessToken: string;

  beforeAll(async () => {
    testApp = await createCrmTestApp();
    app = testApp.app;
    httpServer = app.getHttpServer() as unknown as App;

    await resetCrmFixtures(testApp.prisma);
    fixtures = await seedCrmBaseFixtures(testApp.prisma);

    adminToken = await getAccessTokenForUser(app, fixtures.users.admin);
    managerToken = await getAccessTokenForUser(app, fixtures.users.manager);
    salesToken = await getAccessTokenForUser(app, fixtures.users.sales);
    noAccessToken = await getAccessTokenForUser(app, fixtures.users.noAccess);
  });

  afterAll(async () => {
    if (testApp) {
      await resetCrmFixtures(testApp.prisma);
    }
    await closeCrmTestApp(testApp);
  });

  describe('customer lifecycle and read-side consistency', () => {
    it('creates a customer, moves it through CRM actions, and exposes it in read APIs', async () => {
      const email = `crm-e2e-lifecycle-${Date.now()}${CRM_E2E_EMAIL_DOMAIN}`;

      const createResponse = await request(httpServer)
        .post('/crm/customers')
        .set(authHeader(managerToken))
        .send({
          shopName: 'CRM E2E Lifecycle',
          phone: '0901234567',
          email,
          source: 'manual',
          assigneeId: fixtures.users.sales.id,
          productPackage: 'trial',
          dealValue: 0,
          note: 'Created by CRM E2E',
        })
        .expect(201);

      const created = unwrap<CreateCustomerResponse>(createResponse.body);
      expect(created.pipelineStage).toBe('new_lead');
      expect(created.status).toBe('new');
      expect(created.assigneeId).toBe(String(fixtures.users.sales.id));

      await request(httpServer)
        .get('/crm/customers')
        .query({ search: email })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ items: Array<{ customer: { id: string } }> }>(
            response.body,
          );
          expect(
            data.items.some((item) => item.customer.id === created.customerId),
          ).toBe(true);
        });

      await request(httpServer)
        .get(`/crm/customers/${created.customerId}`)
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{
            customer: { id: string; email: string; pipelineStage: string };
          }>(response.body);
          expect(data.customer.id).toBe(created.customerId);
          expect(data.customer.email).toBe(email);
          expect(data.customer.pipelineStage).toBe('new_lead');
        });

      const assignmentResponse = await request(httpServer)
        .patch(`/crm/customers/${created.customerId}/assignment`)
        .set(authHeader(managerToken))
        .send({
          assigneeId: fixtures.users.manager.id,
          note: 'Reassign for E2E',
        })
        .expect(200);

      expect(unwrap<AssignmentResponse>(assignmentResponse.body)).toMatchObject(
        {
          changed: true,
          assigneeId: String(fixtures.users.manager.id),
        },
      );

      await request(httpServer)
        .patch(`/crm/customers/${created.customerId}/assignment`)
        .set(authHeader(managerToken))
        .send({
          assigneeId: fixtures.users.manager.id,
          note: 'No-op reassignment',
        })
        .expect(200)
        .expect((response) => {
          expect(unwrap<AssignmentResponse>(response.body).changed).toBe(false);
        });

      await request(httpServer)
        .post(`/crm/customers/${created.customerId}/notes`)
        .set(authHeader(managerToken))
        .send({ content: 'Lifecycle note from E2E' })
        .expect(201);

      await request(httpServer)
        .post(`/crm/customers/${created.customerId}/interactions`)
        .set(authHeader(managerToken))
        .send({
          channel: 'call',
          outcomeCode: 'connected',
          summary: 'E2E call connected',
          occurredAt: '2026-05-03T08:00:00.000Z',
        })
        .expect(201);

      await request(httpServer)
        .patch(`/crm/customers/${created.customerId}/pipeline-stage`)
        .set(authHeader(managerToken))
        .send({
          pipelineStage: 'qualified',
          note: 'Qualified by E2E',
        })
        .expect(200)
        .expect((response) => {
          expect(unwrap<PipelineStageResponse>(response.body)).toMatchObject({
            pipelineStage: 'qualified',
            status: 'trial',
          });
        });

      await request(httpServer)
        .patch(`/crm/customers/${created.customerId}/product-package`)
        .set(authHeader(managerToken))
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

      await request(httpServer)
        .get('/crm/pipeline/table')
        .query({
          search: email,
          pipelineStage: 'qualified',
          productPackage: '399',
        })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ rows: Array<{ id: string }> }>(response.body);
          expect(data.rows.some((row) => row.id === created.dealId)).toBe(true);
        });

      await request(httpServer)
        .get('/crm/pipeline/kanban')
        .query({ pipelineStage: 'qualified', productPackage: '399' })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{
            columns: Record<string, { items: Array<{ id: string }> }>;
          }>(response.body);
          expect(data.columns.qualified).toBeDefined();
          expect(
            data.columns.qualified.items.some(
              (item) => item.id === created.dealId,
            ),
          ).toBe(true);
        });

      await request(httpServer)
        .get('/crm/pipeline/product-kanban')
        .query({ pipelineStage: 'qualified', productPackage: '399' })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{
            columns: Record<string, { items: Array<{ id: string }> }>;
          }>(response.body);
          expect(data.columns['399']).toBeDefined();
          expect(
            data.columns['399'].items.some(
              (item) => item.id === created.dealId,
            ),
          ).toBe(true);
        });

      await request(httpServer)
        .get('/crm/dashboard/admin')
        .query({ source: 'manual' })
        .set(authHeader(adminToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ kpiStrip: { totalCustomers: number } }>(
            response.body,
          );
          expect(data.kpiStrip.totalCustomers).toBeGreaterThanOrEqual(1);
        });

      await request(httpServer)
        .get('/crm/kpi/overview')
        .query({
          source: 'manual',
          stage: 'qualified',
          productPackage: '399',
        })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ summary: { totalLeads: number } }>(
            response.body,
          );
          expect(data.summary.totalLeads).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('KPI targets permissions and attainment', () => {
    it('allows managers to set sales targets and blocks sales from managing or reading others', async () => {
      const periodStart = '2026-05-01';

      const upsertResponse = await request(httpServer)
        .put(`/crm/kpi/targets/sales/${fixtures.users.sales.id}`)
        .set(authHeader(managerToken))
        .send({
          periodType: 'monthly',
          periodStart,
          leadsTarget: 30,
          qualifiedTarget: 15,
          wonDealsTarget: 5,
          pipelineValueTarget: 50000000,
          wonValueTarget: 20000000,
        })
        .expect(200);

      const target = unwrap<KpiTargetResponse>(upsertResponse.body);
      expect(target.salesRepId).toBe(String(fixtures.users.sales.id));
      expect(target.periodEnd).toBe('2026-05-31');

      await request(httpServer)
        .get(`/crm/kpi/targets/sales/${fixtures.users.sales.id}`)
        .query({ periodType: 'monthly', periodStart })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ target: { id: string; leadsTarget: number } }>(
            response.body,
          );
          expect(data.target.id).toBe(target.targetId);
          expect(data.target.leadsTarget).toBe(30);
        });

      await request(httpServer)
        .get(`/crm/kpi/targets/sales/${fixtures.users.sales.id}`)
        .query({ periodType: 'monthly', periodStart })
        .set(authHeader(salesToken))
        .expect(200);

      await request(httpServer)
        .get(`/crm/kpi/targets/sales/${fixtures.users.otherSales.id}`)
        .query({ periodType: 'monthly', periodStart })
        .set(authHeader(salesToken))
        .expect(403);

      await request(httpServer)
        .put(`/crm/kpi/targets/sales/${fixtures.users.sales.id}`)
        .set(authHeader(salesToken))
        .send({
          periodType: 'monthly',
          periodStart,
          leadsTarget: 1,
          qualifiedTarget: 1,
          wonDealsTarget: 1,
          pipelineValueTarget: 1,
          wonValueTarget: 1,
        })
        .expect(403);

      await request(httpServer)
        .get(`/crm/kpi/sales/${fixtures.users.sales.id}`)
        .query({
          from: `${periodStart}T00:00:00.000Z`,
          to: '2026-05-31T23:59:59.999Z',
        })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{
            targets: { leadsTarget: number };
            attainment: { leadsPct: number };
          }>(response.body);
          expect(data.targets.leadsTarget).toBe(30);
          expect(typeof data.attainment.leadsPct).toBe('number');
        });
    });
  });

  describe('notification ownership and idempotency', () => {
    it('scopes notifications to receiver and allows idempotent mark-read', async () => {
      const notification = await testApp.prisma.crmNotifications.create({
        data: {
          type_code: 'customer_created',
          receiver_user_id: fixtures.users.manager.id,
          actor_user_id: fixtures.users.sales.id,
          title: 'CRM E2E notification',
          message: 'Only manager should read this notification',
          is_read: false,
        },
      });

      await request(httpServer)
        .patch(`/crm/notifications/${notification.id}/read`)
        .set(authHeader(salesToken))
        .expect(404);

      await request(httpServer)
        .get('/crm/notifications')
        .query({ isRead: 'unread', type: 'customer_created' })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ items: InboxItem[] }>(response.body);
          expect(
            data.items.some((item) => item.id === String(notification.id)),
          ).toBe(true);
        });

      await request(httpServer)
        .patch(`/crm/notifications/${notification.id}/read`)
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ notificationId: string; isRead: boolean }>(
            response.body,
          );
          expect(data.notificationId).toBe(String(notification.id));
          expect(data.isRead).toBe(true);
        });

      await request(httpServer)
        .patch(`/crm/notifications/${notification.id}/read`)
        .set(authHeader(managerToken))
        .expect(200);
    });
  });

  describe('feedback ownership and permission hardening', () => {
    it('scopes feedback to receiver and allows idempotent mark-read', async () => {
      const feedback = await testApp.prisma.crmFeedback.create({
        data: {
          category_code: 'failure',
          receiver_user_id: fixtures.users.manager.id,
          actor_user_id: fixtures.users.sales.id,
          title: 'CRM E2E feedback',
          message: 'Only manager should read this feedback',
          is_read: false,
        },
      });

      await request(httpServer)
        .patch(`/crm/feedback/${feedback.id}/read`)
        .set(authHeader(salesToken))
        .expect(404);

      await request(httpServer)
        .get('/crm/feedback')
        .query({ isRead: 'unread', category: 'failure' })
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ items: InboxItem[] }>(response.body);
          expect(
            data.items.some((item) => item.id === String(feedback.id)),
          ).toBe(true);
        });

      await request(httpServer)
        .patch(`/crm/feedback/${feedback.id}/read`)
        .set(authHeader(managerToken))
        .expect(200)
        .expect((response) => {
          const data = unwrap<{ feedbackId: string; isRead: boolean }>(
            response.body,
          );
          expect(data.feedbackId).toBe(String(feedback.id));
          expect(data.isRead).toBe(true);
        });

      await request(httpServer)
        .patch(`/crm/feedback/${feedback.id}/read`)
        .set(authHeader(managerToken))
        .expect(200);
    });

    it('blocks users without CRM permissions from inbox reads', async () => {
      await request(httpServer)
        .get('/crm/notifications')
        .set(authHeader(noAccessToken))
        .expect(403);

      await request(httpServer)
        .get('/crm/feedback')
        .set(authHeader(noAccessToken))
        .expect(403);
    });
  });
});

function unwrap<T>(body: unknown): T {
  const response = body as ApiSuccess<T>;
  expect(response.success).toBe(true);
  return response.data;
}
