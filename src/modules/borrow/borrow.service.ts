import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Borrow } from './models/borrow.model';
import { Book } from '../books/models/book.model';
import { BookNotAvailableException } from '../../common/exceptions/book-not-available.exception';
import { BorrowStatus } from '@/common/enums/borrow-status.enum';

@Injectable()
export class BorrowService {
  constructor(
    @InjectModel(Borrow.name) private borrowModel: Model<Borrow>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async borrowBook(userId: string, bookId: string): Promise<Borrow> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const book = await this.bookModel.findOneAndUpdate(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { session, new: true },
      );

      if (!book) {
        throw new BookNotAvailableException(
          'Book is out of stock or does not exist',
        );
      }

      const borrowRecord = new this.borrowModel({
        userId,
        bookId,
        borrowedAt: new Date(),
      });
      await borrowRecord.save({ session });

      await session.commitTransaction();
      return borrowRecord;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async returnBook(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);
    if (!borrow) throw new NotFoundException('Запись об аренде не найдена');

    if (borrow.status !== BorrowStatus.APPROVED) {
      throw new BadRequestException(
        'Нельзя вернуть книгу, которая не была выдана или уже возвращена',
      );
    }

    const book = await this.bookModel.findById(borrow.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    borrow.status = BorrowStatus.RETURNED;
    borrow.returnedAt = new Date();

    return await borrow.save();
  }

  async findAllRecords(): Promise<Borrow[]> {
    return this.borrowModel
      .find()
      .populate('userId', 'fullName email')
      .populate('bookId', 'title')
      .exec();
  }

  async createRequest(userId: string, bookId: string, returnDateStr: string) {
    const parsedDate = new Date(returnDateStr);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Некорректный формат даты возврата');
    }

    return await this.borrowModel.create({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
      returnDate: parsedDate,
      borrowedAt: new Date(),
      status: BorrowStatus.PENDING,
    });
  }

  async getAllRequests() {
    return await this.borrowModel
      .find()
      .populate('userId', 'fullName email')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .exec();
  }

  async approveRequest(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);
    if (!borrow) throw new NotFoundException('Заявка не найдена');
    if (borrow.status !== BorrowStatus.PENDING)
      throw new BadRequestException('Заявка уже обработана');

    const book = await this.bookModel.findById(borrow.bookId);
    if (!book || book.availableCopies < 1) {
      borrow.status = BorrowStatus.REJECTED;
      await borrow.save();
      throw new BadRequestException('Нет доступных копий книги для выдачи');
    }

    book.availableCopies -= 1;
    await book.save();

    borrow.status = BorrowStatus.APPROVED;
    return await borrow.save();
  }

  async rejectRequest(borrowId: string) {
    const borrow = await this.borrowModel.findById(borrowId);
    if (!borrow) throw new NotFoundException('Заявка не найдена');
    if (borrow.status !== BorrowStatus.PENDING)
      throw new BadRequestException('Заявка уже обработана');

    borrow.status = BorrowStatus.REJECTED;
    return await borrow.save();
  }
}
