import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class FileQueueService {
  constructor(@InjectQueue('file_queue') private readonly fileQueue: Queue) {}

  async addS3ConfirmJob(userId: number, key: string) {
    await this.fileQueue.add(
      'confirm-s3-upload',
      { userId, key },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    );
  }
}
