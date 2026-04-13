import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async optimizeAvatar(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'centre',
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();
  }
}
