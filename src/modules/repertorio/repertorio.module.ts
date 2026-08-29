import { Module } from '@nestjs/common';
import { RepertorioController } from './repertorio.controller';
import { RepertorioService } from './repertorio.service';

@Module({
  controllers: [RepertorioController],
  providers: [RepertorioService],
})
export class RepertorioModule {}
