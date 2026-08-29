import { Injectable, NotFoundException } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class ResponsaveisService {
  async findAll() {
    return sql`
      SELECT u.id, u.nome, u.foto_url
      FROM users u
      JOIN ministerio_membros mm ON mm.user_id = u.id
      JOIN ministerios m ON m.id = mm.ministerio_id
      WHERE m.nome ILIKE '%integra%' AND u.ativo = true
      ORDER BY u.nome ASC
    `;
  }

  async create(nome: string) {
    const rows = await sql`
      INSERT INTO responsaveis (nome) VALUES (${nome})
      RETURNING *
    `;
    return rows[0];
  }

  async remove(id: string) {
    const rows = await sql`
      DELETE FROM responsaveis WHERE id = ${id} RETURNING id
    `;
    if (rows.length === 0) {
      throw new NotFoundException('Responsável não encontrado');
    }
    return { success: true };
  }
}
