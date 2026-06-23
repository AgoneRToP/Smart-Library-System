import { Protected, Roles } from '@/common/decorators';
import { UserRole } from '@/common/enums/role.enum';
import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard, RolesGuard } from '@/common/guards';
import { ChangeRoleDto } from './dtos';

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Protected(true)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles([UserRole.ADMIN])
  @Render('admin/users-list')
  async getAll() {
    const usersResponse = await this.service.getAll();
    const rawUsers = usersResponse?.data || usersResponse;

    const cleanUsers = rawUsers ? JSON.parse(JSON.stringify(rawUsers)) : [];

    return {
      title: 'Управление пользователями',
      users: cleanUsers,
    };
  }

  @Post('change-role')
  @Roles([UserRole.ADMIN])
  async changeRole(@Body() changeRoleDto: ChangeRoleDto, @Res() res: any) {
    await this.service.changeUserRole(changeRoleDto);

    const acceptHeader = res.req?.headers['accept'];
    if (acceptHeader && acceptHeader.includes('text/html')) {
      return res.redirect('/admin/users');
    }

    return res.json({
      success: true,
      message: 'Роль пользователя успешно обновлена',
    });
  }
}
