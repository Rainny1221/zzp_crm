import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../domain/repositories/i-user.repository';
import { I_USER_REPOSITORY } from '../../domain/repositories/i-user.repository';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  private readonly userRepo: IUserRepository;

  constructor(
    @Inject(I_USER_REPOSITORY)
    userRepo: IUserRepository,
  ) {
    this.userRepo = userRepo;
  }

  async execute(query: GetUserByIdQuery) {
    const user = await this.userRepo.findById(query.userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone_number: user.phoneNumber,
      avatar: user.avatar,
      bio: user.bio,
      address: user.address,
      age: user.age,
      gender: user.gender,
      major: user.major,
      free_time_activity: user.freeTimeActivity,
      hobby_ids: user.hobbyIds,
      is_verified: user.isVerified,
      is_active: user.isActive,
      is_block: user.isBlock,
    };
  }
}
