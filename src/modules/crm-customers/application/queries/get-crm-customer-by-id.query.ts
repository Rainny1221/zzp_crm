import { Query } from '@nestjs/cqrs';
import type { CustomerReadModel, UserLite } from './get-crm-customers.query';

export type ActivityItem = {
  id: string;
  type: string;
  description: string;
  author: string;
  timestamp: string;
};

export type TaskItem = {
  id: string;
  customerId: string;
  type: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  assigneeId: string | null;
  priority: string;
};

export type CustomerDetailResponse = {
  customer: CustomerReadModel;
  owner?: UserLite;
  activities: ActivityItem[];
  tasks: TaskItem[];
  stats: {
    openTaskCount: number;
    lastActivityAt: string;
  };
};

export type GetCrmCustomerByIdQueryParams = {
  customerId: number;
  currentUserId: number;
  currentUserRoleName?: string | null;
};

export class GetCrmCustomerByIdQuery extends Query<CustomerDetailResponse> {
  constructor(public readonly params: GetCrmCustomerByIdQueryParams) {
    super();
  }
}
