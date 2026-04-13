import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImageService } from '../image/image.service';
import { CommandBus } from '@nestjs/cqrs';
import { S3Service } from 'src/aws-s3/aws-s3.service';
import { UpdateAvatarCommand } from '../modules/user/application/commands/update-avatar.command';

@Processor('file_queue')
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly s3Service: S3Service,
    private readonly imageService: ImageService,
    private readonly commandBus: CommandBus,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'optimize-avatar') {
      const { userId, rawKey } = job.data;
      const rawBuffer = await this.s3Service.getObjectBuffer(rawKey);
      const optimizedBuffer = await this.imageService.optimizeAvatar(rawBuffer);

      const optimizedKey = `avatars/${userId}-${Date.now()}.webp`;
      const avatarUrl = await this.s3Service.uploadBuffer(
        optimizedBuffer,
        optimizedKey,
        'image/webp',
      );

      await this.commandBus.execute(new UpdateAvatarCommand(userId, avatarUrl));
    }
  }
}
