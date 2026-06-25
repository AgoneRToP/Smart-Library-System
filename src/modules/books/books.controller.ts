import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'node:path';
import { Protected } from '@/common/decorators';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get all books with 60s Redis cache' })
  findAll(@Query('search') search?: string) {
    return this.booksService.findAll(search);
  }

  @Get('/search-api')
  async searchApi(@Query('q') query: string) {
    if (!query || query.length < 2) return { data: [] };
    try {
      const books = await this.booksService.findLive(query);
      const cleanBooks = books.map((doc) =>
        typeof doc.toObject === 'function' ? doc.toObject() : doc,
      );
      return { data: cleanBooks };
    } catch (error) {
      return { data: [] };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @Protected(true)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить сведения о книге (только администратор)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  update(
    @Param('id') id: string,
    @Body() updateBookDto: Partial<CreateBookDto>,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @Protected(true)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление книги (только администратор)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':id/upload-cover')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: resolve('.', 'uploads', 'books'),
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `book-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.booksService.update(id, { coverImage: file.filename });
  }
}
