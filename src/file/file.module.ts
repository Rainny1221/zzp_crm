// src/queues/file/file.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { FileProcessor } from './file.processor';
import { FileQueueService } from './file.serviec';
import { CqrsModule } from '@nestjs/cqrs';
import { FileQueueListener } from './file.listener';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { AwsS3Module } from 'src/aws-s3/aws-s3.module';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file_queue',
    }),
    BullBoardModule.forFeature({
      name: 'file_queue',
      adapter: BullMQAdapter,
    }),
    AwsS3Module,
    CqrsModule,
    ImageModule,
  ],
  providers: [FileQueueService, FileProcessor, FileQueueListener],
  exports: [FileQueueService, FileProcessor],
})
export class FileModule {}
