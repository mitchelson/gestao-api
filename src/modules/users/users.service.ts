import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assignAccountRole,
  ensureAccountExists,
  fetchAccountRoles,
  fetchAccountRolesBatch,
  fromLegacyRole,
  getOrCreateMinistryContext,
  removeAccountRole,
  syncLegacyPrimaryRole,
  syncMinistryLeaderRole,
} from '../../lib/account-roles';
import { sql } from '../../lib/sql';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class UsersService {
  constructor(private readonly authz: AuthorizationService) {}

  async getMe(userId: string) {
    const rows = await sql`
      SELECT id, nome, email, foto_url, bio, nascimento, data_batismo, telefone, permite_escala_multipla
      FROM users WHERE id = ${userId}
    `;
    return rows[0];
  }

  async updateMe(
    userId: string,
    body: {
      nome?: string;
      bio?: string | null;
      nascimento?: string | null;
      data_batismo?: string | null;
      foto_url?: string | null;
      permite_escala_multipla?: boolean | null;
    },
  ) {
    const { nome, bio, nascimento, data_batismo, foto_url, permite_escala_multipla } =
      body;

    const rows = await sql`
      UPDATE users SET
        nome = COALESCE(${nome?.trim() || null}, nome),
        bio = COALESCE(${bio ?? null}, bio),
        nascimento = COALESCE(${nascimento || null}, nascimento),
        data_batismo = COALESCE(${data_batismo || null}, data_batismo),
        foto_url = COALESCE(${foto_url || null}, foto_url),
        permite_escala_multipla = COALESCE(${permite_escala_multipla ?? null}, permite_escala_multipla)
      WHERE id = ${userId}
      RETURNING id, nome, email, foto_url, bio, nascimento, data_batismo, permite_escala_multipla
    `;
    return rows[0];
  }

  async deleteMe(userId: string) {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    await sql`DELETE FROM accounts WHERE id = ${userId}::uuid`.catch(() => {});
    return { ok: true };
  }

  async getIndisponibilidades(userId: string) {
    const rows = await sql`
      SELECT * FROM user_indisponibilidades
      WHERE user_id = ${userId} AND data_fim >= CURRENT_DATE
      ORDER BY data_inicio ASC
    `;
    return rows;
  }

  async createIndisponibilidade(
    userId: string,
    body: { data_inicio?: string; data_fim?: string; motivo?: string },
  ) {
    const { data_inicio, data_fim, motivo } = body;
    if (!data_inicio || !data_fim) {
      throw new BadRequestException('Datas obrigatórias');
    }

    const rows = await sql`
      INSERT INTO user_indisponibilidades (user_id, data_inicio, data_fim, motivo)
      VALUES (${userId}, ${data_inicio}, ${data_fim}, ${motivo || null})
      RETURNING *
    `;
    return rows[0];
  }

  async deleteIndisponibilidade(userId: string, id: string) {
    await sql`DELETE FROM user_indisponibilidades WHERE id = ${id} AND user_id = ${userId}`;
    return { ok: true };
  }

  async getMyMinisterios(userId: string) {
    const rows = await sql`
      SELECT ministerio_id FROM ministerio_membros WHERE user_id = ${userId}
    `;
    return rows.map((r: any) => r.ministerio_id);
  }

  async joinMinisterio(userId: string, ministerio_id: string) {
    if (!ministerio_id) {
      throw new BadRequestException('ministerio_id obrigatório');
    }
    const rows = await sql`
      INSERT INTO ministerio_membros (user_id, ministerio_id, pendente)
      VALUES (${userId}, ${ministerio_id}, true)
      ON CONFLICT (ministerio_id, user_id) DO NOTHING
      RETURNING *
    `;
    return rows[0] ?? {};
  }

  async getPendencias(userId: string) {
    const cats =
      await sql`SELECT count(*)::int as total FROM mensagem_categorias WHERE ativa = true`;
    const totalCategorias = cats[0].total;
    if (totalCategorias === 0) return [];

    const pendencias = await sql`
      SELECT v.id, v.nome, v.celular, v.data_cadastro, v.sexo,
        count(vme.id)::int as enviadas
      FROM visitantes v
      LEFT JOIN visitante_mensagens_enviadas vme ON vme.visitante_id = v.id
      WHERE v.user_id = ${userId}
        AND v.sem_whatsapp = false
      GROUP BY v.id
      HAVING count(vme.id) < ${totalCategorias}
      ORDER BY v.data_cadastro DESC
    `;

    return pendencias.map((p: any) => ({
      ...p,
      total_categorias: totalCategorias,
      pendentes: totalCategorias - p.enviadas,
    }));
  }

  async listUsers(user: RequestUser) {
    this.authz.requireAdmin(user);

    const rows = await sql`
      SELECT u.*, 
        COALESCE(json_agg(json_build_object('ministerio_id', mm.ministerio_id, 'nome', m.nome, 'is_lider', mm.is_lider)) 
          FILTER (WHERE mm.id IS NOT NULL), '[]') as ministerios
      FROM users u
      LEFT JOIN ministerio_membros mm ON mm.user_id = u.id
      LEFT JOIN ministerios m ON m.id = mm.ministerio_id
      GROUP BY u.id
      ORDER BY u.nome ASC
    `;

    const ids = rows.map((u: any) => u.id);
    const rolesMap = await fetchAccountRolesBatch(ids);

    return rows.map((u: any) => ({
      ...u,
      roles: rolesMap[u.id] || [],
    }));
  }

  async updateUser(
    user: RequestUser,
    body: {
      id?: string;
      role?: string;
      ativo?: boolean;
      permite_escala_multipla?: boolean;
      telefone?: string;
      nome?: string;
    },
  ) {
    this.authz.requireAdmin(user);

    const { id, role, ativo, permite_escala_multipla, telefone, nome } = body;
    if (!id) throw new BadRequestException('id obrigatório');

    const rows = await sql`
      UPDATE users SET
        nome = COALESCE(${nome ?? null}, nome),
        role = COALESCE(${role ?? null}, role),
        ativo = COALESCE(${ativo ?? null}, ativo),
        permite_escala_multipla = COALESCE(${permite_escala_multipla ?? null}, permite_escala_multipla),
        telefone = COALESCE(${telefone ?? null}, telefone)
      WHERE id = ${id}
      RETURNING *
    `;

    if (role) {
      try {
        await ensureAccountExists(id);
        await assignAccountRole(id, fromLegacyRole(role), null, user.userId);
        await syncLegacyPrimaryRole(id);
      } catch (e) {
        console.error('dual-write role failed:', e);
      }
    }

    return rows[0];
  }

  async deleteUser(user: RequestUser, id: string) {
    this.authz.requireAdmin(user);
    if (!id) throw new BadRequestException('id obrigatório');
    if (id === user.userId) {
      throw new BadRequestException('Você não pode deletar a si mesmo');
    }

    await sql`DELETE FROM users WHERE id = ${id}`;
    await sql`DELETE FROM accounts WHERE id = ${id}::uuid`.catch(() => {});
    return { ok: true };
  }

  async addUserMinisterio(
    user: RequestUser,
    body: {
      user_id: string;
      ministerio_id: string;
      is_lider?: boolean;
      pendente?: boolean;
    },
  ) {
    const { user_id, ministerio_id } = body;
    await this.authz.requireMinisterioAccess(user, ministerio_id);

    const hasLider = 'is_lider' in body;
    const hasPendente = 'pendente' in body;

    const rows = hasLider
      ? await sql`
          INSERT INTO ministerio_membros (user_id, ministerio_id, is_lider)
          VALUES (${user_id}, ${ministerio_id}, ${body.is_lider})
          ON CONFLICT (ministerio_id, user_id) DO UPDATE SET is_lider = ${body.is_lider}
          RETURNING *
        `
      : hasPendente
        ? await sql`
            UPDATE ministerio_membros SET pendente = ${body.pendente}
            WHERE user_id = ${user_id} AND ministerio_id = ${ministerio_id}
            RETURNING *
          `
        : await sql`
            INSERT INTO ministerio_membros (user_id, ministerio_id)
            VALUES (${user_id}, ${ministerio_id})
            ON CONFLICT (ministerio_id, user_id) DO NOTHING
            RETURNING *
          `;

    if (hasLider) {
      try {
        await syncMinistryLeaderRole(
          user_id,
          ministerio_id,
          !!body.is_lider,
          user.userId,
        );
      } catch (e) {
        console.error('syncMinistryLeaderRole:', e);
      }
    }

    if (hasPendente && body.pendente === false) {
      const min = await sql`SELECT nome FROM ministerios WHERE id = ${ministerio_id}`;
      await sql`
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
        VALUES (${user_id}, 'ministerio', 'Solicitação aceita!', ${`Você foi aceito no ministério ${min[0]?.nome}`}, '/minha-area/perfil')
      `;
    }

    return rows[0] ?? { user_id, ministerio_id };
  }

  async removeUserMinisterio(
    user: RequestUser,
    body: { user_id: string; ministerio_id: string },
  ) {
    const { user_id, ministerio_id } = body;
    await this.authz.requireMinisterioAccess(user, ministerio_id);

    try {
      const contextId = await getOrCreateMinistryContext(ministerio_id);
      if (contextId) {
        await removeAccountRole(user_id, 'lider', contextId);
        await removeAccountRole(user_id, 'membro', contextId);
      }
    } catch (e) {
      console.error('remove contextual roles:', e);
    }

    await sql`DELETE FROM ministerio_membros WHERE user_id = ${user_id} AND ministerio_id = ${ministerio_id}`;
    return { ok: true };
  }

  async getPublicProfile(id: string) {
    const user = await sql`
      SELECT id, nome, foto_url, bio, nascimento, data_batismo, criado_em, role
      FROM users WHERE id = ${id} AND ativo = true
    `;
    if (user.length === 0) throw new NotFoundException('Não encontrado');

    const ministerios = await sql`
      SELECT m.nome, m.icone, m.cor, mm.is_lider
      FROM ministerio_membros mm
      JOIN ministerios m ON m.id = mm.ministerio_id
      WHERE mm.user_id = ${id} AND m.ativo = true AND mm.pendente = false
      ORDER BY m.nome
    `;

    const gifts = await sql`SELECT results FROM user_gift_results WHERE user_id = ${id}`;

    const escalas = await sql`
      SELECT e.funcao, ev.titulo, ev.data, ev.horario, m.nome as ministerio, m.icone
      FROM escalas e
      JOIN eventos ev ON ev.id = e.evento_id
      JOIN ministerios m ON m.id = e.ministerio_id
      WHERE e.user_id = ${id} AND ev.data >= CURRENT_DATE
      ORDER BY ev.data ASC
      LIMIT 3
    `;

    const roles = await fetchAccountRoles(id);

    return {
      ...user[0],
      roles,
      ministerios,
      dons: gifts[0]?.results || null,
      proximas_escalas: escalas,
    };
  }
}
