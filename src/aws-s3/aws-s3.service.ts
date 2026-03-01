import {
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Injectable, Inject, LoggerService, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { PresignUploadDto } from './presign/presign.dto';
import { ErrorFactory } from 'src/common/error.factory';
import { ErrorCode } from 'src/common/enums/error-codes.enum';

const ALLOWED_FILE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRESIGNED_EXPIRES_IN = 300;

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');
    this.publicBaseUrl = this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN', '');
    
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'ap-southeast-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  private getBucket() {
    return this.bucket;
  }

  private getCloudFront() {
    return this.publicBaseUrl.replace(/\/$/, '');
  }

  buildPublicUrl(key: string): string {
    return `${this.getCloudFront()}/${key}`;
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    
    this.logger.log(`Uploaded to S3: ${key}`);
    return this.buildPublicUrl(key);
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    }));
    
    if (!response.Body) {
      throw ErrorFactory.create(ErrorCode.S3_OBJECT_BODY_IS_EMPTY, `S3 object body is empty for key: ${key}`);
    }
    
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async headObject(key: string) {
    return this.s3Client.send(new HeadObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    }));
  }

  async presignUpload(userId: number, payload: PresignUploadDto) {
    const ext = ALLOWED_FILE_TYPES[payload.contentType];
    
    if (!ext) {
      throw ErrorFactory.create(ErrorCode.INVALID_FILE_TYPE, 'Invalid file type');
    }
    
    if (payload.size > MAX_FILE_SIZE) {
      throw ErrorFactory.create(ErrorCode.FILE_SIZE_EXCEEDS_MAXIMUM_LIMIT, 'File size exceeds the maximum limit');
    }

    const key = `raw/users/${userId}/avatars/${randomUUID()}.${ext}`;

    const { url, fields } = await createPresignedPost(this.s3Client, {
      Bucket: this.getBucket(),
      Key: key,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
        ['eq', '$Content-Type', payload.contentType],
      ],
      Fields: {
        'Content-Type': payload.contentType,
      },
      Expires: PRESIGNED_EXPIRES_IN,
    });

    return {
      key,
      uploadUrl: url,
      fields,
      expiresIn: PRESIGNED_EXPIRES_IN,
      publicUrl: this.buildPublicUrl(key),
    };
  }
}