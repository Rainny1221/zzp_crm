import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponseDto } from '../dto/success-response.dto';
 

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponseDto<T>> {
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