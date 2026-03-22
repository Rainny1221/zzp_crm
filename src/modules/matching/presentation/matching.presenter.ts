import { MatchingEntity } from '../domain/entities/matching.entity';

export class MatchingPresenter {
  static toResponse(entity: MatchingEntity) {
    return {
      id: entity.id,
      // TODO: map domain entity fields to response shape
    };
  }
}
