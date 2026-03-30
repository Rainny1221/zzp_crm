import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '../base.exception';
import { ApiErrorResponse } from '../interfaces/api-response.interface';
import { AppLoggerService } from '../../logger/app-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let detail: unknown = undefined;
    let logLevel: 'warn' | 'error' = 'error';
    let action = 'UNHANDLED_EXCEPTION';

    if (exception instanceof BaseException) {
      status = exception.getStatus();
      code = exception.errorCode;
      message = exception.message;
      detail = exception.detail;
      logLevel = status >= 500 ? 'error' : 'warn';
      action = 'BUSINESS_EXCEPTION';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        message = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : responseObj.message || message;
        detail = responseObj;
      }

      code = this.mapHttpExceptionCode(exception);
      logLevel = status >= 500 ? 'error' : 'warn';
      action = 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
      detail = {
        name: exception.name,
      };
      logLevel = 'error';
      action = 'UNHANDLED_EXCEPTION';
    } else {
      message = String(exception);
      logLevel = 'error';
      action = 'UNKNOWN_THROWABLE';
    }

    const logPayload = {
      message: status >= 500 ? 'Unhandled exception captured' : 'HTTP exception captured',
      context: GlobalExceptionFilter.name,
      module: 'http',
      action,
      entityType: 'HTTP',
      meta: {
        method,
        path,
        statusCode: status,
        errorCode: code,
        errorMessage: message,
        detail: this.safeDetail(detail),
        errorName: exception instanceof Error ? exception.name : undefined,
        stack:
          process.env.NODE_ENV !== 'production' && exception instanceof Error
            ? exception.stack
            : undefined,
      },
    };

    if (logLevel === 'error') {
      this.logger.error(logPayload);
    } else {
      this.logger.warn(logPayload);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message,
        code,
        timestamp,
        path,
        method,
        detail: this.exposeDetail(detail),
        stack:
          process.env.NODE_ENV !== 'production' && exception instanceof Error
            ? exception.stack
            : undefined,
      },
    };

    response.status(status).json(errorResponse);
  }

  private mapHttpExceptionCode(exception: HttpException): string {
    if (exception instanceof UnauthorizedException) {
      return 'AUTH_UNAUTHORIZED';
    }

    if (exception instanceof ForbiddenException) {
      return 'AUTH_FORBIDDEN';
    }

    if (exception instanceof BadRequestException) {
      return 'BAD_REQUEST';
    }

    if (exception instanceof NotFoundException) {
      return 'RESOURCE_NOT_FOUND';
    }

    if (exception instanceof ConflictException) {
      return 'RESOURCE_CONFLICT';
    }

    return `HTTP_${exception.getStatus()}`;
  }

  private safeDetail(detail: unknown): unknown {
    if (!detail) return undefined;

    if (typeof detail === 'object') {
      return detail;
    }

    return String(detail);
  }

  private exposeDetail(detail: unknown): unknown {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    return detail;
  }
}