import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { mongo } from 'mongoose';

@Catch(mongo.MongoServerError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: mongo.MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected database error occurred';

    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(exception.keyValue || {})[0];
      message = `A record with the same field value "${field}" already exists.`;
    }

    return response.status(status).json({
      success: false,
      statusCode: status,
      message: [message],
      error: 'DatabaseError',
    });
  }
}
