import { UserEntity } from '../entities/user.entity';

export const I_USER_REPOSITORY = Symbol('I_USER_REPOSITORY');

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(entity: UserEntity): Promise<UserEntity>;
}
