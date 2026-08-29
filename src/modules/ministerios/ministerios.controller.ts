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
import { MinisteriosService } from './ministerios.service';

@Controller('v1/ministerios')
export class MinisteriosController {
  constructor(private readonly ministeriosService: MinisteriosService) {}

  @Public()
  @Get()
  list() {
    return this.ministeriosService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.ministeriosService.create(user, body);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ministeriosService.getById(id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.ministeriosService.update(user, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ministeriosService.delete(user, id);
  }

  @Public()
  @Get(':id/funcoes')
  listFuncoes(@Param('id') id: string) {
    return this.ministeriosService.listFuncoes(id);
  }

  @Post(':id/funcoes')
  @HttpCode(HttpStatus.CREATED)
  createFuncao(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { nome?: string },
  ) {
    return this.ministeriosService.createFuncao(user, id, body.nome ?? '');
  }

  @Delete(':id/funcoes')
  deleteFuncao(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { funcao_id?: string },
  ) {
    return this.ministeriosService.deleteFuncao(user, id, body.funcao_id ?? '');
  }
}
