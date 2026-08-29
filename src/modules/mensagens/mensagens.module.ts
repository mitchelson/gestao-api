import { Module } from '@nestjs/common';
import { MensagensController } from './mensagens.controller';
import { MensagensService } from './mensagens.service';

@Module({
  controllers: [MensagensController],
  providers: [MensagensService],
})
export class MensagensModule {}
