import { Module } from '@nestjs/common';
import { PushExpoController, PushSubscribeController } from './push.controller';
import { PushService } from './push.service';

@Module({
  controllers: [PushSubscribeController, PushExpoController],
  providers: [PushService],
})
export class PushModule {}
