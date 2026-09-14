import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { MensagensService } from './mensagens.service';

@Controller('v1/mensagens')
export class MensagensController {
  constructor(private readonly mensagensService: MensagensService) {}

  /** Array de categorias com `ativa` boolean e `modelos[].corpo`. */
  @Get('categorias')
  @Roles('admin', 'supervisor', 'lider', 'membro')
  async listCategorias() {
    try {
      return await this.mensagensService.listCategorias();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Erro ao buscar categorias:', msg);
      throw new InternalServerErrorException({ error: 'Erro ao buscar categorias', detail: msg });
    }
  }

  @Post('categorias')
  @Roles('admin', 'supervisor', 'lider')
  @HttpCode(HttpStatus.CREATED)
  async createCategoria(
    @Body()
    body: {
      nome?: string;
      descricao?: string;
      ordem?: number;
      dia?: string;
      ativa?: unknown;
    },
  ) {
    if (!body.nome || !body.dia) {
      throw new BadRequestException('Nome e dia obrigatorios');
    }
    try {
      return await this.mensagensService.createCategoria(body);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Erro ao criar categoria:', msg);
      throw new InternalServerErrorException({ error: 'Erro ao criar categoria', detail: msg });
    }
  }

  @Put('categorias/:id')
  @Roles('admin', 'supervisor', 'lider')
  async updateCategoria(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      const result = await this.mensagensService.updateCategoria(id, body);
      if (result === null) {
        throw new BadRequestException('Nenhum campo para atualizar');
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Erro ao atualizar categoria:', msg, error);
      throw new InternalServerErrorException({ error: 'Erro ao atualizar categoria', detail: msg });
    }
  }

  @Delete('categorias/:id')
  @Roles('admin', 'supervisor', 'lider')
  async deleteCategoria(@Param('id') id: string) {
    try {
      return await this.mensagensService.deleteCategoria(id);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Erro ao deletar categoria:', error);
      throw new InternalServerErrorException('Erro ao deletar categoria');
    }
  }

  @Post('modelos')
  @Roles('admin', 'supervisor', 'lider')
  @HttpCode(HttpStatus.CREATED)
  async createModelo(@Body() body: { categoria_id?: string; titulo?: string; corpo?: string }) {
    if (!body.categoria_id || !body.titulo || !body.corpo) {
      throw new BadRequestException('categoria_id, titulo e corpo sao obrigatorios');
    }
    try {
      return await this.mensagensService.createModelo(body);
    } catch (error) {
      console.error('Erro ao criar modelo:', error);
      throw new InternalServerErrorException('Erro ao criar modelo');
    }
  }

  @Put('modelos/:id')
  @Roles('admin', 'supervisor', 'lider')
  async updateModelo(@Param('id') id: string, @Body() body: { titulo?: string; corpo?: string }) {
    try {
      return await this.mensagensService.updateModelo(id, body);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Erro ao atualizar modelo:', error);
      throw new InternalServerErrorException('Erro ao atualizar modelo');
    }
  }

  @Delete('modelos/:id')
  @Roles('admin', 'supervisor', 'lider')
  async deleteModelo(@Param('id') id: string) {
    try {
      return await this.mensagensService.deleteModelo(id);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Erro ao deletar modelo:', error);
      throw new InternalServerErrorException('Erro ao deletar modelo');
    }
  }

  @Get('enviadas')
  @Roles('admin', 'supervisor', 'lider', 'membro')
  async listEnviadas(@Query('visitante_id') visitanteId?: string) {
    if (!visitanteId) {
      throw new BadRequestException('visitante_id obrigatorio');
    }
    try {
      return await this.mensagensService.listEnviadas(visitanteId);
    } catch (error) {
      console.error('Erro ao buscar mensagens enviadas:', error);
      throw new InternalServerErrorException('Erro ao buscar mensagens enviadas');
    }
  }

  @Post('enviadas')
  @Roles('admin', 'supervisor', 'lider', 'membro')
  @HttpCode(HttpStatus.CREATED)
  async createEnviada(@Body() body: { visitante_id?: string; categoria_id?: string }) {
    if (!body.visitante_id || !body.categoria_id) {
      throw new BadRequestException('visitante_id e categoria_id obrigatorios');
    }
    try {
      return await this.mensagensService.createEnviada(body.visitante_id, body.categoria_id);
    } catch (error: unknown) {
      console.error('Erro ao registrar mensagem enviada:', error);
      throw new InternalServerErrorException({
        error: 'Erro ao registrar mensagem enviada',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @Delete('enviadas')
  @Roles('admin', 'supervisor', 'lider', 'membro')
  async deleteEnviada(
    @Query('visitante_id') visitanteId?: string,
    @Query('categoria_id') categoriaId?: string,
  ) {
    if (!visitanteId || !categoriaId) {
      throw new BadRequestException('visitante_id e categoria_id obrigatorios');
    }
    try {
      return await this.mensagensService.deleteEnviada(visitanteId, categoriaId);
    } catch (error: unknown) {
      console.error('Erro ao remover mensagem enviada:', error);
      throw new InternalServerErrorException({
        error: 'Erro ao remover mensagem enviada',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
