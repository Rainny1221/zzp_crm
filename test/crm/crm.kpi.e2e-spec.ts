import request from 'supertest';
import { expectBadRequest, unwrap } from './helpers/api.helper';
import { authHeader } from './helpers/auth.helper';
import {
  setupCrmE2e,
  teardownCrmE2e,
  type CrmE2eContext,
} from './helpers/suite.helper';

type KpiTargetResponse = {
  targetId: string;
  salesRepId: string;
  periodStart: string;
  periodEnd: string;
  leadsTarget: number;
  qualifiedTarget: number;
  wonDealsTarget: number;
  pipelineValueTarget: number;
  wonValueTarget: number;
};

describe('CRM KPI regression (e2e)', () => {
  let context: CrmE2eContext;

  beforeAll(async () => {
    context = await setupCrmE2e();
  });

  afterAll(async () => {
    await teardownCrmE2e(context);
  });

  it('allows managers to set sales targets, read them, and see attainment in sales KPI', async () => {
    const periodStart = '2026-05-01';

    const upsertResponse = await request(context.httpServer)
      .put(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .set(authHeader(context.tokens.manager))
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
    expect(target).toMatchObject({
      salesRepId: String(context.fixtures.users.sales.id),
      periodStart,
      periodEnd: '2026-05-31',
      leadsTarget: 30,
      qualifiedTarget: 15,
      wonDealsTarget: 5,
      pipelineValueTarget: 50000000,
      wonValueTarget: 20000000,
    });

    await request(context.httpServer)
      .get(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .query({ periodType: 'monthly', periodStart })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ target: { id: string; leadsTarget: number } }>(
          response.body,
        );
        expect(data.target.id).toBe(target.targetId);
        expect(data.target.leadsTarget).toBe(30);
      });

    await request(context.httpServer)
      .get(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .query({ periodType: 'monthly', periodStart })
      .set(authHeader(context.tokens.sales))
      .expect(200);

    await request(context.httpServer)
      .get(`/crm/kpi/sales/${context.fixtures.users.sales.id}`)
      .query({
        from: `${periodStart}T00:00:00.000Z`,
        to: '2026-05-31T23:59:59.999Z',
      })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          targets: { leadsTarget: number };
          attainment: { leadsPct: number; pipelineValuePct: number };
        }>(response.body);
        expect(data.targets.leadsTarget).toBe(30);
        expect(typeof data.attainment.leadsPct).toBe('number');
        expect(typeof data.attainment.pipelineValuePct).toBe('number');
      });

    await request(context.httpServer)
      .get(`/crm/dashboard/sales/${context.fixtures.users.sales.id}`)
      .query({
        from: periodStart,
        to: '2026-05-31',
      })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{
          kpiStrip: {
            monthlyClosedDeals: number;
            averageOrderValue: number;
          };
          targets: {
            wonValueTarget: number;
            wonDealsTarget: number;
            qualifiedTarget: number;
            pipelineValueTarget: number;
          } | null;
          quota: number;
          targetProgress: number;
          attainment: {
            wonValuePct: number;
            wonDealsPct: number;
            qualifiedPct: number;
            pipelineValuePct: number;
          } | null;
        }>(response.body);

        expect(data.kpiStrip.monthlyClosedDeals).toBeGreaterThanOrEqual(0);
        expect(typeof data.kpiStrip.averageOrderValue).toBe('number');
        expect(data.targets).toMatchObject({
          wonValueTarget: 20000000,
          wonDealsTarget: 5,
          qualifiedTarget: 15,
          pipelineValueTarget: 50000000,
        });
        expect(data.quota).toBe(20000000);
        expect(typeof data.targetProgress).toBe('number');
        expect(typeof data.attainment?.wonValuePct).toBe('number');
        expect(typeof data.attainment?.wonDealsPct).toBe('number');
        expect(typeof data.attainment?.qualifiedPct).toBe('number');
        expect(typeof data.attainment?.pipelineValuePct).toBe('number');
      });
  });

  it('enforces KPI target scope and validates target payloads', async () => {
    const periodStart = '2026-06-01';

    await request(context.httpServer)
      .get(`/crm/kpi/targets/sales/${context.fixtures.users.otherSales.id}`)
      .query({ periodType: 'monthly', periodStart })
      .set(authHeader(context.tokens.sales))
      .expect(403);

    await request(context.httpServer)
      .put(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .set(authHeader(context.tokens.sales))
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

    await request(context.httpServer)
      .put(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .set(authHeader(context.tokens.manager))
      .send({
        periodType: 'weekly',
        periodStart,
        leadsTarget: 1,
      })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));

    await request(context.httpServer)
      .put(`/crm/kpi/targets/sales/${context.fixtures.users.sales.id}`)
      .set(authHeader(context.tokens.manager))
      .send({
        periodType: 'monthly',
        periodStart,
        leadsTarget: -1,
      })
      .expect(400)
      .expect((response) => expectBadRequest(response.body));
  });
});
