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
import { MarkCrmFeedbackReadCommand } from '../application/commands';
import { GetCrmFeedbackQuery } from '../application/queries';
import { GetCrmFeedbackDto } from './dto/get-crm-feedback.dto';

@ApiTags('CRM Feedback')
@ApiBearerAuth('access-token')
@Controller('crm/feedback')
export class CrmFeedbackController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get CRM feedback inbox' })
  @RequirePermissions('CRM_FEEDBACK_VIEW')
  async getFeedback(
    @Query() query: GetCrmFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.queryBus.execute(
      new GetCrmFeedbackQuery({
        receiverUserId: req.user.id,
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
        category: query.category,
        customerId: query.customerId ?? null,
      }),
    );

    return result;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark CRM feedback as read' })
  @RequirePermissions('CRM_FEEDBACK_MANAGE')
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.commandBus.execute(
      new MarkCrmFeedbackReadCommand({
        feedbackId: id,
        receiverUserId: req.user.id,
      }),
    );

    return result;
  }
}
