import { CrmSyncEntity } from '../domain/entities/crm-sync.entity';

export class CrmSyncPresenter {
  static toResponse(entity: CrmSyncEntity) {
    return {
      id: entity.id,
      // TODO: map domain entity fields to response shape
    };
  }
}
