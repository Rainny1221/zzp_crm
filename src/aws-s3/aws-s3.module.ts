import { Module } from '@nestjs/common';
import { S3Service } from './aws-s3.service';
import { S3Controller } from './aws-s3.controller';

@Module({
  controllers: [S3Controller],
  providers: [S3Service], 
  exports: [S3Service],
})
export class AwsS3Module {}
