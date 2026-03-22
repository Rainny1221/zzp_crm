import { MatchingEntity } from '../../domain/entities/matching.entity';

// TODO: Define the shape returned by Prisma query
interface PrismaMatchingRaw {
  id: number;
  // TODO: add Prisma model fields
}

export class MatchingPrismaMapper {
  static toDomain(raw: PrismaMatchingRaw): MatchingEntity {
    return MatchingEntity.reconstitute({
      id: raw.id,
      // TODO: map Prisma fields → domain props
    });
  }

  static toCreatePersistence(entity: MatchingEntity) {
    return {
      // TODO: map domain entity → Prisma create input
    };
  }

  static toUpdatePersistence(entity: MatchingEntity) {
    return {
      // TODO: map domain entity → Prisma update input
    };
  }
}
