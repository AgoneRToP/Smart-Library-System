import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BorrowController } from './borrow.controller';
import { BorrowService } from './borrow.service';
import { Borrow, BorrowSchema } from './models/borrow.model';
import { User, UserSchema } from '../users/models/user.model';
import { Book, BookSchema } from '../books/models/book.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Borrow.name, schema: BorrowSchema },
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [BorrowController],
  providers: [BorrowService],
  exports: [BorrowService],
})
export class BorrowModule {}
