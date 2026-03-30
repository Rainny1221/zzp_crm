import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './enums/error-codes.enum';
import { BaseException } from './base.exception';

export class ErrorFactory {
  static create(
    code: ErrorCode,
    customMessage?: string,
    detail?: any,
  ): BaseException {
    switch (code) {
      case ErrorCode.USER_NOT_FOUND:
        return new BaseException(
          code,
          customMessage || 'User not found in the system',
          HttpStatus.NOT_FOUND,
          detail,
        );

      case ErrorCode.INVALID_CREDENTIALS:
        return new BaseException(
          code,
          customMessage || 'Invalid username or password',
          HttpStatus.UNAUTHORIZED,
          detail,
        );

      case ErrorCode.FORBIDDEN_ACCESS:
        return new BaseException(
          code,
          customMessage || 'You do not have permission to perform this action',
          HttpStatus.FORBIDDEN,
          detail,
        );

      case ErrorCode.ITEM_ALREADY_EXISTS:
        return new BaseException(
          code,
          customMessage || 'The item already exists',
          HttpStatus.CONFLICT,
          detail,
        );

      case ErrorCode.VALIDATION_ERROR:
        return new BaseException(
          code,
          customMessage || 'Input validation failed',
          HttpStatus.BAD_REQUEST,
          detail,
        );

      case ErrorCode.INVALID_TOKEN:
        return new BaseException(
          code,
          customMessage || 'Invalid token',
          HttpStatus.UNAUTHORIZED,
          detail,
        );

      default:
        return new BaseException(
          ErrorCode.INTERNAL_ERROR,
          customMessage || 'An unexpected error occurred',
          HttpStatus.INTERNAL_SERVER_ERROR,
          detail,
        );
    }
  }
}