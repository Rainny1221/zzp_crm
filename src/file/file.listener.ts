import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileQueueService } from './file.serviec';

@Injectable()
export class FileQueueListener {
  constructor(private readonly fileQueueService: FileQueueService) {}

  @OnEvent('avatar.uploaded')
  async handleAvatarUploadedEvent(payload: { userId: number; key: string }) {
    await this.fileQueueService.addS3ConfirmJob(payload.userId, payload.key);
  }
}
