import { Module } from '@nestjs/common';
import { EventosController, EventosModelosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  controllers: [EventosController, EventosModelosController],
  providers: [EventosService],
})
export class EventosModule {}
