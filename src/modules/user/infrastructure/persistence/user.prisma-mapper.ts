import { User } from 'src/generated/prisma/client';
import { UserEntity, Gender } from '../../domain/entities/user.entity';

// Represents the raw shape from Prisma query
export type PrismaUserRaw = Pick<
  User,
  | 'id'
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'phone_number'
  | 'avatar_name'
  | 'bio'
  | 'age'
  | 'gender'
  | 'is_verify_email'
  | 'is_active'
  | 'is_block'
>;

export class UserPrismaMapper {
  static toDomain(raw: PrismaUserRaw): UserEntity {
    const fullName = [raw.first_name, raw.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return UserEntity.reconstitute({
      id: raw.id,
      email: raw.email ?? `user-${raw.id}@local.invalid`,
      name: fullName || undefined,
      phoneNumber: raw.phone_number ?? undefined,
      avatar: raw.avatar_name ? { key: raw.avatar_name } : undefined,
      bio: raw.bio ?? undefined,
      age: UserPrismaMapper.toDomainAge(raw.age),
      gender: UserPrismaMapper.toDomainGender(raw.gender),
      hobbyIds: [],
      isVerified: raw.is_verify_email ?? false,
      isActive: raw.is_active ?? true,
      isBlock: raw.is_block ?? false,
    });
  }

  static toUpdatePersistence(entity: UserEntity) {
    const avatarKey =
      entity.avatar && typeof entity.avatar.key === 'string'
        ? entity.avatar.key
        : null;

    return {
      first_name: entity.name,
      last_name: null,
      phone_number: entity.phoneNumber,
      bio: entity.bio,
      age: entity.age !== null ? String(entity.age) : null,
      gender: entity.gender,
      avatar_name: avatarKey,
    };
  }

  private static toDomainAge(age: string | null): number | undefined {
    if (!age) return undefined;

    const parsed = Number(age);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private static toDomainGender(gender: string | null): Gender | undefined {
    if (gender === 'MALE' || gender === 'FEMALE' || gender === 'OTHER') {
      return gender;
    }

    return undefined;
  }
}
