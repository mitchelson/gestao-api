import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { VisitantesService } from './visitantes.service';

@Controller('v1/visitantes')
export class VisitantesController {
  constructor(private readonly visitantesService: VisitantesService) {}

  @Roles('admin', 'supervisor', 'lider')
  @Get()
  async findAll() {
    try {
      return this.visitantesService.findAll();
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
      throw new InternalServerErrorException('Erro ao buscar visitantes');
    }
  }

  /** Cadastro público (formulário de visitantes). */
  @Public()
  @Post()
  async create(@Body() body: Record<string, unknown>) {
    if (!body.nome || !body.celular) {
      throw new BadRequestException('Nome e celular sao obrigatorios');
    }
    try {
      return this.visitantesService.create(body);
    } catch (error) {
      console.error('Erro ao criar visitante:', error);
      throw new InternalServerErrorException('Erro ao criar visitante');
    }
  }

  @Roles('admin', 'supervisor', 'lider')
  @Get('mensagens-status')
  async mensagensStatus() {
    try {
      return this.visitantesService.mensagensStatus();
    } catch (error: unknown) {
      console.error('Erro ao buscar status de mensagens:', error);
      const detail = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException({
        error: 'Erro ao buscar status de mensagens',
        detail,
      });
    }
  }

  @Roles('admin', 'supervisor', 'lider')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return this.visitantesService.findOne(id);
    } catch (error) {
      console.error('Erro ao buscar visitante:', error);
      throw new InternalServerErrorException('Erro ao buscar visitante');
    }
  }

  @Roles('admin', 'supervisor', 'lider')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      return this.visitantesService.update(id, body);
    } catch (error) {
      console.error('Erro ao atualizar visitante:', error);
      throw new InternalServerErrorException('Erro ao atualizar visitante');
    }
  }

  @Roles('admin', 'supervisor', 'lider')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return this.visitantesService.remove(id);
    } catch (error) {
      console.error('Erro ao deletar visitante:', error);
      throw new InternalServerErrorException('Erro ao deletar visitante');
    }
  }
}
