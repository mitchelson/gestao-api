import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { ContatoService } from './contato.service';

@Controller('v1/contato')
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Public()
  @Post()
  async submit(@Body() body: Record<string, unknown>) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('JSON inválido');
    }

    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const assunto = typeof body.assunto === 'string' ? body.assunto.trim() : '';
    const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';

    if (!nome || nome.length < 2) {
      throw new BadRequestException('Nome é obrigatório');
    }
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Email inválido');
    }
    if (!assunto) {
      throw new BadRequestException('Assunto é obrigatório');
    }
    if (!mensagem || mensagem.length < 5) {
      throw new BadRequestException('Mensagem é obrigatória');
    }

    try {
      return this.contatoService.submit(body);
    } catch (error: unknown) {
      console.error('Erro no contato:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      throw new InternalServerErrorException(msg);
    }
  }
}
