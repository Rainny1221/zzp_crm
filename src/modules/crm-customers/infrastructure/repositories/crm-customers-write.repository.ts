import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { Prisma } from 'src/generated/prisma/client';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CRM_ACTIVITY_TYPE,
  CRM_CUSTOMER_ASSIGNABLE_ROLE_NAMES,
  CRM_CUSTOMERS_LOG,
  CRM_FAILURE_PIPELINE_STAGES,
  CRM_INTERACTION_CHANNEL_CODES,
  CRM_PIPELINE_STAGE_TO_STATUS,
} from '../../domain/crm-customers.constants';
import type {
  CreateCrmCustomerInteractionCommand,
  CreateCrmCustomerInteractionResult,
  CreateCrmCustomerNoteCommand,
  CreateCrmCustomerNoteResult,
  UpdateCrmCustomerAssignmentCommand,
  UpdateCrmCustomerAssignmentResult,
  UpdateCrmCustomerPipelineStageCommand,
  UpdateCrmCustomerPipelineStageResult,
} from '../../application/commands';

type CreateInteractionParams = CreateCrmCustomerInteractionCommand['params'];
type CreateNoteParams = CreateCrmCustomerNoteCommand['params'];
type UpdateAssignmentParams = UpdateCrmCustomerAssignmentCommand['params'];
type UpdatePipelineStageParams =
  UpdateCrmCustomerPipelineStageCommand['params'];
type ActorLookupParams = {
  actorUserId: number;
  actorEmail?: string | null;
};

type UserSnapshot = {
  id: number;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_name: string | null;
  role: {
    name: string | null;
  } | null;
};

type LookupCodeSnapshot = {
  code: string;
};

const CRM_CUSTOMERS_TRANSACTION = {
  MAX_WAIT_MS: 1000,
  LOCK_TIMEOUT_MS: 1000,
  TIMEOUT_MS: 3000,
} as const;

const toUserDisplayName = (user: UserSnapshot): string | null =>
  [user.first_name, user.last_name].filter(Boolean).join(' ') ||
  user.username ||
  user.email;

const toOwnerSnapshot = (
  assignee: UserSnapshot | null,
): UpdateCrmCustomerAssignmentResult['owner'] => {
  if (!assignee) return null;

  return {
    id: String(assignee.id),
    name: toUserDisplayName(assignee),
    email: assignee.email,
    avatarName: assignee.avatar_name,
    roleName: assignee.role?.name ?? null,
  };
};

const toInteractionActivityType = (
  channel: CreateInteractionParams['channel'],
): string =>
  channel === 'call'
    ? CRM_ACTIVITY_TYPE.CALL_LOGGED
    : CRM_ACTIVITY_TYPE.MESSAGE_LOGGED;

const isFailurePipelineStage = (
  pipelineStage: UpdatePipelineStageParams['pipelineStage'],
): boolean =>
  CRM_FAILURE_PIPELINE_STAGES.some((stage) => stage === pipelineStage);

@Injectable()
export class CrmCustomersWriteRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async updateAssignment(
    params: UpdateAssignmentParams,
  ): Promise<UpdateCrmCustomerAssignmentResult> {
    const actor = await this.findActiveActor(params);
    const assignee =
      params.assigneeId === null
        ? null
        : await this.findEligibleAssignee(params.assigneeId);

    if (!actor) {
      throw ErrorFactory.create(
        ErrorCode.INVALID_TOKEN,
        'Authenticated CRM actor not found',
        {
          actorUserId: params.actorUserId,
          actorEmail: params.actorEmail ?? null,
        },
      );
    }

    if (params.assigneeId !== null && !assignee) {
      throw ErrorFactory.create(
        ErrorCode.ITEM_NOT_FOUND,
        'CRM assignee not found or not eligible',
        { assigneeId: params.assigneeId },
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx): Promise<UpdateCrmCustomerAssignmentResult> => {
          await tx.$queryRaw<Array<{ set_config: string }>>`
            SELECT set_config(
              'lock_timeout',
              ${`${CRM_CUSTOMERS_TRANSACTION.LOCK_TIMEOUT_MS}ms`},
              true
            )
          `;

          const customer = await tx.crmCustomerProfiles.findUnique({
            where: { id: params.customerId },
            include: { deal: true },
          });

          if (!customer) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM customer not found',
              { customerId: params.customerId },
            );
          }

          const deal = customer.deal;

          if (!deal) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM deal not found for customer',
              { customerId: params.customerId },
            );
          }

          const previousAssigneeId = deal.owner_id;
          const changed = previousAssigneeId !== params.assigneeId;
          const now = new Date();

          if (changed) {
            await tx.crmDeals.update({
              where: { id: deal.id },
              data: {
                owner_id: params.assigneeId,
                updated_at: now,
              },
            });

            await tx.crmCustomerProfiles.update({
              where: { id: customer.id },
              data: {
                owner_id: params.assigneeId,
              },
            });

            await tx.crmDealAssignments.create({
              data: {
                deal_id: deal.id,
                customer_id: customer.id,
                from_user_id: previousAssigneeId,
                to_user_id: params.assigneeId,
                note: params.note ?? null,
                created_by: actor.id,
                created_at: now,
              },
            });

            await tx.crmActivities.create({
              data: {
                customer_id: customer.id,
                activity_type_code:
                  params.assigneeId === null
                    ? CRM_ACTIVITY_TYPE.UNASSIGNED
                    : CRM_ACTIVITY_TYPE.ASSIGNMENT_CHANGED,
                description: this.buildAssignmentActivityDescription(params),
                author_user_id: actor.id,
                author_name: toOwnerSnapshot(actor)?.name ?? null,
                occurred_at: now,
                created_at: now,
              },
            });
          }

          return {
            customerId: String(customer.id),
            dealId: String(deal.id),
            previousAssigneeId:
              previousAssigneeId === null ? null : String(previousAssigneeId),
            assigneeId:
              params.assigneeId === null ? null : String(params.assigneeId),
            owner: toOwnerSnapshot(assignee),
            changed,
            changedAt: now.toISOString(),
          };
        },
        {
          maxWait: CRM_CUSTOMERS_TRANSACTION.MAX_WAIT_MS,
          timeout: CRM_CUSTOMERS_TRANSACTION.TIMEOUT_MS,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to update CRM customer assignment',
        context: CrmCustomersWriteRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_ASSIGNMENT,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: params.customerId,
        meta: {
          params,
          error: toErrorMeta(error),
        },
      });

      throw error;
    }
  }

  async createInteraction(
    params: CreateInteractionParams,
  ): Promise<CreateCrmCustomerInteractionResult> {
    const summary = params.summary.trim();
    const outcomeCode = params.outcomeCode.trim();
    const occurredAt = params.occurredAt
      ? new Date(params.occurredAt)
      : new Date();

    if (!this.isSupportedInteractionChannel(params.channel)) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction channel is invalid',
        { channel: params.channel },
      );
    }

    if (!summary || summary.length > 2000) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction summary is required',
        { customerId: params.customerId },
      );
    }

    if (!outcomeCode || outcomeCode.length > 100) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction outcome code is required',
        { customerId: params.customerId, channel: params.channel },
      );
    }

    if (Number.isNaN(occurredAt.getTime())) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction occurredAt is invalid',
        { customerId: params.customerId, occurredAt: params.occurredAt },
      );
    }

    const [actor, channel, outcome] = await Promise.all([
      this.findActiveActor(params),
      this.findActiveInteractionChannel(params.channel),
      this.findActiveInteractionOutcome(params.channel, outcomeCode),
    ]);

    if (!actor) {
      throw ErrorFactory.create(
        ErrorCode.INVALID_TOKEN,
        'Authenticated CRM actor not found',
        {
          actorUserId: params.actorUserId,
          actorEmail: params.actorEmail ?? null,
        },
      );
    }

    if (!channel) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction channel is not configured or inactive',
        { channel: params.channel },
      );
    }

    if (!outcome) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM interaction outcome is not configured or inactive',
        {
          channel: params.channel,
          outcomeCode,
        },
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx): Promise<CreateCrmCustomerInteractionResult> => {
          await tx.$queryRaw<Array<{ set_config: string }>>`
            SELECT set_config(
              'lock_timeout',
              ${`${CRM_CUSTOMERS_TRANSACTION.LOCK_TIMEOUT_MS}ms`},
              true
            )
          `;

          const customer = await tx.crmCustomerProfiles.findUnique({
            where: { id: params.customerId },
            select: {
              id: true,
              deal: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!customer) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM customer not found',
              { customerId: params.customerId },
            );
          }

          if (!customer.deal) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM deal not found for customer',
              { customerId: params.customerId },
            );
          }

          const now = new Date();
          const authorName = toUserDisplayName(actor);
          const activityType = toInteractionActivityType(params.channel);
          const activity = await tx.crmActivities.create({
            data: {
              customer_id: customer.id,
              activity_type_code: activityType,
              description: this.buildInteractionActivityDescription(
                params.channel,
                outcomeCode,
                summary,
              ),
              author_user_id: actor.id,
              author_name: authorName,
              occurred_at: occurredAt,
              created_at: now,
            },
            select: {
              id: true,
              occurred_at: true,
            },
          });

          const lastContactRows = await tx.$queryRaw<
            Array<{ last_contacted_at: Date }>
          >`
            INSERT INTO crm_deal_details (
              deal_id,
              last_contacted_at,
              created_at,
              updated_at
            )
            VALUES (
              ${customer.deal.id},
              ${occurredAt},
              ${now},
              ${now}
            )
            ON CONFLICT (deal_id) DO UPDATE
            SET
              last_contacted_at = GREATEST(
                COALESCE(
                  crm_deal_details.last_contacted_at,
                  EXCLUDED.last_contacted_at
                ),
                EXCLUDED.last_contacted_at
              ),
              updated_at = ${now}
            RETURNING last_contacted_at
          `;

          const lastContactedAt =
            lastContactRows[0]?.last_contacted_at ?? occurredAt;

          return {
            customerId: String(customer.id),
            activityId: String(activity.id),
            type: activityType,
            channel: params.channel,
            outcomeCode,
            summary,
            author: {
              id: String(actor.id),
              name: authorName,
              email: actor.email,
            },
            occurredAt: activity.occurred_at.toISOString(),
            lastContactedAt: lastContactedAt.toISOString(),
            lastActivityAt: activity.occurred_at.toISOString(),
          };
        },
        {
          maxWait: CRM_CUSTOMERS_TRANSACTION.MAX_WAIT_MS,
          timeout: CRM_CUSTOMERS_TRANSACTION.TIMEOUT_MS,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to create CRM customer interaction',
        context: CrmCustomersWriteRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_INTERACTION,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: params.customerId,
        meta: {
          params: {
            customerId: params.customerId,
            channel: params.channel,
            outcomeCode,
            occurredAt: activityDateToLogValue(occurredAt),
            actorUserId: params.actorUserId,
            actorEmail: params.actorEmail ?? null,
            actorRoleName: params.actorRoleName ?? null,
            summaryLength: summary.length,
          },
          error: toErrorMeta(error),
        },
      });

      throw error;
    }
  }

  async updatePipelineStage(
    params: UpdatePipelineStageParams,
  ): Promise<UpdateCrmCustomerPipelineStageResult> {
    const note = params.note?.trim() || undefined;
    const requestedFailureReason = params.failureReason?.trim() || null;
    const requestedFailureNote = params.failureNote?.trim() || null;
    const isFailureStage = isFailurePipelineStage(params.pipelineStage);
    const nextStatus = CRM_PIPELINE_STAGE_TO_STATUS[params.pipelineStage];
    const failureReason = isFailureStage ? requestedFailureReason : null;
    const failureNote = isFailureStage ? requestedFailureNote : null;

    if (isFailureStage && !failureReason) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'Failure reason is required for failed/lost pipeline stages',
        {
          customerId: params.customerId,
          pipelineStage: params.pipelineStage,
        },
      );
    }

    const [actor, activeFailureReason] = await Promise.all([
      this.findActiveActor(params),
      failureReason
        ? this.findActiveFailureReason(failureReason)
        : Promise.resolve(null),
    ]);

    if (!actor) {
      throw ErrorFactory.create(
        ErrorCode.INVALID_TOKEN,
        'Authenticated CRM actor not found',
        {
          actorUserId: params.actorUserId,
          actorEmail: params.actorEmail ?? null,
        },
      );
    }

    if (failureReason && !activeFailureReason) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM failure reason is not configured or inactive',
        { failureReason },
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx): Promise<UpdateCrmCustomerPipelineStageResult> => {
          await tx.$queryRaw<Array<{ set_config: string }>>`
            SELECT set_config(
              'lock_timeout',
              ${`${CRM_CUSTOMERS_TRANSACTION.LOCK_TIMEOUT_MS}ms`},
              true
            )
          `;

          const customer = await tx.crmCustomerProfiles.findUnique({
            where: { id: params.customerId },
            select: {
              id: true,
              deal: true,
            },
          });

          if (!customer) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM customer not found',
              { customerId: params.customerId },
            );
          }

          if (!customer.deal) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM deal not found for customer',
              { customerId: params.customerId },
            );
          }

          const targetStage = await tx.crmPipelineStages.findFirst({
            where: {
              code: params.pipelineStage,
              is_active: true,
            },
            select: {
              code: true,
              mapped_status_code: true,
            },
          });

          if (!targetStage) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM pipeline stage not found or inactive',
              { pipelineStage: params.pipelineStage },
            );
          }

          const deal = customer.deal;
          const previousPipelineStage = deal.pipeline_stage_code;
          const previousStatus = deal.status;
          const changed = previousPipelineStage !== params.pipelineStage;
          const now = new Date();

          if (!changed) {
            const currentDealDetail = await tx.crmDealDetails.findUnique({
              where: {
                deal_id: deal.id,
              },
              select: {
                failure_reason_code: true,
                failure_note: true,
              },
            });

            return {
              customerId: String(customer.id),
              dealId: String(deal.id),
              previousPipelineStage,
              pipelineStage: params.pipelineStage,
              previousStatus,
              status: nextStatus,
              failureReason: currentDealDetail?.failure_reason_code ?? null,
              failureNote: currentDealDetail?.failure_note ?? null,
              changed,
              changedAt: now.toISOString(),
            };
          }

          await tx.crmDeals.update({
            where: { id: deal.id },
            data: {
              pipeline_stage_code: params.pipelineStage,
              status: nextStatus,
              updated_at: now,
            },
          });

          await tx.crmDealDetails.upsert({
            where: {
              deal_id: deal.id,
            },
            update: {
              failure_reason_code: failureReason,
              failure_note: failureNote,
              updated_at: now,
            },
            create: {
              deal_id: deal.id,
              failure_reason_code: failureReason,
              failure_note: failureNote,
              created_at: now,
              updated_at: now,
            },
          });

          await tx.crmPipelineRecords.create({
            data: {
              deal_id: deal.id,
              stage_code: params.pipelineStage,
              owner_id: deal.owner_id,
              created_at: now,
              updated_at: now,
            },
          });

          await tx.crmActivities.create({
            data: {
              customer_id: customer.id,
              activity_type_code: CRM_ACTIVITY_TYPE.PIPELINE_STAGE_CHANGED,
              description: this.buildPipelineStageActivityDescription({
                fromStage: previousPipelineStage,
                toStage: params.pipelineStage,
                note,
                failureReason,
                failureNote,
              }),
              author_user_id: actor.id,
              author_name: toUserDisplayName(actor),
              occurred_at: now,
              created_at: now,
            },
          });

          return {
            customerId: String(customer.id),
            dealId: String(deal.id),
            previousPipelineStage,
            pipelineStage: params.pipelineStage,
            previousStatus,
            status: nextStatus,
            failureReason,
            failureNote,
            changed,
            changedAt: now.toISOString(),
          };
        },
        {
          maxWait: CRM_CUSTOMERS_TRANSACTION.MAX_WAIT_MS,
          timeout: CRM_CUSTOMERS_TRANSACTION.TIMEOUT_MS,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to update CRM customer pipeline stage',
        context: CrmCustomersWriteRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_PIPELINE_STAGE,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: params.customerId,
        meta: {
          params: {
            customerId: params.customerId,
            pipelineStage: params.pipelineStage,
            failureReason,
            actorUserId: params.actorUserId,
            actorEmail: params.actorEmail ?? null,
            actorRoleName: params.actorRoleName ?? null,
            noteLength: note?.length ?? 0,
            failureNoteLength: failureNote?.length ?? 0,
          },
          error: toErrorMeta(error),
        },
      });

      throw error;
    }
  }

  async createNote(
    params: CreateNoteParams,
  ): Promise<CreateCrmCustomerNoteResult> {
    const content = params.content.trim();

    if (!content) {
      throw ErrorFactory.create(
        ErrorCode.VALIDATION_ERROR,
        'CRM customer note content is required',
        { customerId: params.customerId },
      );
    }

    const actor = await this.findActiveActor(params);

    if (!actor) {
      throw ErrorFactory.create(
        ErrorCode.INVALID_TOKEN,
        'Authenticated CRM actor not found',
        {
          actorUserId: params.actorUserId,
          actorEmail: params.actorEmail ?? null,
        },
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx): Promise<CreateCrmCustomerNoteResult> => {
          await tx.$queryRaw<Array<{ set_config: string }>>`
            SELECT set_config(
              'lock_timeout',
              ${`${CRM_CUSTOMERS_TRANSACTION.LOCK_TIMEOUT_MS}ms`},
              true
            )
          `;

          const customer = await tx.crmCustomerProfiles.findUnique({
            where: { id: params.customerId },
            select: {
              id: true,
              deal: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!customer) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM customer not found',
              { customerId: params.customerId },
            );
          }

          if (!customer.deal) {
            throw ErrorFactory.create(
              ErrorCode.ITEM_NOT_FOUND,
              'CRM deal not found for customer',
              { customerId: params.customerId },
            );
          }

          const now = new Date();
          const authorName = toUserDisplayName(actor);
          const activity = await tx.crmActivities.create({
            data: {
              customer_id: customer.id,
              activity_type_code: CRM_ACTIVITY_TYPE.NOTE_ADDED,
              description: content,
              author_user_id: actor.id,
              author_name: authorName,
              occurred_at: now,
              created_at: now,
            },
            select: {
              id: true,
              occurred_at: true,
            },
          });

          return {
            customerId: String(customer.id),
            activityId: String(activity.id),
            type: CRM_ACTIVITY_TYPE.NOTE_ADDED,
            content,
            author: {
              id: String(actor.id),
              name: authorName,
              email: actor.email,
            },
            createdAt: activity.occurred_at.toISOString(),
          };
        },
        {
          maxWait: CRM_CUSTOMERS_TRANSACTION.MAX_WAIT_MS,
          timeout: CRM_CUSTOMERS_TRANSACTION.TIMEOUT_MS,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to create CRM customer note',
        context: CrmCustomersWriteRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_NOTE,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: params.customerId,
        meta: {
          params: {
            customerId: params.customerId,
            actorUserId: params.actorUserId,
            actorEmail: params.actorEmail ?? null,
            actorRoleName: params.actorRoleName ?? null,
            contentLength: content.length,
          },
          error: toErrorMeta(error),
        },
      });

      throw error;
    }
  }

  private async findEligibleAssignee(
    assigneeId: number,
  ): Promise<UserSnapshot | null> {
    return this.prisma.user.findFirst({
      where: {
        id: assigneeId,
        deleted_at: null,
        is_active: true,
        is_block: false,
        role: {
          is: {
            name: {
              in: [...CRM_CUSTOMER_ASSIGNABLE_ROLE_NAMES],
            },
          },
        },
      },
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
    });
  }

  private async findActiveInteractionChannel(
    channel: CreateInteractionParams['channel'],
  ): Promise<LookupCodeSnapshot | null> {
    return this.prisma.crmInteractionChannels.findFirst({
      where: {
        code: channel,
        is_active: true,
      },
      select: {
        code: true,
      },
    });
  }

  private async findActiveInteractionOutcome(
    channel: CreateInteractionParams['channel'],
    outcomeCode: string,
  ): Promise<LookupCodeSnapshot | null> {
    if (channel === 'call') {
      return this.prisma.crmCallOutcomes.findFirst({
        where: {
          code: outcomeCode,
          is_active: true,
        },
        select: {
          code: true,
        },
      });
    }

    return this.prisma.crmMessageOutcomes.findFirst({
      where: {
        code: outcomeCode,
        is_active: true,
      },
      select: {
        code: true,
      },
    });
  }

  private async findActiveFailureReason(
    failureReason: string,
  ): Promise<LookupCodeSnapshot | null> {
    return this.prisma.crmFailureReasons.findFirst({
      where: {
        code: failureReason,
        is_active: true,
      },
      select: {
        code: true,
      },
    });
  }

  private async findActiveActor(
    params: ActorLookupParams,
  ): Promise<UserSnapshot | null> {
    const actorById = await this.prisma.user.findFirst({
      where: {
        id: params.actorUserId,
        deleted_at: null,
        is_active: true,
        is_block: false,
      },
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
    });

    if (actorById || !params.actorEmail) {
      return actorById;
    }

    return this.prisma.user.findFirst({
      where: {
        email: params.actorEmail,
        deleted_at: null,
        is_active: true,
        is_block: false,
      },
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
    });
  }

  private isSupportedInteractionChannel(
    channel: string,
  ): channel is CreateInteractionParams['channel'] {
    return CRM_INTERACTION_CHANNEL_CODES.some((item) => item === channel);
  }

  private buildAssignmentActivityDescription(
    params: UpdateAssignmentParams,
  ): string {
    const action =
      params.assigneeId === null
        ? 'Lead was unassigned.'
        : `Lead was assigned to user #${params.assigneeId}.`;

    return params.note ? `${action} Note: ${params.note}` : action;
  }

  private buildInteractionActivityDescription(
    channel: CreateInteractionParams['channel'],
    outcomeCode: string,
    summary: string,
  ): string {
    return `Interaction ${channel} logged with outcome ${outcomeCode}. Summary: ${summary}`;
  }

  private buildPipelineStageActivityDescription(params: {
    fromStage: string;
    toStage: string;
    note?: string;
    failureReason?: string | null;
    failureNote?: string | null;
  }): string {
    const parts = [
      `Pipeline stage changed from "${params.fromStage}" to "${params.toStage}".`,
    ];

    if (params.failureReason) {
      parts.push(`Failure reason: ${params.failureReason}.`);
    }

    if (params.failureNote) {
      parts.push(`Failure note: ${params.failureNote}.`);
    }

    if (params.note) {
      parts.push(`Note: ${params.note}`);
    }

    return parts.join(' ');
  }
}

const activityDateToLogValue = (date: Date): string | null =>
  Number.isNaN(date.getTime()) ? null : date.toISOString();
