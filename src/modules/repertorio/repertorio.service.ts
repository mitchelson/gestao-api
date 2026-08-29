import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { sql } from '../../lib/sql';

@Injectable()
export class RepertorioService {
  private async canEdit(userId: string, eventoId: string): Promise<boolean> {
    const user = await sql`SELECT role FROM users WHERE id = ${userId}`;
    if (user[0]?.role === 'admin') return true;

    const evento =
      await sql`SELECT repertorio_ministerio_id, repertorio_funcao FROM eventos WHERE id = ${eventoId}`;
    const { repertorio_ministerio_id, repertorio_funcao } = evento[0] || {};
    if (!repertorio_ministerio_id) return false;

    const membership = await sql`
      SELECT 1 FROM ministerio_membros WHERE user_id = ${userId} AND ministerio_id = ${repertorio_ministerio_id}
    `;
    if (membership.length === 0) return false;

    if (repertorio_funcao) {
      const escala = await sql`
        SELECT 1 FROM escalas WHERE user_id = ${userId} AND evento_id = ${eventoId} AND funcao = ${repertorio_funcao}
      `;
      if (escala.length === 0) return false;
    }

    return true;
  }

  async get(eventoId: string, userId?: string) {
    const items = await sql`
      SELECT * FROM repertorio_items WHERE evento_id = ${eventoId} ORDER BY ordem, criado_em
    `;

    let canEditRepertoire = false;
    if (userId) {
      canEditRepertoire = await this.canEdit(userId, eventoId);
    }

    return { items, canEdit: canEditRepertoire };
  }

  async save(
    userId: string,
    body: {
      evento_id?: string;
      items?: Array<{
        nome?: string;
        tonalidade?: string;
        link?: string;
        observacoes?: string;
      }>;
    },
  ) {
    const { evento_id, items } = body;
    if (!evento_id || !Array.isArray(items)) {
      throw new BadRequestException('evento_id and items required');
    }

    if (!(await this.canEdit(userId, evento_id))) {
      throw new ForbiddenException('Forbidden');
    }

    await sql`DELETE FROM repertorio_items WHERE evento_id = ${evento_id}`;
    for (let i = 0; i < items.length; i++) {
      const { nome, tonalidade, link, observacoes } = items[i];
      if (!nome?.trim()) continue;
      await sql`
        INSERT INTO repertorio_items (evento_id, nome, tonalidade, link, observacoes, ordem)
        VALUES (${evento_id}, ${nome.trim()}, ${tonalidade || null}, ${link || null}, ${observacoes || null}, ${i})
      `;
    }

    const result =
      await sql`SELECT * FROM repertorio_items WHERE evento_id = ${evento_id} ORDER BY ordem`;
    return result;
  }

  async deleteAll(userId: string, evento_id: string) {
    if (!evento_id) throw new BadRequestException('evento_id required');

    if (!(await this.canEdit(userId, evento_id))) {
      throw new ForbiddenException('Forbidden');
    }

    await sql`DELETE FROM repertorio_items WHERE evento_id = ${evento_id}`;
    return { ok: true };
  }
}
