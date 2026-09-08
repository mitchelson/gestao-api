import { Injectable, NotFoundException } from '@nestjs/common';
import {
  normalizeCategoria,
  parseAtivaInput,
} from '../../lib/mensagem-categorias';
import { sql } from '../../lib/sql.js';

@Injectable()
export class MensagensService {
  async listCategorias() {
    const rows = await sql`
      SELECT c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'categoria_id', m.categoria_id,
              'titulo', m.titulo,
              'corpo', m.corpo,
              'ordem', m.ordem
            )
            ORDER BY m.ordem
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as modelos
      FROM mensagem_categorias c
      LEFT JOIN mensagem_modelos m ON m.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.ordem
    `;
    return rows.map((row) => normalizeCategoria(row as Record<string, unknown>));
  }

  async createCategoria(body: {
    nome?: string;
    descricao?: string;
    ordem?: number;
    dia?: string;
    ativa?: unknown;
  }) {
    const { nome, descricao, ordem, dia } = body;
    const maxOrdem =
      ordem ??
      (
        await sql`SELECT COALESCE(MAX(ordem), 0) + 1 as next FROM mensagem_categorias`
      )[0].next;

    const ativaInicial = parseAtivaInput(body.ativa) === false ? false : true;

    const result = await sql`
      INSERT INTO mensagem_categorias (nome, dia, descricao, ordem, ativa)
      VALUES (${nome!}, ${dia!}, ${descricao || null}, ${maxOrdem}, ${ativaInicial})
      RETURNING *
    `;
    return normalizeCategoria(result[0] as Record<string, unknown>);
  }

  async updateCategoria(id: string, body: Record<string, unknown>) {
    const nome = body.nome;
    const descricao = body.descricao;
    const ordem = body.ordem;
    const dia = body.dia;
    const ativa = parseAtivaInput(body.ativa);

    const hasNome = body.nome !== undefined;
    const hasDescricao = body.descricao !== undefined;
    const hasOrdem = body.ordem !== undefined;
    const hasDia = body.dia !== undefined;
    const hasAtiva = ativa !== undefined;

    if (!hasNome && !hasDescricao && !hasOrdem && !hasDia && !hasAtiva) {
      return null;
    }

    let result;
    // Updates pontuais evitam CASE WHEN com boolean (pg + tagged template).
    if (hasAtiva && !hasNome && !hasDescricao && !hasOrdem && !hasDia) {
      result = await sql`
        UPDATE mensagem_categorias SET ativa = ${ativa} WHERE id = ${id} RETURNING *
      `;
    } else if (hasNome && !hasDescricao && !hasOrdem && !hasDia && !hasAtiva) {
      result = await sql`
        UPDATE mensagem_categorias SET nome = ${nome} WHERE id = ${id} RETURNING *
      `;
    } else if (hasDescricao && !hasNome && !hasOrdem && !hasDia && !hasAtiva) {
      result = await sql`
        UPDATE mensagem_categorias SET descricao = ${descricao} WHERE id = ${id} RETURNING *
      `;
    } else if (hasOrdem && !hasNome && !hasDescricao && !hasDia && !hasAtiva) {
      result = await sql`
        UPDATE mensagem_categorias SET ordem = ${ordem} WHERE id = ${id} RETURNING *
      `;
    } else if (hasDia && !hasNome && !hasDescricao && !hasOrdem && !hasAtiva) {
      result = await sql`
        UPDATE mensagem_categorias SET dia = ${dia} WHERE id = ${id} RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE mensagem_categorias
        SET
          nome = CASE WHEN ${hasNome} THEN ${nome ?? null} ELSE nome END,
          descricao = CASE WHEN ${hasDescricao} THEN ${descricao ?? null} ELSE descricao END,
          ordem = CASE WHEN ${hasOrdem} THEN ${ordem ?? null} ELSE ordem END,
          dia = CASE WHEN ${hasDia} THEN ${dia ?? null} ELSE dia END,
          ativa = CASE WHEN ${hasAtiva} THEN ${ativa ?? true} ELSE ativa END
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (result.length === 0) {
      throw new NotFoundException('Categoria nao encontrada');
    }
    return normalizeCategoria(result[0] as Record<string, unknown>);
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
