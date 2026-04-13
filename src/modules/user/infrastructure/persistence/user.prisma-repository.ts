import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/i-user.repository';
import { UserEntity } from '../../domain/entities/user.entity';
import { PrismaUserRaw, UserPrismaMapper } from './user.prisma-mapper';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!raw) return null;
    return UserPrismaMapper.toDomain(raw as PrismaUserRaw);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!raw) return null;
    return UserPrismaMapper.toDomain(raw as PrismaUserRaw);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const data = UserPrismaMapper.toUpdatePersistence(entity);

    const raw = await this.prisma.user.update({
      where: { id: entity.id },
      data,
    });

    return UserPrismaMapper.toDomain(raw as PrismaUserRaw);
  }
}
