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

type PermissionLookup = {
  name: string | null;
  type: string | null;
  scope: string | null;
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
        },
        orderBy: [{ first_name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_name: true,
        },
      }),
      this.findRolePermissions(user.roleId),
    ]);

    const notesByStageCode = new Map(
      pipelineStageNotes.map((item) => [item.stage_code, item.note]),
    );

    return {
      permissions: {
        required: ['CRM_BOOTSTRAP_VIEW'],
        granted: permissions,
      },
      allowed: true,
      user,
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
        })),
      },
      defaults: {
        sourceCode: CRM_SYNC_DEFAULTS.SOURCE_CODE,
        pipelineStageCode: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
        statusCode: CRM_SYNC_DEFAULTS.PIPELINE_MAPPED_STATUS_CODE,
        productPackageCode: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
        tierCode: CRM_SYNC_DEFAULTS.CUSTOMER_TIER_CODE,
        ownerId: null,
        assigneeId: null,
        priorityCode: 'medium',
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
  ): Promise<PermissionLookup[]> {
    if (!roleId) return [];

    const permissions = await this.prisma.permissionRole.findMany({
      where: { role_id: roleId },
      select: {
        permission: {
          select: {
            name: true,
            type: true,
            scope: true,
            is_active: true,
          },
        },
      },
    });

    return permissions
      .map((item) => item.permission)
      .filter((item) => item.is_active !== false)
      .map((item) => ({
        name: item.name,
        type: item.type,
        scope: item.scope,
      }));
  }
}
