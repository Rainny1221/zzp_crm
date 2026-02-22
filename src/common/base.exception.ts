import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './enums/error-codes.enum';

export class BaseException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    status: HttpStatus,
    public readonly detail?: any,
  ) {
    super(message, status);
  }
}