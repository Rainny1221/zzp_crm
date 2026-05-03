import { Query } from '@nestjs/cqrs';
import type { CrmNotificationReadFilter } from '../../presentation/dto/get-crm-notifications.dto';

export type GetCrmNotificationsFilters = {
  receiverUserId: number;
  page: number;
  limit: number;
  isRead: CrmNotificationReadFilter;
  type: string;
  customerId?: number | null;
};

export class GetCrmNotificationsQuery extends Query<any> {
  constructor(public readonly filters: GetCrmNotificationsFilters) {
    super();
  }
}
