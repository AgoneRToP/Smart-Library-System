// src/app.controller.ts
import { Controller, Get, Query, Render } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './modules/books/models/book.model';

@Controller()
export class AppController {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<Book>
  ) {}

  @Get()
  @Render('index')
  async root(@Query('search') search?: string) {
    let filter = {};

    if (search && search.trim() !== '') {
      filter = {
        title: { 
          $regex: search.trim(),
          $options: 'i'
        }
      };
      console.log(`[Search API] 🔍 Пользователь ищет книги по запросу: "${search}"`);
    }

    const booksDocuments = await this.bookModel.find(filter).exec();
    
    const booksArray = booksDocuments.map(doc => doc.toObject());

    return { books: booksArray };
  }
}
