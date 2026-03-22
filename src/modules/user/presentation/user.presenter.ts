import { UserEntity } from '../domain/entities/user.entity';

export class UserPresenter {
  static toResponse(entity: UserEntity) {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      phone_number: entity.phoneNumber,
      avatar: entity.avatar,
      bio: entity.bio,
      address: entity.address,
      age: entity.age,
      gender: entity.gender,
      major: entity.major,
      free_time_activity: entity.freeTimeActivity,
      hobby_ids: entity.hobbyIds,
      is_verified: entity.isVerified,
      is_active: entity.isActive,
      is_block: entity.isBlock,
    };
  }
}
