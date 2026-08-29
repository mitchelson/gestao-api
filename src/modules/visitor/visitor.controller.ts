import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { VisitorService } from './visitor.service';

@Controller('v1/visitor/restricted-action')
export class VisitorController {
  constructor(
    private readonly visitorService: VisitorService,
    private readonly authz: AuthorizationService,
  ) {}

  @Post()
  @HttpCode(200)
  async restrictedAction(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { action?: string },
  ) {
    const u = this.authz.requireAuth(user);
    if (u.role !== 'visitor') {
      throw new ForbiddenException('Apenas visitantes');
    }

    const action =
      typeof body.action === 'string' ? body.action.trim() : 'ação desconhecida';
    if (!action) {
      throw new BadRequestException('action obrigatório');
    }

    return this.visitorService.restrictedAction(u.userId, action);
  }
}
