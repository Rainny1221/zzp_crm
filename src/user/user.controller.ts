import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @RequirePermissions('USER', 'READ')
  getMe(@Req() req: any) {
    return this.userService.getUserById(req.user.sub);
  }
}
