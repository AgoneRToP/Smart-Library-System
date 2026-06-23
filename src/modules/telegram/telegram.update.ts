import { Update, Start, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '../books/models/book.model';
import { Borrow } from '../borrow/models/borrow.model';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Borrow.name) private borrowModel: Model<Borrow>,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      '📚 Добро пожаловать в Smart Library Bot!\n\n' +
        'Доступные команды:\n' +
        '/books - Посмотреть все доступные книги\n' +
        '/mybooks - Просмотр взятых на данный момент книг',
    );
  }

  @Command('books')
  async onBooks(@Ctx() ctx: Context): Promise<void> {
    const books = await this.bookModel
      .find({ availableCopies: { $gt: 0 } })
      .exec();

    if (books.length === 0) {
      await ctx.reply('😔 К сожалению, сейчас книг в наличии нет.');
      return;
    }

    const bookList = books
      .map(
        (b) =>
          `📖 *${b.title}* - ${b.author}\n(Осталось копий: ${b.availableCopies})`,
      )
      .join('\n\n');

    await ctx.replyWithMarkdownV2(
      `*Доступные книги:* \n\n${this.escapeMarkdown(bookList)}`,
    );
  }

  @Command('mybooks')
  async onMyBooks(@Ctx() ctx: Context): Promise<void> {
    const activeBorrows = await this.borrowModel
      .find({ returnedAt: null })
      .populate<{ bookId: Book }>('bookId')
      .limit(5)
      .exec();

    if (activeBorrows.length === 0) {
      await ctx.reply('На данный момент у вас нет взятых напрокат книг.');
      return;
    }

    const userBooks = activeBorrows
      .filter((record) => record.bookId)
      .map(
        (record) =>
          `• *${record.bookId.title}* (Заимствованный: ${record.borrowedAt.toLocaleDateString()})`,
      )
      .join('\n');

    await ctx.replyWithMarkdownV2(
      `*Ваши текущие книги:* \n\n${this.escapeMarkdown(userBooks)}`,
    );
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
  }
}
