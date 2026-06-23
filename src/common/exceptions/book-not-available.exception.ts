import { HttpException, HttpStatus } from '@nestjs/common';

export class BookNotAvailableException extends HttpException {
  constructor(
    message: string = 'Данной книги сейчас нет в наличии или она не существует.',
  ) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
