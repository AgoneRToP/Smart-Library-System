import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import type { Request, Response } from 'express';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enums/role.enum';
import { Protected } from '../decorators/protected.decorator';
import { UsersService } from '@/modules/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private usersService: UsersService;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isProtected = this.reflector.getAllAndOverride<boolean>(Protected, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isProtected) {
      return true;
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { user: any }>();
    const response = ctx.getResponse<Response>();

    const accessToken = request.signedCookies?.['accessToken'];
    const refreshToken = request.signedCookies?.['refreshToken'];

    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException('Токены не предоставлены');
    }

    const decoded = await this.verifyAndRefreshToken(
      accessToken,
      refreshToken,
      response,
    );

    if (!this.usersService) {
      this.usersService = this.moduleRef.get(UsersService, { strict: false });
    }

    const userResponse = await this.usersService.findOne(decoded.id);
    const dbUser = userResponse?.data || userResponse;

    if (!dbUser) {
      throw new UnauthorizedException(
        'Пользователь не найден в системе библиотеки',
      );
    }

    if (!dbUser) {
      throw new UnauthorizedException(
        'Пользователь не найден в системе библиотеки',
      );
    }

    if (
      dbUser.isActive === false ||
      String(dbUser.isActive).toLowerCase() === 'false'
    ) {
      if (dbUser.profile && dbUser.profile !== '') {
        throw new UnauthorizedException(
          'Ваш аккаунт не активирован. Пожалуйста, проверьте почту и введите ПИН-код.',
        );
      } else {
        throw new ForbiddenException(
          'Доступ запрещен: Ваш аккаунт заблокирован администратором библиотеки.',
        );
      }
    }

    const cleanUser =
      typeof dbUser.toObject === 'function' ? dbUser.toObject() : dbUser;

    request.user = {
      id: cleanUser._id?.toString() || decoded.id,
      email: cleanUser.email,
      fullName: cleanUser.fullName,
      role: cleanUser.role || decoded.role,
    };

    return true;
  }

  private async verifyAndRefreshToken(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    response: Response,
  ): Promise<{ id: string; role: UserRole }> {
    if (accessToken) {
      try {
        return await this.verifyAccessToken(accessToken);
      } catch (error: unknown) {
        if (error instanceof TokenExpiredError && refreshToken) {
          return await this.refreshAccessToken(refreshToken, response);
        }
        if (error instanceof JsonWebTokenError) {
          throw new UnauthorizedException('Токен доступа недействителен.');
        }
        throw error;
      }
    }

    if (refreshToken) {
      return await this.refreshAccessToken(refreshToken, response);
    }

    throw new UnauthorizedException('Токен не предоставлен');
  }

  private async verifyAccessToken(
    token: string,
  ): Promise<{ id: string; role: UserRole }> {
    const secretKey = this.configService.get<string>('jwt.access_key');
    return await this.jwtService.verifyAsync(token, { secret: secretKey });
  }

  private async refreshAccessToken(
    refreshToken: string,
    response: Response,
  ): Promise<{ id: string; role: UserRole }> {
    try {
      const secretKey = this.configService.get<string>('jwt.refresh_key');
      const { exp, iat, ...clean } = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: secretKey },
      );

      const newAccessToken = await this.generateAccessToken(clean);
      const isProd = this.configService.get('NODE_ENV') === 'production';

      response.cookie('accessToken', newAccessToken, {
        signed: true,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        expires: new Date(
          Date.now() +
            (this.configService.get<number>('jwt.access_time') || 3600) * 1000,
        ),
      });

      return clean;
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Срок действия токена обновления истек. Пожалуйста, войдите снова.',
        );
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Токен обновления недействителен.');
      }
      console.error(error);
      throw new InternalServerErrorException('Обновление токена не удалось');
    }
  }

  private async generateAccessToken(payload: {
    id: string;
    role: UserRole;
  }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.access_key'),
      expiresIn: `${this.configService.get<number>('jwt.access_time') || 3600}s`,
    });
  }
}
