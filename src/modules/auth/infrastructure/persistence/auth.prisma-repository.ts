import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthUserData, IAuthRepository } from '../../domain/repositories/i-auth.repository';

@Injectable()
export class AuthPrismaRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithRolesById(id: number): Promise<AuthUserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? '',
      isActive: user.is_active,
      roles: (user as any).roles.map((ur: any) => ur.role.name),
    };
  }
}
