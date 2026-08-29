import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { V1Controller } from './v1/v1.controller';

@Module({
  controllers: [HealthController, V1Controller],
})
export class AppModule {}
