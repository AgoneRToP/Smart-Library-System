import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dtos';
import type { Response } from 'express';
import { Protected } from '@/common/decorators';
import { GoogleAuthGuard } from '@/common/guards/google.guard';
import { GithubAuthGuard } from '@/common/guards/github.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Protected(false)
  @Get('/login')
  @Render('auth/login')
  renderLogin() {
    return { title: 'Авторизация' };
  }

  @Protected(false)
  @Get('/register')
  @Render('auth/register')
  renderRegister() {
    return { title: 'Регистрация' };
  }

  @Protected(false)
  @Get('/verify-email')
  @Render('auth/verify-email')
  renderVerifyEmail() {
    return { title: 'Подтвердите Email' };
  }

  @Protected(false)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: LoginDto, @Res() res: Response) {
    await this.service.login(payload, res);
  }

  @Post('/verify-login-pin')
  async verifyLoginPin(
    @Body() body: { email: string; pin: string },
    @Res() res: Response,
  ) {
    return this.service.verifyLoginPin(body, res);
  }

  @Post('/resend-login-pin')
  async resendLoginPin(@Body() body: { email: string }) {
    return this.service.resendLoginPin(body.email);
  }

  @Protected(false)
  @Post('/register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() payload: RegisterDto, @Res() res: Response) {
    await this.service.register(payload, res);
  }

  @Protected(false)
  @Post('/activate-pin')
  async activatePin(
    @Body('email') email: string,
    @Body('pin') pin: string,
    @Res() res: Response,
  ) {
    await this.service.activateWithPin(email, pin, res);
  }

  @Protected(false)
  @Get('/activate')
  async activate(@Query('token') token: string, @Res() res: Response) {
    await this.service.activate(token, res);
  }

  @Protected(false)
  @Get('/logout')
  logout(@Res() res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.redirect('/');
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google')
  async google() {}

  @UseGuards(GoogleAuthGuard)
  @Get('/google/callback')
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const response = await this.service.googleAuth(req.user);

    return this.service.handleOAuthSuccess(response, res);
  }

  @UseGuards(GithubAuthGuard)
  @Get('/github')
  async github() {}

  @UseGuards(GithubAuthGuard)
  @Get('/github/callback')
  async githubCallback(@Req() req: any, @Res() res: Response) {
    const response = await this.service.githubAuth(req.user);

    return this.service.handleOAuthSuccess(response, res);
  }
}
