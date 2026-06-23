import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DateValidationPipe implements PipeTransform {
  transform(value: any) {
    const inputDate = new Date(value);

    if (isNaN(inputDate.getTime())) {
      throw new BadRequestException('Неверный формат даты');
    }

    if (inputDate < new Date()) {
      throw new BadRequestException('Вы не можете записаться на прием на прошлую дату или время.');
    }

    return inputDate;
  }
}
