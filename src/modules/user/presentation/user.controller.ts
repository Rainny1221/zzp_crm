import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
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
  getMe(@Req() req: any) {
    return this.queryBus.execute(new GetUserByIdQuery(req.user.sub));
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @RequirePermissions('USER', 'UPDATE')
  updateProfile(@Req() req: any, @Body() data: UpdateProfileDto) {
    return this.commandBus.execute(new UpdateProfileCommand(req.user.sub, data));
  }
}
