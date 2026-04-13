import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetCrmSyncQuery } from '../application/queries';
import { ProcessCrmSyncJobCommand } from '../application/commands';
import { ProcessCrmSyncJobDto } from './dto/process-crm-sync-job.dto';

@ApiTags('Crm Sync')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('internal/crm-sync')
export class CrmSyncController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get crm sync job detail by id' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetCrmSyncQuery(id));
  }

  @Post('process/:id')
  @ApiOperation({ summary: 'Process a crm sync job by id' })
  async processById(@Param('id', ParseIntPipe) id: number) {
    return this.commandBus.execute(new ProcessCrmSyncJobCommand(id));
  }

  @Post('process')
  @ApiOperation({ summary: 'Process a crm sync job from request body' })
  async process(@Body() { jobId }: ProcessCrmSyncJobDto) {
    return this.commandBus.execute(new ProcessCrmSyncJobCommand(jobId));
  }
}
