import { UserEntity, Gender } from '../../domain/entities/user.entity';

// Represents the raw shape from Prisma query
interface PrismaUserRaw {
  id: number;
  email: string | null;
  phone_number: string | null;
  name: string | null;
  avatar: any;
  bio: string | null;
  address: string | null;
  age: number | null;
  gender: Gender | null;
  major: string | null;
  free_time_activity: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_block: boolean;
  user_hobbies?: { hobby_id: number }[];
}

export class UserPrismaMapper {
  static toDomain(raw: PrismaUserRaw): UserEntity {
    return UserEntity.reconstitute({
      id: raw.id,
      email: raw.email ?? '',
      name: raw.name ?? undefined,
      phoneNumber: raw.phone_number ?? undefined,
      avatar: raw.avatar ?? undefined,
      bio: raw.bio ?? undefined,
      address: raw.address ?? undefined,
      age: raw.age ?? undefined,
      gender: raw.gender ?? undefined,
      major: raw.major ?? undefined,
      freeTimeActivity: raw.free_time_activity ?? undefined,
      hobbyIds: raw.user_hobbies?.map((h) => h.hobby_id) ?? [],
      isVerified: raw.is_verified,
      isActive: raw.is_active,
      isBlock: raw.is_block,
    });
  }

  static toUpdatePersistence(entity: UserEntity) {
    return {
      name: entity.name,
      phone_number: entity.phoneNumber,
      bio: entity.bio,
      address: entity.address,
      age: entity.age,
      gender: entity.gender,
      major: entity.major,
      avatar: entity.avatar ?? undefined,
      free_time_activity: entity.freeTimeActivity,
    };
  }
}
