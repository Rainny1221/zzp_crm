import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import {
  GetCrmCustomerByIdQuery,
  GetCrmCustomersQuery,
} from '../application/queries';
import {
  CreateCrmCustomerCommand,
  CreateCrmCustomerInteractionCommand,
  CreateCrmCustomerNoteCommand,
  UpdateCrmCustomerAssignmentCommand,
  UpdateCrmCustomerPipelineStageCommand,
  UpdateCrmCustomerProductPackageCommand,
} from '../application/commands';
import { CRM_CUSTOMER_CREATE_DEFAULTS } from '../domain/crm-customers.constants';
import { CreateCrmCustomerDto } from './dto/create-crm-customer.dto';
import { CreateCrmCustomerInteractionDto } from './dto/create-crm-customer-interaction.dto';
import { CreateCrmCustomerNoteDto } from './dto/create-crm-customer-note.dto';
import { GetCrmCustomersDto } from './dto/get-crm-customers.dto';
import { UpdateCrmCustomerAssignmentDto } from './dto/update-crm-customer-assignment.dto';
import { UpdateCrmCustomerPipelineStageDto } from './dto/update-crm-customer-pipeline-stage.dto';
import { UpdateCrmCustomerProductPackageDto } from './dto/update-crm-customer-product-package.dto';

@ApiTags('CRM Customers')
@ApiBearerAuth('access-token')
@Controller('crm/customers')
export class CrmCustomersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create CRM customer' })
  @RequirePermissions('CRM_CUSTOMER_CREATE')
  async createCustomer(
    @Body() dto: CreateCrmCustomerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new CreateCrmCustomerCommand({
        shopName: dto.shopName,
        phone: dto.phone,
        email: dto.email,
        tiktokLink: dto.tiktokLink,
        gmvMonthly: dto.gmvMonthly ?? null,
        industry: dto.industry,
        jobTitle: dto.jobTitle,
        province: dto.province,
        source: dto.source,
        partnerName: dto.partnerName,
        sourceNote: dto.sourceNote,
        assigneeId: dto.assigneeId ?? null,
        productPackage: dto.productPackage,
        dealValue: dto.dealValue ?? CRM_CUSTOMER_CREATE_DEFAULTS.DEAL_VALUE,
        note: dto.note,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get CRM customers list' })
  @RequirePermissions('CRM_CUSTOMER_VIEW')
  async getCustomers(
    @Query() query: GetCrmCustomersDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queryBus.execute(
      new GetCrmCustomersQuery({
        ...query,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CRM customer detail' })
  @RequirePermissions('CRM_CUSTOMER_VIEW')
  async getCustomerById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queryBus.execute(
      new GetCrmCustomerByIdQuery({
        customerId: id,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Patch(':id/assignment')
  @ApiOperation({ summary: 'Assign or unassign CRM customer owner' })
  @RequirePermissions('CRM_ASSIGN_LEAD')
  async updateAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCrmCustomerAssignmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new UpdateCrmCustomerAssignmentCommand({
        customerId: id,
        assigneeId: dto.assigneeId,
        note: dto.note,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create CRM customer note' })
  @RequirePermissions('CRM_CUSTOMER_MANAGE')
  async createNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCrmCustomerNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new CreateCrmCustomerNoteCommand({
        customerId: id,
        content: dto.content,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Post(':id/interactions')
  @ApiOperation({ summary: 'Create CRM customer interaction' })
  @RequirePermissions('CRM_CUSTOMER_MANAGE')
  async createInteraction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCrmCustomerInteractionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new CreateCrmCustomerInteractionCommand({
        customerId: id,
        channel: dto.channel,
        outcomeCode: dto.outcomeCode,
        summary: dto.summary,
        occurredAt: dto.occurredAt,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Patch(':id/pipeline-stage')
  @ApiOperation({ summary: 'Update CRM customer pipeline stage' })
  @RequirePermissions('CRM_PIPELINE_MANAGE')
  async updatePipelineStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCrmCustomerPipelineStageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new UpdateCrmCustomerPipelineStageCommand({
        customerId: id,
        pipelineStage: dto.pipelineStage,
        note: dto.note,
        failureReason: dto.failureReason ?? null,
        failureNote: dto.failureNote ?? null,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Patch(':id/product-package')
  @ApiOperation({ summary: 'Update CRM customer product package' })
  @RequirePermissions('CRM_PIPELINE_MANAGE')
  async updateProductPackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCrmCustomerProductPackageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new UpdateCrmCustomerProductPackageCommand({
        customerId: id,
        productPackage: dto.productPackage,
        dealValue: dto.dealValue ?? null,
        note: dto.note,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? null,
        actorRoleName: req.user.roleName ?? null,
      }),
    );
  }
}
