import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import {
  GetCrmCustomerByIdQuery,
  GetCrmCustomersQuery,
} from '../application/queries';
import { GetCrmCustomersDto } from './dto/get-crm-customers.dto';

@ApiTags('CRM Customers')
@ApiBearerAuth('access-token')
@Controller('crm/customers')
export class CrmCustomersController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
