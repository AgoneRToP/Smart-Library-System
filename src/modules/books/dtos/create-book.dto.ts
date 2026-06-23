// src/modules/books/dto/create-book.dto.ts
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Hobbit' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'J.R.R. Tolkien' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: '978-0-261-10221-7' })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({ example: 1937 })
  @IsInt()
  publishedYear: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  availableCopies: number;

  @ApiProperty({ example: 'book-123456.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string; 
}
