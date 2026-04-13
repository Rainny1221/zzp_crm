import { Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { AwsS3Module } from 'src/aws-s3/aws-s3.module';
import { ImageModule } from 'src/image/image.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { AvatarController } from './avatar.controller';

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
    ImageModule,
  ],
  providers: [AvatarService],
  exports: [AvatarService],
  controllers: [AvatarController],
})
export class AvatarModule {}
