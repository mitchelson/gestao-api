import {
  Body,
  Controller,
  Get,
  HttpCode,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { NotificationsService } from './notifications.service';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authz: AuthorizationService,
  ) {}

  @Get()
  get(
    @CurrentUser() user: RequestUser | undefined,
    @Query('count') count?: string,
  ) {
    const u = this.authz.requireAuth(user);
    return this.notificationsService.getForUser(u.userId, count === 'true');
  }

  @Put()
  @HttpCode(200)
  markRead(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { id?: string; all?: boolean },
  ) {
    const u = this.authz.requireAuth(user);
    return this.notificationsService.markRead(u.userId, body.id, body.all);
  }
}

@Controller('v1/notifications/read-all')
export class NotificationsReadAllController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authz: AuthorizationService,
  ) {}

  @Put()
  @HttpCode(200)
  markAllRead(@CurrentUser() user: RequestUser | undefined) {
    const u = this.authz.requireAuth(user);
    return this.notificationsService.markAllRead(u.userId);
  }
}
