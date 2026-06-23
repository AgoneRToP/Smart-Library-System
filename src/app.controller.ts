import { Controller, Get, Render, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './modules/books/models/book.model';

@Controller()
export class AppController {
  constructor(@InjectModel(Book.name) private bookModel: Model<Book>) {}

  @Get()
  @Render('index')
  async root(@Query('search') search?: string) {
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};

    const booksDocuments = await this.bookModel.find(filter).exec();
    const books = booksDocuments.map((doc) => doc.toObject());

    return { books };
  }
}
