import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { ResponsaveisService } from './responsaveis.service';

@Controller('v1/responsaveis')
@Public()
export class ResponsaveisController {
  constructor(private readonly responsaveisService: ResponsaveisService) {}

  @Get()
  async findAll() {
    try {
      return this.responsaveisService.findAll();
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      throw new InternalServerErrorException('Erro ao buscar responsáveis');
    }
  }

  @Post()
  async create(@Body() body: { nome?: string }) {
    if (!body.nome) {
      throw new BadRequestException('Nome é obrigatório');
    }
    try {
      return this.responsaveisService.create(body.nome);
    } catch (error) {
      console.error('Erro ao criar responsável:', error);
      throw new InternalServerErrorException('Erro ao criar responsável');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return this.responsaveisService.remove(id);
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      throw new InternalServerErrorException('Erro ao remover responsável');
    }
  }
}
