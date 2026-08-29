import { Module } from '@nestjs/common';
import { MinisteriosController } from './ministerios.controller';
import { MinisteriosService } from './ministerios.service';

@Module({
  controllers: [MinisteriosController],
  providers: [MinisteriosService],
})
export class MinisteriosModule {}
