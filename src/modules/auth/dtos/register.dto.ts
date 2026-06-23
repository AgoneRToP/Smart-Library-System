import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName: string;

  @IsString()
  @IsEmail({}, { message: 'Неверный формат электронной почты' })
  email: string;

  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Пароль слишком слабый (требуются прописные и строчные буквы, цифра и символ).',
    },
  )
  @MaxLength(255)
  password: string;
}
