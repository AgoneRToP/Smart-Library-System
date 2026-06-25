import { Update, Start, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Borrow } from '../borrow/models/borrow.model';
import { Book } from '../books/models/book.model';
import { User } from '../users/models/user.model';
import { BorrowStatus } from '@/common/enums/borrow-status.enum';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectModel(Borrow.name) private readonly borrowModel: Model<Borrow>,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<any> {
    const welcomeMessage = 
      `👋 Здравствуйте, ${ctx.from?.first_name || 'читатель'}!\n\n` +
      `Добро пожаловать в Telegram-бот цифровой системы Smart Library. 📚\n\n` +
      `🤖 Список доступных команд:\n` +
      `🔹 /books — Просмотреть каталог книг\n` +
      `🔹 /mybooks — Список моих взятых книг\n` +
      `🔹 /link <email> — Привязать Telegram к вашему аккаунту библиотеки`;
    
    await ctx.reply(welcomeMessage);
  }

  @Command('books')
  async onBooks(@Ctx() ctx: Context): Promise<any> {
    try {
      const books = await this.bookModel.find().exec();
      
      if (!books || books.length === 0) {
        await ctx.reply('📭 В каталоге библиотеки пока нет ни одной книги.');
        return
      }

      let message = `📚 <b>Каталог доступных книг (${books.length}):</b>\n\n`;
      
      books.forEach((book, index) => {
        const copiesText = book.availableCopies > 0 
          ? `🟢 В наличии: ${book.availableCopies} шт.` 
          : `🔴 Нет на месте`;
          
        message += `${index + 1}. <b>${book.title}</b>\n`;
        message += `✍️ Автор: ${book.author}\n`;
        message += `🔢 ISBN: ${book.isbn}\n`;
        message += `${copiesText}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      await ctx.reply('❌ Ошибка при загрузке каталога книг.');
    }
  }

  @Command('link')
  async onLink(@Ctx() ctx: Context): Promise<any> {
    const messageText = (ctx.message as any)?.text || ''; 
    const parts = messageText.split(' ');
    
    if (parts.length < 2) {
      await ctx.reply(
        '⚠️ <b>Как использовать команду:</b>\n\n' +
        '🔑 <b>Для обычных аккаунтов:</b>\n/link [email] [пароль]\n' +
        '🌐 <b>Для вошедших через Google/GitHub:</b>\n/link [email]\n\n' +
        '📱 <i>Пример: /link user@mail.com 123456</i>',
        { parse_mode: 'HTML' }
      );
      return
    }

    const emailInput = parts[1].toLowerCase().trim();
    const secretInput = parts[2] ? parts[2].trim() : null;
    
    try {
      const user = await this.userModel.findOne({ email: emailInput });
      if (!user) {
        return await ctx.reply('❌ Пользователь с таким email не найден в системе библиотеки.');
      }

      if (!user.password || user.password === '') {
        
        if (!secretInput) {
          const oauthPin = Math.floor(100000 + Math.random() * 900000).toString();
          
          user.profile = `oauth_tg_${oauthPin}`;
          await user.save();

          await this.mailService.sendActivationEmail(user.email, user.fullName, oauthPin, true);

          await ctx.reply(
            `🌐 <b>Вы авторизованы через соцсеть!</b>\n\n` +
            `📨 Мы отправили 6-значный код подтверждения на ваш email <b>${user.email}</b>.\n` +
            `Введите его вместе с командой для завершения привязки.\n\n` +
            `👉 <b>Пример:</b> /link ${user.email} [код_из_письма]`,
            { parse_mode: 'HTML' }
          );
          return
        }

        if (user.profile !== `oauth_tg_${secretInput}`) {
          await ctx.reply('❌ Ошибка безопасности: Введен неверный или истекший код подтверждения.');
          return
        }

        user.profile = '';
        await user.save();
      } 
      
      else {
        if (!secretInput) {
          await ctx.reply('⚠️ Для привязки обычного аккаунта необходимо указать пароль через пробел после email.');
          return
        }

        const isPasswordCorrect = await this.authService.comparePass(secretInput, user.password as string);
        if (!isPasswordCorrect) {
          await ctx.reply('❌ Ошибка безопасности: Введен неверный пароль от аккаунта библиотеки.');
          return
        }
      }

      await this.userModel.findByIdAndUpdate(user._id, { telegramChatId: String(ctx.from?.id) });
      await ctx.reply('✅ <b>Авторизация успешна!</b> Аккаунт связан с Telegram. Теперь вам доступна команда /mybooks.');

    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Произошла ошибка при связывании аккаунта.');
    }
  }

  @Command('mybooks')
  async onMyBooks(@Ctx() ctx: Context): Promise<any> {
    try {
      const user = await this.userModel.findOne({ telegramChatId: String(ctx.from?.id) });
      
      if (!user) {
        await ctx.reply('⚠️ Ваш Telegram профиль ещё не привязан к системе.\nИспользуйте команду: /link <ваш_email>');
        return
      }

      const activeBorrows = await this.borrowModel
        .find({ userId: user._id, status: BorrowStatus.APPROVED })
        .populate('bookId')
        .exec();

      if (!activeBorrows || activeBorrows.length === 0) {
        await ctx.reply('📖 У вас сейчас нет книг на руках.');
        return
      }

      let message = `📖 <b>Ваши книги на руках (${activeBorrows.length}):</b>\n\n`;
      
      activeBorrows.forEach((borrow: any, index) => {
        const returnDate = new Date(borrow.returnDate).toLocaleDateString('ru-RU');
        message += `${index + 1}. <b>${borrow.bookId?.title || 'Удаленная книга'}</b>\n`;
        message += `✍️ Автор: ${borrow.bookId?.author || '—'}\n`;
        message += `📅 Вернуть до: <b>${returnDate}</b>\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'HTML' });
    } catch (err) {
      await ctx.reply('❌ Ошибка при получении списка ваших книг.');
    }
  }
}
