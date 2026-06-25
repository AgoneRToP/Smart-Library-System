// src/modules/borrow/borrow.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Protected } from '../../common/decorators/protected.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Post('/:bookId')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.MEMBER, UserRole.ADMIN])
  async createRequest(
    @Param('bookId') bookId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    if (!body) {
      const today = new Date();
      const twoWeeksLater = new Date(today.setDate(today.getDate() + 14));
      body = { returnDate: twoWeeksLater };
    } else if (!body.returnDate) {
      const today = new Date();
      body.returnDate = new Date(today.setDate(today.getDate() + 14));
    }

    return this.borrowService.createRequest(
      req.user.id,
      bookId,
      body.returnDate,
    );
  }

  @Get('requests')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async getAllRequests() {
    return this.borrowService.getAllRequests();
  }

  @Patch(':id/approve')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async approveRequest(@Param('id') id: string) {
    return this.borrowService.approveRequest(id);
  }

  @Patch(':id/reject')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async rejectRequest(@Param('id') id: string) {
    return this.borrowService.rejectRequest(id);
  }

  @Patch(':id/return')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async returnBook(@Param('id') id: string) {
    return this.borrowService.returnBook(id);
  }
}
