import { PrismaService } from '../../../src/prisma/prisma.service';

export const CRM_E2E_EMAIL_DOMAIN = '@crm-e2e.test';

export type CrmBaseFixtures = {
  users: {
    admin: Awaited<ReturnType<typeof createFixtureUser>>;
    manager: Awaited<ReturnType<typeof createFixtureUser>>;
    sales: Awaited<ReturnType<typeof createFixtureUser>>;
    otherSales: Awaited<ReturnType<typeof createFixtureUser>>;
    noAccess: Awaited<ReturnType<typeof createFixtureUser>>;
  };
};

const CRM_E2E_PERMISSIONS = [
  'CRM_BOOTSTRAP_VIEW',
  'CRM_CUSTOMER_CREATE',
  'CRM_CUSTOMER_VIEW',
  'CRM_CUSTOMER_MANAGE',
  'CRM_ASSIGN_LEAD',
  'CRM_PIPELINE_VIEW',
  'CRM_PIPELINE_MANAGE',
  'CRM_REPORT_VIEW',
  'CRM_NOTIFICATION_VIEW',
  'CRM_NOTIFICATION_MANAGE',
  'CRM_FEEDBACK_VIEW',
  'CRM_FEEDBACK_MANAGE',
  'CRM_KPI_VIEW',
  'CRM_KPI_MANAGE',
] as const;

export async function resetCrmFixtures(prisma: PrismaService): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: CRM_E2E_EMAIL_DOMAIN,
      },
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const businessProfiles = await prisma.crmCustomerBusinessProfiles.findMany({
    where: {
      OR: [
        {
          email: {
            endsWith: CRM_E2E_EMAIL_DOMAIN,
          },
        },
        {
          shop_name: {
            startsWith: 'CRM E2E',
          },
        },
      ],
    },
    select: { customer_id: true },
  });

  const profileRows = await prisma.crmCustomerProfiles.findMany({
    where: {
      OR: [
        { id: { in: businessProfiles.map((profile) => profile.customer_id) } },
        { user_id: { in: userIds } },
        { owner_id: { in: userIds } },
      ],
    },
    select: { id: true },
  });
  const customerIds = [...new Set(profileRows.map((profile) => profile.id))];

  const deals = await prisma.crmDeals.findMany({
    where: {
      OR: [{ customer_id: { in: customerIds } }, { owner_id: { in: userIds } }],
    },
    select: { id: true },
  });
  const dealIds = [...new Set(deals.map((deal) => deal.id))];

  const dealDetails = dealIds.length
    ? await prisma.crmDealDetails.findMany({
        where: { deal_id: { in: dealIds } },
        select: { id: true },
      })
    : [];
  const dealDetailIds = dealDetails.map((detail) => detail.id);

  await prisma.crmNotifications.deleteMany({
    where: {
      OR: [
        { receiver_user_id: { in: userIds } },
        { actor_user_id: { in: userIds } },
        { customer_id: { in: customerIds } },
        { deal_id: { in: dealIds } },
      ],
    },
  });
  await prisma.crmFeedback.deleteMany({
    where: {
      OR: [
        { receiver_user_id: { in: userIds } },
        { actor_user_id: { in: userIds } },
        { customer_id: { in: customerIds } },
        { deal_id: { in: dealIds } },
      ],
    },
  });
  await prisma.crmKpiTargets.deleteMany({
    where: {
      OR: [{ owner_user_id: { in: userIds } }, { created_by: { in: userIds } }],
    },
  });
  await prisma.crmActivities.deleteMany({
    where: { customer_id: { in: customerIds } },
  });
  await prisma.crmTasks.deleteMany({
    where: { customer_id: { in: customerIds } },
  });
  await prisma.crmDealAssignments.deleteMany({
    where: {
      OR: [{ customer_id: { in: customerIds } }, { deal_id: { in: dealIds } }],
    },
  });
  await prisma.crmPipelineRecords.deleteMany({
    where: { deal_id: { in: dealIds } },
  });

  if (dealDetailIds.length) {
    await prisma.crmDealPayments.deleteMany({
      where: { deal_detail_id: { in: dealDetailIds } },
    });
  }

  await prisma.crmDealDetails.deleteMany({
    where: { deal_id: { in: dealIds } },
  });
  await prisma.crmDeals.deleteMany({
    where: {
      OR: [{ id: { in: dealIds } }, { customer_id: { in: customerIds } }],
    },
  });
  await prisma.crmCustomerBusinessProfiles.deleteMany({
    where: { customer_id: { in: customerIds } },
  });
  await prisma.crmCustomerProfiles.deleteMany({
    where: { id: { in: customerIds } },
  });
  await prisma.crmSyncJobs.deleteMany({
    where: { user_id: { in: userIds } },
  });
  await prisma.crmPipelineEvents.deleteMany({
    where: {
      entity_type: 'user',
      entity_id: { in: userIds },
    },
  });
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

export async function seedCrmBaseFixtures(
  prisma: PrismaService,
): Promise<CrmBaseFixtures> {
  await seedCrmLookups(prisma);

  const adminRole = await ensureRole(prisma, 'ADMIN');
  const managerRole = await ensureRole(prisma, 'SALE_MANAGER');
  const salesRole = await ensureRole(prisma, 'SALE');
  const noAccessRole = await ensureRole(prisma, 'CRM_E2E_NO_ACCESS');

  const permissionIds = await Promise.all(
    CRM_E2E_PERMISSIONS.map((permission) =>
      ensurePermission(prisma, permission),
    ),
  );

  await grantPermissionsToRole(prisma, adminRole.id, permissionIds);
  await grantPermissionsToRole(prisma, managerRole.id, permissionIds);
  await grantPermissionsToRole(prisma, salesRole.id, permissionIds);

  return {
    users: {
      admin: await createFixtureUser(prisma, {
        email: `crm-e2e-admin${CRM_E2E_EMAIL_DOMAIN}`,
        roleId: adminRole.id,
      }),
      manager: await createFixtureUser(prisma, {
        email: `crm-e2e-manager${CRM_E2E_EMAIL_DOMAIN}`,
        roleId: managerRole.id,
      }),
      sales: await createFixtureUser(prisma, {
        email: `crm-e2e-sales${CRM_E2E_EMAIL_DOMAIN}`,
        roleId: salesRole.id,
      }),
      otherSales: await createFixtureUser(prisma, {
        email: `crm-e2e-other-sales${CRM_E2E_EMAIL_DOMAIN}`,
        roleId: salesRole.id,
      }),
      noAccess: await createFixtureUser(prisma, {
        email: `crm-e2e-no-access${CRM_E2E_EMAIL_DOMAIN}`,
        roleId: noAccessRole.id,
      }),
    },
  };
}

async function seedCrmLookups(prisma: PrismaService): Promise<void> {
  await Promise.all([
    prisma.crmSources.upsert({
      where: { code: 'manual' },
      update: { label: 'Manual', is_active: true },
      create: { code: 'manual', label: 'Manual', is_active: true },
    }),
    prisma.crmSources.upsert({
      where: { code: 'website' },
      update: { label: 'Website Register', is_active: true },
      create: { code: 'website', label: 'Website Register', is_active: true },
    }),
  ]);

  for (const status of [
    ['new', 'New', 1],
    ['trial', 'Trial', 2],
    ['failed', 'Failed', 3],
    ['success', 'Success', 4],
  ] as const) {
    await prisma.crmStatuses.upsert({
      where: { code: status[0] },
      update: { label: status[1], sort_order: status[2], is_active: true },
      create: {
        code: status[0],
        label: status[1],
        sort_order: status[2],
        is_active: true,
      },
    });
  }

  for (const stage of [
    ['new_lead', 'new', 1, false],
    ['connect', 'new', 2, false],
    ['qualified', 'trial', 3, false],
    ['booking_demo', 'trial', 4, false],
    ['demo', 'trial', 5, false],
    ['proposal', 'trial', 6, false],
    ['negotiation', 'trial', 7, false],
    ['close_deal', 'success', 8, true],
    ['fail', 'failed', 9, true],
    ['lost_unqualified', 'failed', 10, true],
  ] as const) {
    await prisma.crmPipelineStages.upsert({
      where: { code: stage[0] },
      update: {
        label: stage[0],
        stage_order: stage[2],
        mapped_status_code: stage[1],
        is_terminal: stage[3],
        is_active: true,
      },
      create: {
        code: stage[0],
        label: stage[0],
        stage_order: stage[2],
        mapped_status_code: stage[1],
        is_terminal: stage[3],
        is_active: true,
      },
    });
  }

  for (const productPackage of [
    ['trial', 'Trial', 1],
    ['399', 'Gói 399k', 2],
    ['699', 'Gói 699k', 3],
  ] as const) {
    await prisma.crmProductPackages.upsert({
      where: { code: productPackage[0] },
      update: {
        label: productPackage[1],
        sort_order: productPackage[2],
        is_active: true,
      },
      create: {
        code: productPackage[0],
        label: productPackage[1],
        sort_order: productPackage[2],
        is_active: true,
      },
    });
  }

  await prisma.crmFailureReasons.upsert({
    where: { code: 'high_price' },
    update: { label: 'High price', sort_order: 1, is_active: true },
    create: {
      code: 'high_price',
      label: 'High price',
      sort_order: 1,
      is_active: true,
    },
  });

  await prisma.crmInteractionChannels.upsert({
    where: { code: 'call' },
    update: { label: 'Call', sort_order: 1, is_active: true },
    create: { code: 'call', label: 'Call', sort_order: 1, is_active: true },
  });
  await prisma.crmCallOutcomes.upsert({
    where: { code: 'connected' },
    update: { label: 'Connected', sort_order: 1, is_active: true },
    create: {
      code: 'connected',
      label: 'Connected',
      sort_order: 1,
      is_active: true,
    },
  });

  for (const category of [
    ['failure', 'Failure', 1],
    ['other', 'Other', 5],
  ] as const) {
    await prisma.crmFeedbackCategories.upsert({
      where: { code: category[0] },
      update: { label: category[1], sort_order: category[2], is_active: true },
      create: {
        code: category[0],
        label: category[1],
        sort_order: category[2],
        is_active: true,
      },
    });
  }

  for (const type of [
    ['customer_created', 'Customer created', 1],
    ['assignment_changed', 'Assignment changed', 2],
    ['pipeline_stage_changed', 'Pipeline stage changed', 4],
  ] as const) {
    await prisma.crmNotificationTypes.upsert({
      where: { code: type[0] },
      update: { label: type[1], sort_order: type[2], is_active: true },
      create: {
        code: type[0],
        label: type[1],
        sort_order: type[2],
        is_active: true,
      },
    });
  }
}

async function ensureRole(prisma: PrismaService, name: string) {
  const existing = await prisma.role.findFirst({
    where: { name, deleted_at: null },
  });

  if (existing) {
    return existing;
  }

  return prisma.role.create({
    data: {
      name,
      type: 'CRM_E2E',
      description: `${name} role for CRM E2E tests`,
    },
  });
}

async function ensurePermission(
  prisma: PrismaService,
  name: string,
): Promise<number> {
  const existing = await prisma.permission.findFirst({
    where: { name, deleted_at: null },
  });

  if (existing) {
    await prisma.permission.update({
      where: { id: existing.id },
      data: { is_active: true, type: 'CRM', scope: 'GLOBAL' },
    });

    return existing.id;
  }

  const permission = await prisma.permission.create({
    data: {
      name,
      type: 'CRM',
      is_active: true,
      scope: 'GLOBAL',
    },
  });

  return permission.id;
}

async function grantPermissionsToRole(
  prisma: PrismaService,
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  await prisma.permissionRole.createMany({
    data: permissionIds.map((permissionId) => ({
      permission_id: permissionId,
      role_id: roleId,
    })),
    skipDuplicates: true,
  });
}

async function createFixtureUser(
  prisma: PrismaService,
  params: { email: string; roleId: number },
) {
  return prisma.user.create({
    data: {
      email: params.email,
      username: params.email.split('@')[0],
      first_name: 'CRM',
      last_name: 'E2E',
      is_active: true,
      is_block: false,
      phone_number: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      role_id: params.roleId,
    },
    include: { role: true },
  });
}
