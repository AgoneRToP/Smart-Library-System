import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail({}, { message: 'Неверный формат электронной почты' })
  email: string;

  @IsString()
  @MinLength(8, {message: 'Пароль не может быть короче 8 символов'})
  @MaxLength(255)
  password: string;
}
