import { Injectable, NotFoundException } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class VisitantesService {
  async findAll() {
    return sql`
      SELECT
        v.*,
        u.nome AS responsavel_nome
      FROM visitantes v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.data_cadastro DESC
    `;
  }

  async findOne(id: string) {
    const rows = await sql`
      SELECT
        v.*,
        u.nome AS responsavel_nome
      FROM visitantes v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ${id}
    `;
    if (rows.length === 0) {
      throw new NotFoundException('Visitante nao encontrado');
    }
    return rows[0];
  }

  async create(body: Record<string, unknown>) {
    const {
      nome,
      celular,
      sexo,
      cidade,
      cidade_outra,
      bairro,
      faixa_etaria,
      civil_status,
      membro_igreja,
      quer_visita,
      sem_whatsapp,
      responsavel_id,
    } = body;

    const rows = await sql`
      INSERT INTO visitantes (
        nome, celular, sexo, cidade, cidade_outra, bairro,
        faixa_etaria, civil_status, membro_igreja,
        quer_visita, sem_whatsapp, responsavel_id
      ) VALUES (
        ${nome as string}, ${celular as string}, ${(sexo as string) || null}, ${(cidade as string) || null},
        ${(cidade_outra as string) || null}, ${(bairro as string) || null}, ${(faixa_etaria as string) || null},
        ${(civil_status as string) || null},
        ${(membro_igreja as boolean) ?? false}, ${(quer_visita as boolean) ?? false},
        ${(sem_whatsapp as boolean) ?? false}, ${(responsavel_id as string) || null}
      )
      RETURNING *
    `;
    return rows[0];
  }

  async update(id: string, body: Record<string, unknown>) {
    const {
      nome,
      celular,
      sexo,
      cidade,
      cidade_outra,
      bairro,
      faixa_etaria,
      civil_status,
      membro_igreja,
      quer_visita,
      sem_whatsapp,
      responsavel_id,
    } = body;

    const rows = await sql`
      UPDATE visitantes SET
        nome = COALESCE(${nome ?? null}, nome),
        celular = COALESCE(${celular ?? null}, celular),
        sexo = ${sexo ?? null},
        cidade = ${cidade ?? null},
        cidade_outra = ${cidade_outra ?? null},
        bairro = ${bairro ?? null},
        faixa_etaria = ${faixa_etaria ?? null},
        civil_status = ${civil_status ?? null},
        membro_igreja = COALESCE(${membro_igreja ?? null}, membro_igreja),
        quer_visita = COALESCE(${quer_visita ?? null}, quer_visita),
        sem_whatsapp = COALESCE(${sem_whatsapp ?? null}, sem_whatsapp),
        user_id = ${responsavel_id ?? null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      throw new NotFoundException('Visitante nao encontrado');
    }
    return rows[0];
  }

  async remove(id: string) {
    const rows = await sql`
      DELETE FROM visitantes WHERE id = ${id} RETURNING id
    `;
    if (rows.length === 0) {
      throw new NotFoundException('Visitante nao encontrado');
    }
    return { success: true };
  }

  async mensagensStatus(): Promise<Record<string, string[]>> {
    const result = await sql`
      SELECT visitante_id, array_agg(DISTINCT categoria_id) as categoria_ids
      FROM visitante_mensagens_enviadas
      GROUP BY visitante_id
    `;

    const mapa: Record<string, string[]> = {};
    for (const row of result) {
      mapa[row.visitante_id as string] = (row.categoria_ids as string[]) || [];
    }
    return mapa;
  }
}
