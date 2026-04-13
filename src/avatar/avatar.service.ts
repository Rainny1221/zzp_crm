import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { S3Service } from 'src/aws-s3/aws-s3.service';
import { ImageService } from '../image/image.service';

@Injectable()
export class AvatarService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly imageService: ImageService,
    @InjectQueue('file_queue') private readonly fileQueue: Queue,
  ) {}

  async confirmAndOptimize(userId: number, rawKey: string) {
    await this.s3Service.headObject(rawKey);
    await this.fileQueue.add(
      'optimize-avatar',
      { userId, rawKey },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    );
    return { message: 'Avatar đang được tối ưu' };
  }
}
