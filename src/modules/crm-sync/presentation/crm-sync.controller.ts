import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { GetCrmSyncJobsQuery, GetCrmSyncQuery } from '../application/queries';
import {
  BackfillCrmSyncCommand,
  ProcessCrmSyncJobCommand,
  ReplayCrmSyncJobCommand,
} from '../application/commands';
import { GetCrmSyncJobsDto } from './dto/get-crm-sync-jobs.dto';
import { BackfillCrmSyncDto } from './dto/backfill-crm-sync.dto';

@ApiTags('Crm Sync')
@ApiBearerAuth('access-token')
@Controller('internal/crm-sync')
export class CrmSyncController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List crm sync jobs' })
  @RequirePermissions('CRM_SYNC_VIEW')
  async getJobs(@Query() query: GetCrmSyncJobsDto) {
    return this.queryBus.execute(
      new GetCrmSyncJobsQuery({
        status: query.status,
        eventType: query.eventType,
        page: query.page,
        limit: query.limit,
      }),
    );
  }

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

  @Post('replay/:id')
  @ApiOperation({ summary: 'Replay a failed crm sync job by id' })
  @RequirePermissions('CRM_SYNC_MANAGE')
  async replay(@Param('id', ParseIntPipe) id: number) {
    return this.commandBus.execute(new ReplayCrmSyncJobCommand(id));
  }

  @Post('backfill')
  @ApiOperation({ summary: 'Backfill crm sync jobs for existing users' })
  @RequirePermissions('CRM_SYNC_MANAGE')
  async backfill(@Body() dto: BackfillCrmSyncDto) {
    return this.commandBus.execute(new BackfillCrmSyncCommand(dto.limit));
  }
}
