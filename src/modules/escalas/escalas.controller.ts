import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';
import type { RequestUser } from '../../common/types/auth.types';
import { EscalasService } from './escalas.service';

@Controller('v1/escalas')
export class EscalasController {
  constructor(private readonly escalasService: EscalasService) {}

  @Get('minhas')
  listMinhas(
    @CurrentUser() user: RequestUser,
    @Query('only') only?: string,
  ) {
    return this.escalasService.listMinhas(user.userId, only === 'mine');
  }

  @Get('trocas')
  listTrocas(@CurrentUser() user: RequestUser) {
    return this.escalasService.listTrocas(user.userId);
  }

  @Post('trocas')
  @HttpCode(HttpStatus.CREATED)
  createTroca(
    @CurrentUser() user: RequestUser,
    @Body() body: { escala_solicitante_id?: string; escala_destinatario_id?: string },
  ) {
    return this.escalasService.createTroca(user.userId, body);
  }

  @Put('trocas/:id')
  updateTroca(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.escalasService.updateTroca(user.userId, id, body.status);
  }

  @Post('notify')
  notify(
    @CurrentUser() user: RequestUser,
    @Body() body: { evento_id?: string; ministerio_id?: string },
  ) {
    return this.escalasService.notify(user, body);
  }

  @Get()
  @Public()
  list(
    @Query('evento_id') evento_id?: string,
    @Query('ministerio_id') ministerio_id?: string,
    @Query('future') future?: string,
  ) {
    return this.escalasService.list({ evento_id, ministerio_id, future });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.escalasService.create(user, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { status?: string; funcao?: string },
  ) {
    return this.escalasService.update(user, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.escalasService.delete(user, id);
  }
}
