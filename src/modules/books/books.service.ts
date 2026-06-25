import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './models/book.model';
import { CreateBookDto } from './dtos/create-book.dto';
import * as fs from 'fs';
import { basename, resolve } from 'path';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly uploadDir = resolve('.', 'uploads', 'books');

  async create(createBookDto: CreateBookDto): Promise<Book> {
    return this.bookModel.create(createBookDto);
  }

  async findAll(filter: any = {}): Promise<Book[]> {
    return this.bookModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Book> {
    const cacheKey = `book:${id}`;

    try {
      const cachedBook = await this.cacheManager.get<any>(cacheKey);
      if (cachedBook) {
        console.log(
          `[Redis] ⚡ Данные книги (ID: ${id}) успешно взяты из кэша памяти!`,
        );
        return cachedBook;
      }
    } catch (err) {
      console.error('[Redis] Ошибка при чтении из кэша:', err);
    }

    const book = await this.bookModel.findById(id).exec();
    if (!book) throw new NotFoundException('Book not found');

    try {
      const bookObj = book.toObject();

      await this.cacheManager.set(cacheKey, bookObj, 60 * 1000);
      console.log(
        `[Redis] 💾 Книга (ID: ${id}) успешно сохранена в кэш на 60 секунд.`,
      );
    } catch (err) {
      console.error('[Redis] Ошибка при записи в кэш:', err);
    }

    return book;
  }

  async update(
    id: string,
    updateBookDto: Partial<CreateBookDto>,
  ): Promise<Book> {
    if (updateBookDto.coverImage) {
      const oldBook = await this.bookModel.findById(id).exec();

      if (oldBook && oldBook.coverImage) {
        const cleanOldName = basename(oldBook.coverImage);

        if (
          cleanOldName !== 'default-cover.jpg' &&
          !cleanOldName.includes('default')
        ) {
          const oldFilePath = resolve(this.uploadDir, cleanOldName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(
              `[File System] 🗑️ Старая индивидуальная обложка удалена: ${cleanOldName}`,
            );
          }
        }
      }
    }

    const updatedBook = await this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .exec();
    if (!updatedBook) throw new NotFoundException('Book not found');

    await this.cacheManager.del(`book:${id}`);
    console.log(
      `[Redis] 🔄 Кэш для книги ${id} сброшен из-за обновления данных.`,
    );

    return updatedBook;
  }

  async remove(id: string): Promise<void> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) throw new NotFoundException('Книга не найдена');

    if (book.coverImage) {
      const cleanName = basename(book.coverImage);
      if (cleanName !== 'default-cover.jpg' && !cleanName.includes('default')) {
        const filePath = resolve(this.uploadDir, cleanName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(
            `[File System] 🗑️ Обложка удалена вместе с книгой: ${cleanName}`,
          );
        }
      }
    }

    await this.bookModel.findByIdAndDelete(id).exec();

    await this.cacheManager.del(`book:${id}`);
    console.log(`[Redis] 🗑️ Кэш для удаленной книги ${id} стерт.`);
  }

  async findLive(query: string) {
    const targetModel = this.bookModel || (this as any).model;

    return await targetModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }
}
