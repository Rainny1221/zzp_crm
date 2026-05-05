import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

type SseSubject = Subject<MessageEvent>;

@Injectable()
export class CrmSseHubService {
  private readonly connections = new Map<number, Set<SseSubject>>();

  subscribe(userId: number): Observable<MessageEvent> {
    const uid = this.normalizeUserId(userId);

    return new Observable<MessageEvent>((subscriber) => {
      const subject = new Subject<MessageEvent>();
      this.add(uid, subject);

      const stream$ = merge(
        of<MessageEvent>({
          type: 'crm.connected',
          data: {
            userId: uid,
            connectedAt: new Date().toISOString(),
          },
        }),
        subject.asObservable(),
        interval(25000).pipe(
          map(() => ({
            type: 'crm.heartbeat',
            data: {
              ts: new Date().toISOString(),
            },
          })),
        ),
      );

      const sub = stream$.subscribe(subscriber);

      return () => {
        sub.unsubscribe();
        this.remove(uid, subject);
        subject.complete();
      };
    });
  }

  publishToUser(userId: number, event: MessageEvent): void {
    const uid = this.normalizeUserId(userId);
    const subjects = this.connections.get(uid);
    if (!subjects?.size) return;

    for (const subject of subjects) {
      subject.next(event);
    }
  }

  publishToUsers(
    userIds: number[],
    eventFactory: (userId: number) => MessageEvent,
  ): void {
    const uniqueUserIds = [
      ...new Set(
        userIds
          .filter((id) => id != null && Number(id) > 0)
          .map((id) => this.normalizeUserId(Number(id))),
      ),
    ];

    for (const userId of uniqueUserIds) {
      this.publishToUser(userId, eventFactory(userId));
    }
  }

  private normalizeUserId(userId: number): number {
    return Math.trunc(Number(userId));
  }

  private add(userId: number, subject: SseSubject): void {
    const set = this.connections.get(userId) ?? new Set<SseSubject>();
    set.add(subject);
    this.connections.set(userId, set);
  }

  private remove(userId: number, subject: SseSubject): void {
    const set = this.connections.get(userId);
    if (!set) return;

    set.delete(subject);
    if (!set.size) {
      this.connections.delete(userId);
    }
  }
}
