import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id.query';
import { UpdateProfileCommand } from '../application/commands/update-profile.command';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @RequirePermissions('USER', 'READ')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.queryBus.execute(new GetUserByIdQuery(req.user.sub));
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @RequirePermissions('USER', 'UPDATE')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
  ) {
    return this.commandBus.execute(
      new UpdateProfileCommand(req.user.sub, data),
    );
  }
}
