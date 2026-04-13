import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { GetCrmSyncQuery } from '../application/queries';
import { ProcessCrmSyncJobCommand } from '../application/commands';

@ApiTags('Crm Sync')
@ApiBearerAuth('access-token')
@Controller('internal/crm-sync')
export class CrmSyncController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get crm sync job detail by id' })
  @RequirePermissions('CRM_SYNC_VIEW')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetCrmSyncQuery(id));
  }

  @Post('process/:id')
  @ApiOperation({ summary: 'Process a crm sync job by id' })
  @RequirePermissions('CRM_SYNC_MANAGE')
  async processById(@Param('id', ParseIntPipe) id: number) {
    return this.commandBus.execute(new ProcessCrmSyncJobCommand(id));
  }
}
