import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IMatchingRepository } from '../../domain/repositories/i-matching.repository';
import { MatchingEntity } from '../../domain/entities/matching.entity';
import { MatchingPrismaMapper } from './matching.prisma-mapper';

@Injectable()
export class MatchingPrismaRepository implements IMatchingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<MatchingEntity | null> {
    const raw = await this.prisma.matching.findUnique({
      where: { id },
    });

    if (!raw) return null;
    return MatchingPrismaMapper.toDomain(raw as any);
  }

  async save(entity: MatchingEntity): Promise<MatchingEntity> {
    const data = MatchingPrismaMapper.toUpdatePersistence(entity);

    const raw = await this.prisma.matching.update({
      where: { id: entity.id },
      data,
    });

    return MatchingPrismaMapper.toDomain(raw as any);
  }
}
