import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import 'dotenv/config';
import { ErrorFactory } from 'src/common/error.factory';
import { ErrorCode } from 'src/common/enums/error-codes.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthUser(details: any) {
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            email: details.email,
            is_verified: true,
            is_active: true,
            roles: {
              create: {
                assigned_by: 1,
                role: {
                  connect: { name: 'user' },
                },
              },
            },
          },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });
      } catch (error) {
        throw ErrorFactory.create(
          ErrorCode.SYSTEM_ERROR_AUTH,
          'Lỗi hệ thống khi khởi tạo tài khoản',
        )
      }
    }

    return user;
  }

  async generateTokens(user: any) {
    const userRoles = user.roles?.map((ur: any) => ur.role.name) || [];

    const payload = { 
      sub: user.id, 
      email: user.email,
      roles: userRoles, 
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}