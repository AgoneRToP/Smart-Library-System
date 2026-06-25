import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  constructor() {
    console.log('[Telegram] ⚡ Служебный сервис успешно инициализирован.');
  }
}