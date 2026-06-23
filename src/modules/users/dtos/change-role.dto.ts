import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { UserRole } from '@/common/enums/role.enum';

export class ChangeRoleDto {
  @IsMongoId({ message: 'Неверный идентификатор пользователя' })
  @IsNotEmpty({ message: 'Требуется идентификатор пользователя' })
  userId: string;

  @IsEnum(UserRole, { message: 'Указана несуществующая роль' })
  @IsNotEmpty({ message: 'Требуется роль' })
  role: UserRole;
}
