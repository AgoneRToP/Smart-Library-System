import {
  Controller,
  Get,
  Delete,
  Param,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Protected } from '../../common/decorators/protected.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Delete(':id')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { success: true, message: 'Пользователь успешно удален' };
  }

  @Patch(':id/status')
  @Protected(true)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  async toggleStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    await this.usersService.updateStatus(id, body.isActive);
    return { success: true, message: 'Статус пользователя изменен' };
  }
}
