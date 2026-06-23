import { Controller, Post, Param, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BorrowService } from './borrow.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Borrowing')
@Controller('borrow')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Post(':bookId')
  @ApiOperation({ summary: 'Взять напрокат книгу (только для членов)' })
  borrow(@Param('bookId') bookId: string, @CurrentUser('id') userId: string) {
    return this.borrowService.borrowBook(userId, bookId);
  }

  @Post(':bookId/return')
  @ApiOperation({ summary: 'Верните взятую напрокат книгу (только для участников)' })
  returnBook(@Param('bookId') bookId: string, @CurrentUser('id') userId: string) {
    return this.borrowService.returnBook(userId, bookId);
  }

  @Get('records')
  @UseGuards(RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Просмотр всех записей о займах (только для администратора)' })
  getAllRecords() {
    return this.borrowService.findAllRecords();
  }
}
