import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { MarkCrmNotificationReadCommand } from '../application/commands';
import { GetCrmNotificationsQuery } from '../application/queries';
import { GetCrmNotificationsDto } from './dto/get-crm-notifications.dto';

@ApiTags('CRM Notifications')
@ApiBearerAuth('access-token')
@Controller('crm/notifications')
export class CrmNotificationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get CRM notifications' })
  @RequirePermissions('CRM_NOTIFICATION_VIEW')
  async getNotifications(
    @Query() query: GetCrmNotificationsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.queryBus.execute(
      new GetCrmNotificationsQuery({
        receiverUserId: req.user.id,
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
        type: query.type,
        customerId: query.customerId ?? null,
      }),
    );

    return result;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark CRM notification as read' })
  @RequirePermissions('CRM_NOTIFICATION_MANAGE')
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.commandBus.execute(
      new MarkCrmNotificationReadCommand({
        notificationId: id,
        receiverUserId: req.user.id,
      }),
    );

    return result;
  }
}
