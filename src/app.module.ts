import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { ContatoModule } from './modules/contato/contato.module';
import { DonsEspirituaisModule } from './modules/dons-espirituais/dons-espirituais.module';
import { EscalasModule } from './modules/escalas/escalas.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { FeedModule } from './modules/feed/feed.module';
import { FormMinisteriosModule } from './modules/form-ministerios/form-ministerios.module';
import { MensagensModule } from './modules/mensagens/mensagens.module';
import { MinisteriosModule } from './modules/ministerios/ministerios.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PushModule } from './modules/push/push.module';
import { RepertorioModule } from './modules/repertorio/repertorio.module';
import { ResponsaveisModule } from './modules/responsaveis/responsaveis.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { VisitantesModule } from './modules/visitantes/visitantes.module';
import { VisitorModule } from './modules/visitor/visitor.module';
import { YoutubeModule } from './modules/youtube/youtube.module';
import { V1Controller } from './v1/v1.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    MinisteriosModule,
    EventosModule,
    EscalasModule,
    RepertorioModule,
    FeedModule,
    VisitantesModule,
    MensagensModule,
    ResponsaveisModule,
    NotificationsModule,
    PushModule,
    DonsEspirituaisModule,
    FormMinisteriosModule,
    AppConfigModule,
    UploadModule,
    ContatoModule,
    YoutubeModule,
    VisitorModule,
  ],
  controllers: [HealthController, V1Controller],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
