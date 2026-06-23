import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { Roles } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    const userRole = request?.user?.role;

    console.log('--- ОТЛАДКА ROLES GUARD ---');
    console.log('Какая роль в JWT токене:', userRole);
    console.log('Какие роли требуются для эндпоинта:', requiredRoles);

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException("У пользователя нет доступа");
    }

    return true;
  }
}
