import { BorrowStatus } from '@/common/enums/borrow-status.enum';
import { Book } from '@/modules/books/models/book.model';
import { User } from '@/modules/users/models/user.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';

@Schema({ versionKey: false, timestamps: true, collection: 'borrow' })
export class Borrow extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: User;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Book',
    required: true,
    index: true,
  })
  bookId: Book;

  @Prop({ type: SchemaTypes.Date, required: true, default: Date.now })
  borrowedAt: Date;

  @Prop({ type: SchemaTypes.Date, required: true })
  returnDate: Date;

  @Prop({ type: SchemaTypes.Date, default: null })
  returnedAt: Date;

  @Prop({ type: String, enum: BorrowStatus, default: BorrowStatus.PENDING })
  status: BorrowStatus;
}

export const BorrowSchema = SchemaFactory.createForClass(Borrow);
