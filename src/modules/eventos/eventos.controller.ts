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
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { EventosService } from './eventos.service';

@Controller('v1/eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Public()
  @Get()
  list() {
    return this.eventosService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.eventosService.create(user, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.eventosService.update(user, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.eventosService.delete(user, id);
  }

  @Public()
  @Get(':id/posicoes')
  listPosicoes(@Param('id') id: string) {
    return this.eventosService.listPosicoes(id);
  }

  @Post(':id/posicoes')
  @HttpCode(HttpStatus.CREATED)
  createPosicao(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.eventosService.createPosicao(user, id, body);
  }

  @Delete(':id/posicoes')
  deletePosicao(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { posicao_id?: string },
  ) {
    return this.eventosService.deletePosicao(user, id, body.posicao_id);
  }
}

@Controller('v1/eventos/modelos')
export class EventosModelosController {
  constructor(private readonly eventosService: EventosService) {}

  @Public()
  @Get()
  listModelos() {
    return this.eventosService.listModelos();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createModelo(@Body() body: Record<string, unknown>) {
    return this.eventosService.createModelo(body);
  }

  @Put(':id')
  updateModelo(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.eventosService.updateModelo(id, body);
  }

  @Delete(':id')
  deleteModelo(@Param('id') id: string) {
    return this.eventosService.deleteModelo(id);
  }
}
