import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { sql } from '../../lib/sql';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class EventosService {
  constructor(private readonly authz: AuthorizationService) {}

  async list() {
    const rows = await sql`SELECT * FROM eventos ORDER BY data DESC`;
    return rows;
  }

  async create(
    user: RequestUser,
    body: {
      titulo?: string;
      data?: string;
      horario?: string;
      descricao?: string;
      tipo?: string;
      modelo_id?: string;
      observacoes?: string;
      repertorio_ministerio_id?: string;
      repertorio_funcao?: string;
    },
  ) {
    this.authz.requireAdmin(user);

    const {
      titulo,
      data,
      horario,
      descricao,
      tipo,
      modelo_id,
      observacoes,
      repertorio_ministerio_id,
      repertorio_funcao,
    } = body;

    if (!titulo || !data) {
      throw new BadRequestException('titulo e data obrigatórios');
    }

    const safeModeloId = modelo_id || null;

    try {
      const rows = await sql`
        INSERT INTO eventos (titulo, data, horario, descricao, tipo, modelo_id, observacoes, repertorio_ministerio_id, repertorio_funcao)
        VALUES (${titulo}, ${data}, ${horario ?? null}, ${descricao ?? null}, ${tipo ?? 'Culto'}, ${safeModeloId}, ${observacoes ?? null}, ${repertorio_ministerio_id ?? null}, ${repertorio_funcao ?? null})
        RETURNING *
      `;
      const evento = rows[0];

      if (safeModeloId) {
        await sql`
          INSERT INTO evento_posicoes (evento_id, ministerio_id, funcao, quantidade)
          SELECT ${evento.id}, ministerio_id, funcao, quantidade
          FROM evento_posicoes WHERE modelo_id = ${safeModeloId}
        `;
      }

      return evento;
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Erro ao criar evento:', error);

      if (err.message?.includes('modelo_id')) {
        try {
          const rows = await sql`
            INSERT INTO eventos (titulo, data, horario, descricao, tipo)
            VALUES (${titulo}, ${data}, ${horario ?? null}, ${descricao ?? null}, ${tipo ?? 'Culto'})
            RETURNING *
          `;
          return rows[0];
        } catch (fallbackError: unknown) {
          const fb = fallbackError as { message?: string };
          console.error('Erro no fallback:', fallbackError);
          throw new InternalServerErrorException(
            fb.message || 'Erro ao criar evento',
          );
        }
      }

      throw new InternalServerErrorException(err.message || 'Erro ao criar evento');
    }
  }

  async update(
    user: RequestUser,
    id: string,
    body: {
      titulo?: string;
      data?: string;
      horario?: string;
      descricao?: string;
      tipo?: string;
      observacoes?: string;
      repertorio_ministerio_id?: string | null;
      repertorio_funcao?: string | null;
    },
  ) {
    this.authz.requireAdmin(user);

    // postgres.js rejeita `undefined` em parâmetros (UNDEFINED_VALUE)
    const titulo = body.titulo ?? null;
    const data = body.data ?? null;
    const horario = body.horario ?? null;
    const descricao = body.descricao ?? null;
    const tipo = body.tipo ?? null;
    const observacoes = body.observacoes ?? null;
    const repertorio_ministerio_id = body.repertorio_ministerio_id || null;
    const repertorio_funcao = body.repertorio_funcao || null;

    const rows = await sql`
      UPDATE eventos SET
        titulo = COALESCE(${titulo}, titulo),
        data = COALESCE(${data}, data),
        horario = COALESCE(${horario}, horario),
        descricao = COALESCE(${descricao}, descricao),
        tipo = COALESCE(${tipo}, tipo),
        observacoes = COALESCE(${observacoes}, observacoes),
        repertorio_ministerio_id = ${repertorio_ministerio_id},
        repertorio_funcao = ${repertorio_funcao}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  }

  async delete(user: RequestUser, id: string) {
    this.authz.requireAdmin(user);
    await sql`DELETE FROM eventos WHERE id = ${id}`;
    return { ok: true };
  }

  async listPosicoes(eventoId: string) {
    const rows = await sql`
      SELECT ep.*, m.nome as ministerio_nome, m.icone as ministerio_icone
      FROM evento_posicoes ep
      JOIN ministerios m ON m.id = ep.ministerio_id
      WHERE ep.evento_id = ${eventoId}
      ORDER BY m.nome, ep.funcao
    `;
    return rows;
  }

  async createPosicao(
    user: RequestUser,
    eventoId: string,
    body: { ministerio_id?: string; funcao?: string; quantidade?: number },
  ) {
    this.authz.requireLiderOrAdmin(user);
    const { ministerio_id, funcao, quantidade } = body;
    if (!ministerio_id || !funcao) {
      throw new BadRequestException('ministerio_id e funcao obrigatórios');
    }
    await this.authz.requireMinisterioAccess(user, ministerio_id);

    const rows = await sql`
      INSERT INTO evento_posicoes (evento_id, ministerio_id, funcao, quantidade)
      VALUES (${eventoId}, ${ministerio_id}, ${funcao}, ${quantidade ?? 1})
      RETURNING *
    `;
    return rows[0];
  }

  async deletePosicao(user: RequestUser, eventoId: string, posicao_id?: string) {
    this.authz.requireLiderOrAdmin(user);
    if (posicao_id) {
      const rows = await sql`
        SELECT ministerio_id FROM evento_posicoes
        WHERE id = ${posicao_id} AND evento_id = ${eventoId}
      `;
      const ministerioId = rows[0]?.ministerio_id as string | undefined;
      if (ministerioId) {
        await this.authz.requireMinisterioAccess(user, ministerioId);
      }
      await sql`DELETE FROM evento_posicoes WHERE id = ${posicao_id} AND evento_id = ${eventoId}`;
    }
    return { ok: true };
  }

  async listModelos() {
    const rows = await sql`
      SELECT em.*, COALESCE(json_agg(json_build_object(
        'id', ep.id, 'ministerio_id', ep.ministerio_id, 'funcao', ep.funcao, 'quantidade', ep.quantidade,
        'ministerio_nome', m.nome, 'ministerio_icone', m.icone
      )) FILTER (WHERE ep.id IS NOT NULL), '[]') as posicoes
      FROM evento_modelos em
      LEFT JOIN evento_posicoes ep ON ep.modelo_id = em.id
      LEFT JOIN ministerios m ON m.id = ep.ministerio_id
      GROUP BY em.id ORDER BY em.nome
    `;
    return rows;
  }

  async createModelo(body: {
    nome?: string;
    tipo?: string;
    horario?: string;
    descricao?: string;
    posicoes?: Array<{
      ministerio_id: string;
      funcao: string;
      quantidade?: number;
    }>;
  }) {
    const { nome, tipo, horario, descricao, posicoes } = body;
    if (!nome) throw new BadRequestException('nome obrigatório');

    const rows = await sql`
      INSERT INTO evento_modelos (nome, tipo, horario, descricao)
      VALUES (${nome}, ${tipo ?? 'Culto'}, ${horario ?? null}, ${descricao ?? null})
      RETURNING *
    `;
    const modelo = rows[0];

    if (posicoes?.length) {
      for (const p of posicoes) {
        await sql`INSERT INTO evento_posicoes (modelo_id, ministerio_id, funcao, quantidade)
          VALUES (${modelo.id}, ${p.ministerio_id}, ${p.funcao}, ${p.quantidade ?? 1})`;
      }
    }

    return modelo;
  }

  async updateModelo(
    id: string,
    body: {
      nome?: string;
      tipo?: string;
      horario?: string;
      descricao?: string;
      posicoes?: Array<{
        ministerio_id: string;
        funcao: string;
        quantidade?: number;
      }>;
    },
  ) {
    const { nome, tipo, horario, descricao, posicoes } = body;
    const rows = await sql`
      UPDATE evento_modelos SET
        nome = COALESCE(${nome}, nome), tipo = COALESCE(${tipo}, tipo),
        horario = COALESCE(${horario}, horario), descricao = COALESCE(${descricao}, descricao)
      WHERE id = ${id} RETURNING *
    `;
    if (posicoes !== undefined) {
      await sql`DELETE FROM evento_posicoes WHERE modelo_id = ${id}`;
      for (const p of posicoes) {
        await sql`INSERT INTO evento_posicoes (modelo_id, ministerio_id, funcao, quantidade)
          VALUES (${id}, ${p.ministerio_id}, ${p.funcao}, ${p.quantidade ?? 1})`;
      }
    }
    return rows[0];
  }

  async deleteModelo(id: string) {
    await sql`DELETE FROM evento_modelos WHERE id = ${id}`;
    return { ok: true };
  }
}
