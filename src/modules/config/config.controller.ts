import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Put,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { ConfigService } from './config.service';

@Controller('v1/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get()
  getAll() {
    return this.configService.getAll();
  }

  @Put()
  @HttpCode(200)
  set(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { chave?: string; valor?: string },
  ) {
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    return this.configService.set(body.chave!, body.valor!);
  }
}
