import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/i-user.repository';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserPrismaMapper } from './user.prisma-mapper';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
      include: {
        user_hobbies: true,
      },
    });

    if (!raw) return null;
    return UserPrismaMapper.toDomain(raw as any);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
      include: {
        user_hobbies: true,
      },
    });

    if (!raw) return null;
    return UserPrismaMapper.toDomain(raw as any);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const data = UserPrismaMapper.toUpdatePersistence(entity);

    const hobbyIds = entity.hobbyIds;

    const raw = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        ...data,

        // Rebuild hobby relations if hobbyIds are provided
        ...(hobbyIds.length > 0 && {
          user_hobbies: {
            deleteMany: {},
            create: hobbyIds.map((hobbyId) => ({
              hobby: {
                connect: { id: hobbyId },
              },
            })),
          },
        }),
      },
      include: {
        user_hobbies: true,
      },
    });

    return UserPrismaMapper.toDomain(raw as any);
  }
}
