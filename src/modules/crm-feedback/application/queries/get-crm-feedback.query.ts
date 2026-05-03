import { Query } from '@nestjs/cqrs';

export type GetCrmFeedbackFilters = {
  receiverUserId: number;
  page: number;
  limit: number;
  isRead: 'all' | 'read' | 'unread';
  category: string;
  customerId?: number | null;
};

export class GetCrmFeedbackQuery extends Query<any> {
  constructor(public readonly filters: GetCrmFeedbackFilters) {
    super();
  }
}
