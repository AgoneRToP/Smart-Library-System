import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramUpdate } from './telegram.update';
import { Borrow, BorrowSchema } from '../borrow/models/borrow.model';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN')!,
      }),
      inject: [ConfigService],
    }),
    BooksModule,
    MongooseModule.forFeature([
      { name: Borrow.name, schema: BorrowSchema },
    ]),
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
