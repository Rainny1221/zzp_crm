import { Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';
import { Public } from 'src/common/decorator/require-permissions.decorator';
import { GenerateTokensCommand } from '../application/commands/generate-tokens.command';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Đăng nhập bằng Google',
    description:
      'LƯU Ý: Không dùng nút "Try it out". Hãy copy đường dẫn http://localhost:3000/auth/google dán lên thanh địa chỉ trình duyệt để test.',
  })
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google Callback',
    description: 'API này do Google tự động gọi về, không cần test thủ công.',
  })
  async googleAuthRedirect(
    @Req() req: express.Request,
    @Headers('x-device') device: string,
  ) {
    const user = req.user as any;

    return await this.commandBus.execute(
      new GenerateTokensCommand(user.id, user.roles, device),
    );
  }
}
