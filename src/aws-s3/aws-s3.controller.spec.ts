import { Test, TestingModule } from '@nestjs/testing';
import { S3Controller } from './aws-s3.controller';
import { S3Service } from './aws-s3.service';

describe('AwsS3Controller', () => {
  let controller: S3Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3Controller],
      providers: [S3Service],
    }).compile();

    controller = module.get<S3Controller>(S3Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
