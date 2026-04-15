import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-request.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CRM_CUSTOMER_TIER_OPTIONS,
  CRM_SYNC_DEFAULTS,
} from '../../crm-sync/domain/crm-sync.constants';

type LookupRow = {
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type ActiveLookupFindManyArgs = {
  where: { is_active: true };
  orderBy: Array<{ sort_order: 'asc' } | { code: 'asc' }>;
  select: {
    code: true;
    label: true;
    sort_order: true;
    is_active: true;
  };
};

type ActiveLookupDelegate = {
  findMany(args: ActiveLookupFindManyArgs): Promise<LookupRow[]>;
};

const CRM_PERMISSION_FLAGS = {
  canViewBootstrap: 'CRM_BOOTSTRAP_VIEW',
  canViewPipeline: 'CRM_PIPELINE_VIEW',
  canManagePipeline: 'CRM_PIPELINE_MANAGE',
  canViewCustomers: 'CRM_CUSTOMER_VIEW',
  canManageCustomers: 'CRM_CUSTOMER_MANAGE',
  canAssignLead: 'CRM_LEAD_ASSIGN',
  canViewSync: 'CRM_SYNC_VIEW',
  canManageSync: 'CRM_SYNC_MANAGE',
  canViewReports: 'CRM_REPORT_VIEW',
} as const;

const CRM_ASSIGNABLE_ROLE_NAMES = ['ADMIN', 'SALE_MANAGER', 'SALE'] as const;

const toLookupOption = (item: LookupRow) => ({
  code: item.code,
  label: item.label,
  sortOrder: item.sort_order,
  isActive: item.is_active,
});

const toActiveConstLookupOption = (item: {
  code: string;
  label: string;
  isActive: boolean;
}) => ({
  code: item.code,
  label: item.label,
  isActive: item.isActive,
});

@Injectable()
export class CrmBootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async getBootstrap(user: AuthenticatedUser) {
    const [
      pipelineStages,
      pipelineStageNotes,
      statuses,
      sources,
      productPackages,
      failureReasons,
      feedbackCategories,
      notificationTypes,
      interactionChannels,
      callOutcomes,
      messageOutcomes,
      taskTypes,
      priorities,
      assignees,
      permissions,
    ] = await Promise.all([
      this.prisma.crmPipelineStages.findMany({
        where: { is_active: true },
        orderBy: [{ stage_order: 'asc' }, { code: 'asc' }],
        select: {
          code: true,
          label: true,
          stage_order: true,
          mapped_status_code: true,
          is_terminal: true,
          is_active: true,
        },
      }),
      this.prisma.crmPipelineStageNotes.findMany({
        select: {
          stage_code: true,
          note: true,
        },
      }),
      this.findActiveLookup(this.prisma.crmStatuses),
      this.prisma.crmSources.findMany({
        where: { is_active: true },
        orderBy: { code: 'asc' },
        select: {
          code: true,
          label: true,
          is_active: true,
        },
      }),
      this.findActiveLookup(this.prisma.crmProductPackages),
      this.findActiveLookup(this.prisma.crmFailureReasons),
      this.findActiveLookup(this.prisma.crmFeedbackCategories),
      this.findActiveLookup(this.prisma.crmNotificationTypes),
      this.findActiveLookup(this.prisma.crmInteractionChannels),
      this.findActiveLookup(this.prisma.crmCallOutcomes),
      this.findActiveLookup(this.prisma.crmMessageOutcomes),
      this.findActiveLookup(this.prisma.crmTaskTypes),
      this.findActiveLookup(this.prisma.crmPriorities),
      this.prisma.user.findMany({
        where: {
          deleted_at: null,
          is_active: true,
          is_block: false,
          role: {
            is: {
              name: {
                in: [...CRM_ASSIGNABLE_ROLE_NAMES],
              },
            },
          },
        },
        orderBy: [{ first_name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_name: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.findRolePermissions(user.roleId),
    ]);

    const notesByStageCode = new Map(
      pipelineStageNotes.map((item) => [item.stage_code, item.note]),
    );

    return {
      user: this.normalizeUser(user),
      permissions: this.toPermissionMap(user, permissions),
      lookups: {
        pipelineStages: pipelineStages.map((item) => ({
          code: item.code,
          label: item.label,
          stageOrder: item.stage_order,
          mappedStatusCode: item.mapped_status_code,
          isTerminal: item.is_terminal,
          isActive: item.is_active,
          note: notesByStageCode.get(item.code) ?? null,
        })),
        statuses: statuses.map(toLookupOption),
        tiers: CRM_CUSTOMER_TIER_OPTIONS.map(toActiveConstLookupOption),
        sources: sources.map((item) => ({
          code: item.code,
          label: item.label,
          isActive: item.is_active,
        })),
        productPackages: productPackages.map(toLookupOption),
        failureReasons: failureReasons.map(toLookupOption),
        feedbackCategories: feedbackCategories.map(toLookupOption),
        notificationTypes: notificationTypes.map(toLookupOption),
        interactionChannels: interactionChannels.map(toLookupOption),
        callOutcomes: callOutcomes.map(toLookupOption),
        messageOutcomes: messageOutcomes.map(toLookupOption),
        taskTypes: taskTypes.map(toLookupOption),
        priorities: priorities.map(toLookupOption),
        assignees: assignees.map((item) => ({
          id: item.id,
          name:
            [item.first_name, item.last_name].filter(Boolean).join(' ') ||
            item.username ||
            item.email ||
            `User ${item.id}`,
          email: item.email,
          avatarName: item.avatar_name,
          roleName: item.role?.name ?? null,
        })),
      },
      defaults: {
        sourceCode: CRM_SYNC_DEFAULTS.SOURCE_CODE,
        pipelineStageCode: CRM_SYNC_DEFAULTS.PIPELINE_STAGE_CODE,
        statusCode: CRM_SYNC_DEFAULTS.PIPELINE_MAPPED_STATUS_CODE,
        productPackageCode: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
        tierCode: CRM_SYNC_DEFAULTS.CUSTOMER_TIER_CODE,
        ownerId: null,
        assigneeId: null,
        priorityCode: CRM_SYNC_DEFAULTS.PRIORITY_CODE,
        probability: CRM_SYNC_DEFAULTS.PROBABILITY,
      },
    };
  }

  private findActiveLookup(
    delegate: ActiveLookupDelegate,
  ): Promise<LookupRow[]> {
    return delegate.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        label: true,
        sort_order: true,
        is_active: true,
      },
    });
  }

  private async findRolePermissions(
    roleId: number | undefined,
  ): Promise<string[]> {
    if (!roleId) return [];

    const permissions = await this.prisma.permissionRole.findMany({
      where: { role_id: roleId },
      select: {
        permission: {
          select: {
            name: true,
            is_active: true,
          },
        },
      },
    });

    return permissions
      .map((item) => item.permission)
      .filter((item) => item.is_active !== false)
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name));
  }

  private normalizeUser(user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email ?? null,
      roleId: user.roleId ?? null,
      roleName: user.roleName ?? null,
      currentParentUserId: user.currentParentUserId,
      isActive: user.isActive,
      isBlock: user.isBlock,
    };
  }

  private toPermissionMap(user: AuthenticatedUser, permissions: string[]) {
    const isAdmin = user.roleName === 'ADMIN';
    const grantedPermissions = new Set(permissions);

    return Object.fromEntries(
      Object.entries(CRM_PERMISSION_FLAGS).map(([flag, permission]) => [
        flag,
        isAdmin || grantedPermissions.has(permission),
      ]),
    ) as Record<keyof typeof CRM_PERMISSION_FLAGS, boolean>;
  }
}
