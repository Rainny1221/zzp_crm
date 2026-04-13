import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PERMISSIONS_KEY,
  PermissionRequirement,
} from '../decorator/require-permissions.decorator';
import { ErrorCode } from '../enums/error-codes.enum';
import { ErrorFactory } from '../error.factory';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

interface PermissionRow {
  permission_name: string;
  permission_scope: string | null;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermission?.permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const userId = Number(user?.id ?? user?.sub);

    if (!user || !userId) {
      throw ErrorFactory.create(ErrorCode.INVALID_CREDENTIALS);
    }

    const matchedPermissions = await this.prisma.$queryRaw<PermissionRow[]>`
      select
        p.name as permission_name,
        p.scope as permission_scope
      from users u
      join permission_roles pr on pr.role_id = u.role_id
      join permissions p on p.id = pr.permission_id
      where u.id = ${userId}
        and u.deleted_at is null
        and coalesce(u.is_block, false) = false
        and coalesce(u.is_active, true) = true
        and p.deleted_at is null
        and coalesce(p.is_active, true) = true
        and p.name = ${requiredPermission.permission}
      limit 1
    `;

    const hasPermission = matchedPermissions.some(
      (permission) =>
        permission.permission_name === requiredPermission.permission &&
        (!requiredPermission.scope ||
          permission.permission_scope === requiredPermission.scope),
    );

    if (user.roleName === 'ADMIN') {
      return true;
    }

    if (!hasPermission) {
      throw ErrorFactory.create(ErrorCode.FORBIDDEN_ACCESS);
    }

    return true;
  }
}
