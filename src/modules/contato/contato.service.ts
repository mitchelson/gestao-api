import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

const ASSUNTOS: Record<string, string> = {
  visitante: 'Primeira Visita',
  ministerio: 'Participar de Ministério',
  oracao: 'Pedido de Oração',
  evento: 'Informações sobre Eventos',
  outro: 'Outro',
};

@Injectable()
export class ContatoService {
  async submit(body: Record<string, unknown>) {
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const telefone = typeof body.telefone === 'string' ? body.telefone.trim() : '';
    const assunto = typeof body.assunto === 'string' ? body.assunto.trim() : '';
    const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';

    const assuntoLabel = ASSUNTOS[assunto] || assunto;
    const titulo = `Contato: ${assuntoLabel}`;
    const notifMensagem = `${nome}${telefone ? ` · ${telefone}` : ''} · ${email}\n\n${mensagem}`.slice(
      0,
      500,
    );
    const link = '/admin/mensagens';

    try {
      await sql`
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
        SELECT id, 'contato', ${titulo}, ${notifMensagem}, ${link}
        FROM users
        WHERE role = 'admin' AND ativo = true
      `;
    } catch (err) {
      console.error('Erro ao notificar admins (contato):', err);
    }

    return { ok: true };
  }
}
