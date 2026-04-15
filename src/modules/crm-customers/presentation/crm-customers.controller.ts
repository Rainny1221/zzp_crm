import {
  Body,
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
import {
  GetCrmCustomerByIdQuery,
  GetCrmCustomersQuery,
} from '../application/queries';
import { UpdateCrmCustomerAssignmentCommand } from '../application/commands';
import { GetCrmCustomersDto } from './dto/get-crm-customers.dto';
import { UpdateCrmCustomerAssignmentDto } from './dto/update-crm-customer-assignment.dto';

@ApiTags('CRM Customers')
@ApiBearerAuth('access-token')
@Controller('crm/customers')
export class CrmCustomersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

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
}
