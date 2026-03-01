import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { S3Service } from './aws-s3.service';
import { AvatarService } from '../avatar/avatar.service';
import { PresignUploadDto } from './presign/presign.dto';
import { ConfirmUploadDto } from './presign/confirm.dto';
import { Public } from 'src/common/decorator/require-permissions.decorator';

@ApiTags('S3 Uploads')
@Controller('uploads')
export class S3Controller {
  constructor() {}

  
}