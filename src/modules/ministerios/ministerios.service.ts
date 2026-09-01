import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { sql } from '../../lib/sql';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class MinisteriosService {
  constructor(private readonly authz: AuthorizationService) {}

  async list() {
    const rows = await sql`
      SELECT m.*,
        (SELECT count(*)::int FROM ministerio_membros mm WHERE mm.ministerio_id = m.id) as total_membros
      FROM ministerios m ORDER BY m.ordem ASC, m.nome ASC
    `;
    return rows;
  }

  async create(
    user: RequestUser,
    body: {
      nome?: string;
      descricao?: string;
      cor?: string;
      icone?: string;
      ordem?: number;
    },
  ) {
    this.authz.requireAdmin(user);

    const { nome, descricao, cor, icone, ordem } = body;
    if (!nome) throw new BadRequestException('nome obrigatório');

    try {
      const rows = await sql`
        INSERT INTO ministerios (nome, descricao, cor, icone, ordem)
        VALUES (${nome}, ${descricao ?? null}, ${cor ?? '#c9a84c'}, ${icone ?? 'Church'}, ${ordem ?? 0})
        RETURNING *
      `;
      return rows[0];
    } catch (error) {
      console.error('Error creating ministry:', error);
      throw new InternalServerErrorException('Erro ao criar ministério');
    }
  }

  async getById(id: string) {
    const rows = await sql`
      SELECT m.*,
        COALESCE(json_agg(json_build_object('user_id', u.id, 'nome', u.nome, 'email', u.email, 'foto_url', u.foto_url, 'is_lider', mm.is_lider, 'role', u.role, 'pendente', mm.pendente))
          FILTER (WHERE u.id IS NOT NULL), '[]') as membros
      FROM ministerios m
      LEFT JOIN ministerio_membros mm ON mm.ministerio_id = m.id
      LEFT JOIN users u ON u.id = mm.user_id
      WHERE m.id = ${id}
      GROUP BY m.id
    `;
    if (rows.length === 0) throw new NotFoundException('não encontrado');
    return rows[0];
  }

  async update(
    user: RequestUser,
    id: string,
    body: {
      nome?: string;
      descricao?: string;
      cor?: string;
      icone?: string;
      ativo?: boolean;
      ordem?: number;
      form_obrigatorio?: boolean;
    },
  ) {
    await this.authz.requireMinisterioAccess(user, id);

    const { nome, descricao, cor, icone, ativo, ordem, form_obrigatorio } = body;

    await sql`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS form_obrigatorio BOOLEAN DEFAULT false`;

    const rows = await sql`
      UPDATE ministerios SET
        nome = COALESCE(${nome ?? null}, nome),
        descricao = COALESCE(${descricao ?? null}, descricao),
        cor = COALESCE(${cor ?? null}, cor),
        icone = COALESCE(${icone ?? null}, icone),
        ativo = COALESCE(${ativo ?? null}, ativo),
        ordem = COALESCE(${ordem ?? null}, ordem),
        form_obrigatorio = COALESCE(${form_obrigatorio ?? null}, form_obrigatorio)
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  }

  async delete(user: RequestUser, id: string) {
    this.authz.requireAdmin(user);
    await sql`DELETE FROM ministerios WHERE id = ${id}`;
    return { ok: true };
  }

  async listFuncoes(id: string) {
    const rows =
      await sql`SELECT * FROM ministerio_funcoes WHERE ministerio_id = ${id} ORDER BY nome ASC`;
    return rows;
  }

  async createFuncao(user: RequestUser, id: string, nome: string) {
    await this.authz.requireMinisterioAccess(user, id);
    if (!nome) throw new BadRequestException('nome obrigatório');

    const rows = await sql`
      INSERT INTO ministerio_funcoes (ministerio_id, nome)
      VALUES (${id}, ${nome})
      ON CONFLICT (ministerio_id, nome) DO NOTHING
      RETURNING *
    `;
    if (rows.length === 0) {
      throw new ConflictException('função já existe');
    }
    return rows[0];
  }

  async deleteFuncao(user: RequestUser, id: string, funcao_id: string) {
    await this.authz.requireMinisterioAccess(user, id);
    if (!funcao_id) throw new BadRequestException('funcao_id obrigatório');

    await sql`DELETE FROM ministerio_funcoes WHERE id = ${funcao_id} AND ministerio_id = ${id}`;
    return { ok: true };
  }
}
