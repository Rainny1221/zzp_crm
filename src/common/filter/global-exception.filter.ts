import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '../base.exception';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | any[] = 'Internal server error';
    let detail: any = null;
    let code = status.toString();

    if (exception instanceof BaseException) {
      status = exception.getStatus();
      message = exception.message;
      code = exception.errorCode;
      detail = exception.detail || null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        detail = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      detail = exception.name;
      this.logger.error(`[Unhandled Exception] ${request.method} ${request.url}`, exception.stack);
    } else {
      message = String(exception);
      this.logger.error(`[Unhandled Exception] ${request.method} ${request.url}`, String(exception));
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: Array.isArray(message) ? message[0] : message,
        code: code,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        detail: detail,
        stack: process.env.NODE_ENV !== 'production' && exception instanceof Error ? exception.stack : undefined,
      },
    };

    response.status(status).json(errorResponse);
  }
}