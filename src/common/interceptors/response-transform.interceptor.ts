import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBaseResponse } from '../interfaces/base-service.interface';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  IBaseResponse<T>
> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType() as string;
    if (type === 'telegraf' || type === 'rpc') {
      return next.handle();
    }

    const handler = context.getHandler();
    const hasRenderMetadata = Reflect.getMetadata(
      '__renderTemplate__',
      handler,
    );
    if (hasRenderMetadata) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          data: data || null,
        };
      }),
    );
  }
}
