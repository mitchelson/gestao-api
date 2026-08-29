import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class FeedService {
  async list(page: number, userId: string | null) {
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
      let posts;
      if (userId) {
        posts = await sql`
          SELECT p.*, u.nome as autor_nome, u.foto_url as autor_foto,
            (SELECT count(*)::int FROM feed_likes WHERE post_id = p.id) as likes_count,
            (SELECT count(*)::int FROM feed_comments WHERE post_id = p.id) as comments_count,
            EXISTS(SELECT 1 FROM feed_likes WHERE post_id = p.id AND user_id = ${userId}) as liked
          FROM feed_posts p
          JOIN users u ON u.id = p.autor_id
          WHERE p.ativo = true
          ORDER BY p.fixado DESC, p.criado_em DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        posts = await sql`
          SELECT p.*, u.nome as autor_nome, u.foto_url as autor_foto,
            (SELECT count(*)::int FROM feed_likes WHERE post_id = p.id) as likes_count,
            (SELECT count(*)::int FROM feed_comments WHERE post_id = p.id) as comments_count,
            false as liked
          FROM feed_posts p
          JOIN users u ON u.id = p.autor_id
          WHERE p.ativo = true
          ORDER BY p.fixado DESC, p.criado_em DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      const total = await sql`SELECT count(*)::int as total FROM feed_posts WHERE ativo = true`;
      return {
        posts,
        total: total[0].total,
        page,
        pages: Math.ceil(Number(total[0].total) / limit),
      };
    } catch (error) {
      console.error('Erro ao buscar feed:', error);
      return { posts: [], total: 0, page: 1, pages: 0 };
    }
  }

  async create(
    user: RequestUser,
    body: {
      conteudo?: string;
      imagem_url?: string;
      link?: string;
      ministerio_ids?: string[];
      user_ids?: string[];
    },
  ) {
    const { conteudo, imagem_url, link, ministerio_ids, user_ids } = body;
    const mencoesMin = ministerio_ids?.length ? JSON.stringify(ministerio_ids) : null;
    const mencoesUsers = user_ids?.length ? JSON.stringify(user_ids) : null;

    const rows = await sql`
      INSERT INTO feed_posts (autor_id, conteudo, imagem_url, link, mencoes_ministerios, mencoes_users)
      VALUES (${user.userId}, ${conteudo || null}, ${imagem_url || null}, ${link || null}, ${mencoesMin}::jsonb, ${mencoesUsers}::jsonb)
      RETURNING *
    `;

    if (ministerio_ids?.length) {
      for (const minId of ministerio_ids) {
        const membros = await sql`
          SELECT user_id FROM ministerio_membros WHERE ministerio_id = ${minId} AND pendente = false AND user_id != ${user.userId}
        `;
        const min = await sql`SELECT nome FROM ministerios WHERE id = ${minId}`;
        const titulo = `${min[0]?.nome} foi mencionado`;
        const msg = conteudo?.substring(0, 80) || 'Nova postagem';
        for (const m of membros) {
          await sql`
            INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
            VALUES (${m.user_id}, 'feed_mencao', ${titulo}, ${msg}, '/feed')
          `;
        }
      }
    }

    if (user_ids?.length) {
      const msg = conteudo?.substring(0, 80) || 'Nova postagem';
      for (const uid of user_ids) {
        if (uid === user.userId) continue;
        await sql`
          INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
          VALUES (${uid}, 'feed_mencao', ${'Você foi mencionado em uma postagem'}, ${msg}, '/feed')
        `;
      }
    }

    return rows[0];
  }

  async canModify(user: RequestUser, postId: string): Promise<boolean> {
    if (user.role === 'admin') return true;
    const rows = await sql`SELECT autor_id FROM feed_posts WHERE id = ${postId}`;
    return rows[0]?.autor_id === user.userId;
  }

  async update(
    id: string,
    body: { conteudo?: string; imagem_url?: string; fixado?: boolean },
  ) {
    const { conteudo, imagem_url, fixado } = body;
    const rows = await sql`
      UPDATE feed_posts SET
        conteudo = COALESCE(${conteudo ?? null}, conteudo),
        imagem_url = COALESCE(${imagem_url ?? null}, imagem_url),
        fixado = COALESCE(${fixado ?? null}, fixado),
        atualizado_em = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  }

  async delete(id: string) {
    await sql`DELETE FROM feed_posts WHERE id = ${id}`;
  }

  async like(postId: string, userId: string) {
    await sql`
      INSERT INTO feed_likes (post_id, user_id) VALUES (${postId}, ${userId})
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;
  }

  async unlike(postId: string, userId: string) {
    await sql`DELETE FROM feed_likes WHERE post_id = ${postId} AND user_id = ${userId}`;
  }

  async getComments(postId: string) {
    return sql`
      SELECT c.*, u.nome as user_nome, u.foto_url as user_foto
      FROM feed_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.criado_em ASC
    `;
  }

  async addComment(postId: string, userId: string, conteudo: string) {
    const rows = await sql`
      INSERT INTO feed_comments (post_id, user_id, conteudo)
      VALUES (${postId}, ${userId}, ${conteudo.trim()})
      RETURNING *
    `;
    return rows[0];
  }

  async deleteComment(user: RequestUser, commentId: string) {
    if (user.role !== 'admin') {
      const comment = await sql`SELECT user_id FROM feed_comments WHERE id = ${commentId}`;
      if (comment[0]?.user_id !== user.userId) {
        return false;
      }
    }
    await sql`DELETE FROM feed_comments WHERE id = ${commentId}`;
    return true;
  }
}
