import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponseDto } from '../dto/success-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseDto<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseDto<T>> {
    const isSse = this.reflector.getAllAndOverride<boolean>(SSE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSse) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data instanceof SuccessResponseDto) {
          return data;
        }
        return new SuccessResponseDto<T>(data, 'Success');
      }),
    );
  }
}
