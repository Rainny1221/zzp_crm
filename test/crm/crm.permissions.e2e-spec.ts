import request from 'supertest';
import { expectBadRequest, unwrap } from './helpers/api.helper';
import { authHeader } from './helpers/auth.helper';
import {
  setupCrmE2e,
  teardownCrmE2e,
  type CrmE2eContext,
} from './helpers/suite.helper';

type InboxItem = {
  id: string;
  isRead: boolean;
  readAt: string | null;
};

describe('CRM permissions and inbox regression (e2e)', () => {
  let context: CrmE2eContext;

  beforeAll(async () => {
    context = await setupCrmE2e();
  });

  afterAll(async () => {
    await teardownCrmE2e(context);
  });

  it('scopes notifications to receiver and allows idempotent mark-read', async () => {
    const notification = await context.testApp.prisma.crmNotifications.create({
      data: {
        type_code: 'customer_created',
        receiver_user_id: context.fixtures.users.manager.id,
        actor_user_id: context.fixtures.users.sales.id,
        title: 'CRM E2E notification',
        message: 'Only manager should read this notification',
        is_read: false,
      },
    });

    await request(context.httpServer)
      .patch(`/crm/notifications/${notification.id}/read`)
      .set(authHeader(context.tokens.sales))
      .expect(404);

    await request(context.httpServer)
      .get('/crm/notifications')
      .query({ isRead: 'unread', type: 'customer_created' })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ items: InboxItem[] }>(response.body);
        expect(
          data.items.some((item) => item.id === String(notification.id)),
        ).toBe(true);
      });

    await request(context.httpServer)
      .patch(`/crm/notifications/${notification.id}/read`)
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ notificationId: string; isRead: boolean }>(
          response.body,
        );
        expect(data.notificationId).toBe(String(notification.id));
        expect(data.isRead).toBe(true);
      });

    await request(context.httpServer)
      .patch(`/crm/notifications/${notification.id}/read`)
      .set(authHeader(context.tokens.manager))
      .expect(200);
  });

  it('scopes feedback to receiver and allows idempotent mark-read', async () => {
    const feedback = await context.testApp.prisma.crmFeedback.create({
      data: {
        category_code: 'failure',
        receiver_user_id: context.fixtures.users.manager.id,
        actor_user_id: context.fixtures.users.sales.id,
        title: 'CRM E2E feedback',
        message: 'Only manager should read this feedback',
        is_read: false,
      },
    });

    await request(context.httpServer)
      .patch(`/crm/feedback/${feedback.id}/read`)
      .set(authHeader(context.tokens.sales))
      .expect(404);

    await request(context.httpServer)
      .get('/crm/feedback')
      .query({ isRead: 'unread', category: 'failure' })
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ items: InboxItem[] }>(response.body);
        expect(data.items.some((item) => item.id === String(feedback.id))).toBe(
          true,
        );
      });

    await request(context.httpServer)
      .patch(`/crm/feedback/${feedback.id}/read`)
      .set(authHeader(context.tokens.manager))
      .expect(200)
      .expect((response) => {
        const data = unwrap<{ feedbackId: string; isRead: boolean }>(
          response.body,
        );
        expect(data.feedbackId).toBe(String(feedback.id));
        expect(data.isRead).toBe(true);
      });

    await request(context.httpServer)
      .patch(`/crm/feedback/${feedback.id}/read`)
      .set(authHeader(context.tokens.manager))
      .expect(200);
  });

  it('blocks users without CRM permissions from inbox reads', async () => {
    await request(context.httpServer)
      .get('/crm/notifications')
      .set(authHeader(context.tokens.noAccess))
      .expect(403);

    await request(context.httpServer)
      .get('/crm/feedback')
      .set(authHeader(context.tokens.noAccess))
      .expect(403);
  });

  it('validates notification and feedback query parameters', async () => {
    for (const path of ['/crm/notifications', '/crm/feedback']) {
      await request(context.httpServer)
        .get(path)
        .query({ page: -1 })
        .set(authHeader(context.tokens.manager))
        .expect(400)
        .expect((response) => expectBadRequest(response.body));

      await request(context.httpServer)
        .get(path)
        .query({ limit: 0 })
        .set(authHeader(context.tokens.manager))
        .expect(400)
        .expect((response) => expectBadRequest(response.body));

      await request(context.httpServer)
        .get(path)
        .query({ isRead: 'invalid' })
        .set(authHeader(context.tokens.manager))
        .expect(400)
        .expect((response) => expectBadRequest(response.body));
    }
  });
});
