import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma.service';
import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';
import { ErrorFactory } from '../error.factory';
import { ErrorCode } from '../enums/error-codes.enum';


@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw ErrorFactory.create(ErrorCode.INVALID_CREDENTIALS);
    }

    const hasPermission = await this.prisma.userRole.findFirst({
      where: {
        user_id: user.sub,
        role: {
          permissions: {
            some: {
              permission: {
                resource: requiredPermission.resource,
                action: requiredPermission.action,
              },
            },
          },
        },
      },
    });

    if (!hasPermission) {
      throw ErrorFactory.create(ErrorCode.FORBIDDEN_ACCESS);
    }

    return true;
  }
}