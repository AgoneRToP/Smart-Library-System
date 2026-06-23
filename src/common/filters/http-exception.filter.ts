import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const message = typeof exceptionResponse === 'object' 
      ? exceptionResponse.message 
      : exceptionResponse;

    const acceptHeader = request.headers['accept'];

    if (acceptHeader && acceptHeader.includes('text/html')) {
      return response.status(status).render('error', {
        layout: 'layouts/main',
        title: `Error ${status}`,
        status,
        message: Array.isArray(message) ? message[0] : message,
      });
    }

    return response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: exception.name,
    });
  }
}
