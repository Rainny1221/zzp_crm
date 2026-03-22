import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IMatchingRepository } from '../../domain/repositories/i-matching.repository';
import { I_MATCHING_REPOSITORY } from '../../domain/repositories/i-matching.repository';
import { GetMatchingQuery } from './get-matching.query';

@QueryHandler(GetMatchingQuery)
export class GetMatchingHandler implements IQueryHandler<GetMatchingQuery> {
  private readonly repo: IMatchingRepository;

  constructor(
    @Inject(I_MATCHING_REPOSITORY)
    repo: any,
  ) {
    this.repo = repo;
  }

  async execute(query: GetMatchingQuery) {
    const entity = await this.repo.findById(query.id);
    if (!entity) return null;

    // TODO: map to response DTO
    return {
      id: entity.id,
    };
  }
}
