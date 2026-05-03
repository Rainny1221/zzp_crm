import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import {
  closeCrmTestApp,
  createCrmTestApp,
  type CrmTestApp,
} from './app.helper';
import { getAccessTokenForUser } from './auth.helper';
import {
  resetCrmFixtures,
  seedCrmBaseFixtures,
  type CrmBaseFixtures,
} from './db.helper';

export type CrmE2eContext = {
  testApp: CrmTestApp;
  app: INestApplication;
  httpServer: App;
  fixtures: CrmBaseFixtures;
  tokens: {
    admin: string;
    manager: string;
    sales: string;
    otherSales: string;
    noAccess: string;
  };
};

export async function setupCrmE2e(): Promise<CrmE2eContext> {
  const testApp = await createCrmTestApp();
  const app = testApp.app;
  const httpServer = app.getHttpServer() as unknown as App;

  await resetCrmFixtures(testApp.prisma);
  const fixtures = await seedCrmBaseFixtures(testApp.prisma);

  return {
    testApp,
    app,
    httpServer,
    fixtures,
    tokens: {
      admin: await getAccessTokenForUser(app, fixtures.users.admin),
      manager: await getAccessTokenForUser(app, fixtures.users.manager),
      sales: await getAccessTokenForUser(app, fixtures.users.sales),
      otherSales: await getAccessTokenForUser(app, fixtures.users.otherSales),
      noAccess: await getAccessTokenForUser(app, fixtures.users.noAccess),
    },
  };
}

export async function teardownCrmE2e(
  context: CrmE2eContext | undefined,
): Promise<void> {
  if (context) {
    await resetCrmFixtures(context.testApp.prisma);
  }

  await closeCrmTestApp(context?.testApp);
}
