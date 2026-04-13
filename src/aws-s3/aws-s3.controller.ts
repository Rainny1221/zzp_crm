import { Body, Controller } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('S3 Uploads')
@Controller('uploads')
export class S3Controller {
  constructor() {}
}
