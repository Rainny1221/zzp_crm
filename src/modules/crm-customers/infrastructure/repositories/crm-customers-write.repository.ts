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
} from '../../domain/crm-customers.constants';
import type {
  CreateCrmCustomerNoteCommand,
  CreateCrmCustomerNoteResult,
  UpdateCrmCustomerAssignmentCommand,
  UpdateCrmCustomerAssignmentResult,
} from '../../application/commands';

type CreateNoteParams = CreateCrmCustomerNoteCommand['params'];
type UpdateAssignmentParams = UpdateCrmCustomerAssignmentCommand['params'];
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

  private buildAssignmentActivityDescription(
    params: UpdateAssignmentParams,
  ): string {
    const action =
      params.assigneeId === null
        ? 'Lead was unassigned.'
        : `Lead was assigned to user #${params.assigneeId}.`;

    return params.note ? `${action} Note: ${params.note}` : action;
  }
}
