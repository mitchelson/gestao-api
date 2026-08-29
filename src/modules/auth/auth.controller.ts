import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { AuthService } from './auth.service';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('mobile')
  mobileLogin(@Body() body: Record<string, unknown>) {
    return this.authService.mobileLogin(body);
  }

  @Get('permissions')
  getPermissions(@CurrentUser() user: RequestUser) {
    return this.authService.getPermissions(user.userId);
  }

  @Public()
  @Post('set-mode')
  setMode(@Body() body: { mode?: string }, @Res({ passthrough: true }) res: Response) {
    res.cookie('auth_mode', body.mode === 'login' ? 'login' : 'signup', {
      path: '/',
      maxAge: 300_000,
      httpOnly: true,
      sameSite: 'lax',
    });
    return { ok: true };
  }
}
