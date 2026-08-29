import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { PushService } from './push.service';

@Controller('v1/push/subscribe')
export class PushSubscribeController {
  constructor(
    private readonly pushService: PushService,
    private readonly authz: AuthorizationService,
  ) {}

  @Post()
  @HttpCode(200)
  subscribe(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } },
  ) {
    const u = this.authz.requireAuth(user);
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      throw new BadRequestException('Subscription inválida');
    }
    return this.pushService.subscribeWebPush(u.userId, body.endpoint, {
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    });
  }

  @Delete()
  @HttpCode(200)
  unsubscribe(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { endpoint?: string },
  ) {
    const u = this.authz.requireAuth(user);
    if (!body.endpoint) {
      throw new BadRequestException('endpoint obrigatório');
    }
    return this.pushService.unsubscribeWebPush(u.userId, body.endpoint);
  }
}

@Controller('v1/push/expo')
export class PushExpoController {
  constructor(
    private readonly pushService: PushService,
    private readonly authz: AuthorizationService,
  ) {}

  @Post()
  @HttpCode(200)
  register(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { token?: string },
  ) {
    const u = this.authz.requireAuth(user);
    if (!body.token || !body.token.startsWith('ExponentPushToken[')) {
      throw new BadRequestException('Token inválido');
    }
    return this.pushService.registerExpoToken(u.userId, body.token);
  }
}
