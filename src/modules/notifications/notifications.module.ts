import { Module } from '@nestjs/common';
import {
  NotificationsController,
  NotificationsReadAllController,
} from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, NotificationsReadAllController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
