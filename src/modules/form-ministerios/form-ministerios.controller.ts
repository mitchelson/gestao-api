import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { FormMinisteriosService } from './form-ministerios.service';

@Controller('v1/form-ministerios')
export class FormMinisteriosController {
  constructor(private readonly formService: FormMinisteriosService) {}

  @Get()
  async get(@CurrentUser() user: RequestUser | undefined) {
    if (!user?.userId) throw new UnauthorizedException('Unauthorized');
    return this.formService.getForUser(user.userId);
  }

  @Post()
  async save(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { ministerios?: unknown[] },
  ) {
    if (!user?.userId) throw new UnauthorizedException('Unauthorized');
    if (!Array.isArray(body.ministerios) || body.ministerios.length === 0) {
      throw new BadRequestException('Selecione ao menos um ministério');
    }
    return this.formService.saveForUser(user.userId, body.ministerios);
  }
}

@Controller('v1/form-ministerios/admin')
export class FormMinisteriosAdminController {
  constructor(private readonly formService: FormMinisteriosService) {}

  @Get()
  async listAll(@CurrentUser() user: RequestUser | undefined) {
    if (!user?.userId) throw new UnauthorizedException('Unauthorized');
    if (!['admin', 'supervisor'].includes(user.role ?? '')) {
      throw new ForbiddenException('Forbidden');
    }
    return this.formService.listAllAdmin();
  }
}
