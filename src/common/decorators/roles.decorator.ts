import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

export const Roles = Reflector.createDecorator<UserRole[]>();
