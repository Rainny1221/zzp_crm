import { Controller, Header, Post, Query, Req, Sse, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/require-permissions.decorator';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { CrmSseHubService } from '../infrastructure/services/crm-sse-hub.service';

type CrmSseTokenPayload = {
  typeToken?: string;
  user?: {
    id?: number;
    email?: string;
    roleId?: number;
    roleName?: string;
    isBlock?: boolean;
    isActive?: boolean;
  };
};

@ApiTags('CRM Realtime')
@ApiBearerAuth('access-token')
@Controller('crm/realtime')
export class CrmRealtimeController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hub: CrmSseHubService,
  ) {}

  @Post('token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create short-lived SSE token' })
  createToken(@Req() req: AuthenticatedRequest) {
    const user = req.user;

    const token = this.jwtService.sign(
      {
        typeToken: 'SSE_TOKEN',
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          roleName: user.roleName,
          isBlock: user.isBlock,
          isActive: user.isActive,
        },
      },
      {
        expiresIn: '2m',
        secret: this.getSseJwtSecret(),
      },
    );

    return {
      token,
      expiresInSeconds: 120,
    };
  }

  @Public()
  @Sse('stream')
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: 'CRM realtime SSE stream' })
  stream(@Query('token') token?: string) {
    if (!token) {
      throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Missing SSE token');
    }

    let payload: CrmSseTokenPayload;
    try {
      payload = this.jwtService.verify<CrmSseTokenPayload>(token, {
        secret: this.getSseJwtSecret(),
      });
    } catch {
      throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid SSE token');
    }

    if (payload?.typeToken !== 'SSE_TOKEN' || !payload?.user?.id) {
      throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid SSE token');
    }

    if (payload.user.isBlock || payload.user.isActive === false) {
      throw ErrorFactory.create(
        ErrorCode.FORBIDDEN_ACCESS,
        'User is blocked or inactive',
      );
    }

    return this.hub.subscribe(payload.user.id);
  }

  private getSseJwtSecret(): string {
    const secret =
      this.configService.get<string>('JWT_SECRET') ??
      this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'SSE token secret is not set',
      );
    }

    return secret;
  }
}
