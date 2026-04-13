import { Controller, Post, Body, Req } from '@nestjs/common';
import { S3Service } from 'src/aws-s3/aws-s3.service';
import { AvatarService } from './avatar.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { PresignUploadDto } from 'src/aws-s3/presign/presign.dto';
import { ConfirmUploadDto } from 'src/aws-s3/presign/confirm.dto';

@Controller('avatar')
@ApiTags('Avatar')
@ApiBearerAuth()
export class AvatarController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly avatarService: AvatarService,
  ) {}

  @Post('presign')
  @ApiOperation({ summary: 'Lấy URL presign để upload avatar lên S3' })
  @ApiResponse({ status: 200, description: 'Lấy URL presign thành công' })
  async presignAvatar(
    @Req() req: AuthenticatedRequest,
    @Body() dto: PresignUploadDto,
  ) {
    const userId = req.user.sub;
    return this.s3Service.presignUpload(userId, dto);
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Xác nhận upload hoàn tất và bắt đầu tối ưu avatar',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác nhận thành công, avatar đang được tối ưu',
  })
  async confirm(
    @Body() dto: ConfirmUploadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    return this.avatarService.confirmAndOptimize(userId, dto.key);
  }
}
