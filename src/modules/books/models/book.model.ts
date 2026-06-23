import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ versionKey: false, timestamps: true, collection: 'books' })
export class Book extends Document {
  @Prop({ type: SchemaTypes.String, required: true, index: true })
  title: string;

  @Prop({ required: true })
  author: string;

  @Prop({ type: SchemaTypes.String, required: true, unique: true })
  isbn: string;

  @Prop({ type: SchemaTypes.Number, required: true })
  publishedYear: number;

  @Prop({ type: SchemaTypes.Number, required: true, min: 0 })
  availableCopies: number;

  @Prop({
    type: SchemaTypes.String,
    required: false,
    default: 'default-cover.jpg',
    get: (cover: string) => `${process.env.APP_URL}/uploads/books/${cover}`,
  })
  coverImage: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.set('toJSON', { getters: true });
