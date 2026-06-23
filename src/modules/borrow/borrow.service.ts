import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Borrow } from './models/borrow.model';
import { Book } from '../books/models/book.model';
import { BookNotAvailableException } from '../../common/exceptions/book-not-available.exception';

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

  async returnBook(userId: string, bookId: string): Promise<Borrow> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const borrowRecord = await this.borrowModel
        .findOne({
          userId,
          bookId,
          returnedAt: null,
        })
        .session(session);

      if (!borrowRecord) {
        throw new NotFoundException(
          'Active borrow record for this book not found',
        );
      }

      borrowRecord.returnedAt = new Date();
      await borrowRecord.save({ session });

      await this.bookModel.findByIdAndUpdate(
        bookId,
        { $inc: { availableCopies: 1 } },
        { session },
      );

      await session.commitTransaction();
      return borrowRecord;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAllRecords(): Promise<Borrow[]> {
    return this.borrowModel
      .find()
      .populate('userId', 'fullName email')
      .populate('bookId', 'title')
      .exec();
  }
}
