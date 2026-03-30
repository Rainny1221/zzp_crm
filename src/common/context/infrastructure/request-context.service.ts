import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContextStore } from '../application/request-context.interface';

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, callback: () => T): T {
    return this.als.run(store, callback);
  }

  getStore(): RequestContextStore | undefined {
    return this.als.getStore();
  }

  getRequestId(): string | undefined {
    return this.als.getStore()?.requestId;
  }

  getUserId(): string | undefined {
    return this.als.getStore()?.userId;
  }

  setUserId(userId: string): void {
    const store = this.als.getStore();
    if (store) {
      store.userId = userId;
    }
  }
}