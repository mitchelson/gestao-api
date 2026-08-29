import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { DonsEspirituaisService } from './dons-espirituais.service';

@Controller('v1/dons-espirituais')
export class DonsEspirituaisController {
  constructor(
    private readonly donsService: DonsEspirituaisService,
    private readonly authz: AuthorizationService,
  ) {}

  @Get()
  get(@CurrentUser() user: RequestUser | undefined) {
    const u = this.authz.requireAuth(user);
    return this.donsService.getResults(u.userId);
  }

  @Post()
  save(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { answers?: number[] },
  ) {
    const u = this.authz.requireAuth(user);
    if (!Array.isArray(body.answers) || body.answers.length !== 76) {
      throw new BadRequestException('76 respostas obrigatórias');
    }
    return this.donsService.saveResults(u.userId, body.answers);
  }
}

@Controller('v1/dons-espirituais/admin')
export class DonsEspirituaisAdminController {
  constructor(
    private readonly donsService: DonsEspirituaisService,
    private readonly authz: AuthorizationService,
  ) {}

  @Get()
  listAll(@CurrentUser() user: RequestUser | undefined) {
    const u = this.authz.requireAuth(user);
    if (u.role !== 'admin' && u.role !== 'supervisor') {
      throw new ForbiddenException('Sem permissão');
    }
    return this.donsService.listAllAdmin();
  }
}
