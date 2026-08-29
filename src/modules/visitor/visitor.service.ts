import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class VisitorService {
  async restrictedAction(userId: string, action: string) {
    const rows = await sql`
      SELECT nome, email FROM users WHERE id = ${userId} LIMIT 1
    `;
    const nome = rows[0]?.nome ?? 'Visitante';
    const email = rows[0]?.email ?? '';
    const titulo = 'Visitante tentou ação restrita';
    const mensagem = `${nome}${email ? ` (${email})` : ''} tentou: ${action}`;
    const link = '/admin/membros';

    await sql`
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
      SELECT id, 'visitor_restrito', ${titulo}, ${mensagem}, ${link}
      FROM users
      WHERE role = 'admin' AND ativo = true
    `;

    return { ok: true };
  }
}
