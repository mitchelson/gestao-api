import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthorizationService } from './services/authorization.service';

@Global()
@Module({
  providers: [
    AuthorizationService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthorizationService],
})
export class CommonModule {}
