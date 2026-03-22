import { MatchingEntity } from '../entities/matching.entity';

export const I_MATCHING_REPOSITORY = Symbol('I_MATCHING_REPOSITORY');

export interface IMatchingRepository {
  findById(id: number): Promise<MatchingEntity | null>;
  save(entity: MatchingEntity): Promise<MatchingEntity>;
  // TODO: add more repository methods as needed
}
