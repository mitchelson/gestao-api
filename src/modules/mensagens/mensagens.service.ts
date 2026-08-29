import { Injectable, NotFoundException } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class MensagensService {
  async listCategorias() {
    return sql`
      SELECT c.*,
        COALESCE(
          json_agg(
            json_build_object('id', m.id, 'titulo', m.titulo, 'corpo', m.corpo, 'ordem', m.ordem)
            ORDER BY m.ordem
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as modelos
      FROM mensagem_categorias c
      LEFT JOIN mensagem_modelos m ON m.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.ordem
    `;
  }

  async createCategoria(body: { nome?: string; descricao?: string; ordem?: number; dia?: string }) {
    const { nome, descricao, ordem, dia } = body;
    const maxOrdem =
      ordem ??
      (
        await sql`SELECT COALESCE(MAX(ordem), 0) + 1 as next FROM mensagem_categorias`
      )[0].next;

    const result = await sql`
      INSERT INTO mensagem_categorias (nome, dia, descricao, ordem)
      VALUES (${nome!}, ${dia!}, ${descricao || null}, ${maxOrdem})
      RETURNING *
    `;
    return result[0];
  }

  async updateCategoria(id: string, body: Record<string, unknown>) {
    const sets: string[] = [];

    if (body.nome !== undefined) sets.push('nome');
    if (body.descricao !== undefined) sets.push('descricao');
    if (body.ordem !== undefined) sets.push('ordem');
    if (body.ativa !== undefined) sets.push('ativa');

    if (sets.length === 0) {
      return null;
    }

    let result;
    if (sets.length === 1 && sets[0] === 'ativa') {
      result = await sql`UPDATE mensagem_categorias SET ativa = ${body.ativa} WHERE id = ${id} RETURNING *`;
    } else if (sets.length === 1 && sets[0] === 'nome') {
      result = await sql`UPDATE mensagem_categorias SET nome = ${body.nome} WHERE id = ${id} RETURNING *`;
    } else if (sets.length === 1 && sets[0] === 'descricao') {
      result = await sql`UPDATE mensagem_categorias SET descricao = ${body.descricao} WHERE id = ${id} RETURNING *`;
    } else if (sets.length === 1 && sets[0] === 'ordem') {
      result = await sql`UPDATE mensagem_categorias SET ordem = ${body.ordem} WHERE id = ${id} RETURNING *`;
    } else {
      result = await sql`
        UPDATE mensagem_categorias
        SET nome = CASE WHEN ${body.nome !== undefined} THEN ${body.nome} ELSE nome END,
            descricao = CASE WHEN ${body.descricao !== undefined} THEN ${body.descricao} ELSE descricao END,
            ordem = CASE WHEN ${body.ordem !== undefined} THEN ${body.ordem} ELSE ordem END,
            ativa = CASE WHEN ${body.ativa !== undefined} THEN ${body.ativa} ELSE ativa END
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (result.length === 0) {
      throw new NotFoundException('Categoria nao encontrada');
    }
    return result[0];
  }

  async deleteCategoria(id: string) {
    await sql`DELETE FROM mensagem_modelos WHERE categoria_id = ${id}`;
    await sql`DELETE FROM visitante_mensagens_enviadas WHERE categoria_id = ${id}`;
    const result = await sql`DELETE FROM mensagem_categorias WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      throw new NotFoundException('Categoria nao encontrada');
    }
    return { success: true };
  }

  async createModelo(body: { categoria_id?: string; titulo?: string; corpo?: string }) {
    const { categoria_id, titulo, corpo } = body;
    const maxOrdem = (
      await sql`SELECT COALESCE(MAX(ordem), 0) + 1 as next FROM mensagem_modelos WHERE categoria_id = ${categoria_id!}`
    )[0].next;

    const result = await sql`
      INSERT INTO mensagem_modelos (categoria_id, titulo, corpo, ordem)
      VALUES (${categoria_id!}, ${titulo!}, ${corpo!}, ${maxOrdem})
      RETURNING *
    `;
    return result[0];
  }

  async updateModelo(id: string, body: { titulo?: string; corpo?: string }) {
    const { titulo, corpo } = body;
    const result = await sql`
      UPDATE mensagem_modelos
      SET titulo = COALESCE(${titulo ?? null}, titulo),
          corpo = COALESCE(${corpo ?? null}, corpo)
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      throw new NotFoundException('Modelo nao encontrado');
    }
    return result[0];
  }

  async deleteModelo(id: string) {
    const result = await sql`DELETE FROM mensagem_modelos WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      throw new NotFoundException('Modelo nao encontrado');
    }
    return { success: true };
  }

  async listEnviadas(visitanteId: string) {
    return sql`
      SELECT * FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId}
      ORDER BY enviado_em DESC
    `;
  }

  async createEnviada(visitanteId: string, categoriaId: string) {
    const result = await sql`
      INSERT INTO visitante_mensagens_enviadas (visitante_id, categoria_id, enviado_em)
      VALUES (${visitanteId}, ${categoriaId}, NOW())
      ON CONFLICT (visitante_id, categoria_id)
      DO UPDATE SET enviado_em = NOW()
      RETURNING *
    `;
    return result[0];
  }

  async deleteEnviada(visitanteId: string, categoriaId: string) {
    await sql`
      DELETE FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId}
      AND categoria_id = ${categoriaId}
    `;
    return { success: true };
  }
}
