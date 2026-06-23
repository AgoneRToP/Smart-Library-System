import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    let label = 'Unknown Request';

    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest();
      label = `[${req.method}] ${req.url}`;
    } else if (context.getType() as string === 'telegraf' || context.getType() as string === 'rpc') {
      const tgCtx = context.switchToRpc().getContext();
      const updateType = tgCtx?.updateType || 'update';
      const commandText = tgCtx?.message?.text || '';
      label = `[🤖 BOT] ${updateType} ${commandText}`.trim();
    }

    return next
      .handle()
      .pipe(
        tap(() => 
          this.logger.log(`${label} — Выполнено за ${Date.now() - now}ms`)
        ),
      );
  }
}
