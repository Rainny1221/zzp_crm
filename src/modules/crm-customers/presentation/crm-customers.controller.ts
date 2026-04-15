import { Controller, Get, Query, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { GetCrmCustomersQuery } from '../application/queries';
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
}
