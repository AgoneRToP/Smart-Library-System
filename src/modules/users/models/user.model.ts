import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { UserRole } from '../../../common/enums/role.enum';

@Schema({ versionKey: false, timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({
    type: SchemaTypes.String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 255,
  })
  fullName: string;

  @Prop({
    type: SchemaTypes.String,
    required: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, введите корректный email',
    ],
  })
  email: string;

  @Prop({
    type: SchemaTypes.String,
    required: false,
    minlength: 8,
    maxlength: 255,
  })
  password?: string;

  @Prop({ type: SchemaTypes.String, enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Prop({ type: SchemaTypes.Number, unique: true, sparse: true })
  telegram_id: number;

  @Prop({ type: SchemaTypes.String, allowNull: true })
  profile?: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isActive: boolean;

  @Prop({ type: SchemaTypes.String })
  activationToken: string;

  @Prop({ type: String, default: null, index: true })
  telegramChatId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
