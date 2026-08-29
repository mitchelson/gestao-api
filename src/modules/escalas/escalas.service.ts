import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { sendPushToUser } from '../../lib/push';
import { sql } from '../../lib/sql';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class EscalasService {
  constructor(private readonly authz: AuthorizationService) {}

  async list(query: {
    evento_id?: string;
    ministerio_id?: string;
    future?: string;
  }) {
    const { evento_id, ministerio_id, future } = query;

    if (evento_id) {
      const rows = await sql`
        SELECT e.*, u.nome as user_nome, u.foto_url, m.nome as ministerio_nome
        FROM escalas e
        JOIN users u ON u.id = e.user_id
        JOIN ministerios m ON m.id = e.ministerio_id
        WHERE e.evento_id = ${evento_id}
        ORDER BY m.nome, u.nome
      `;
      return rows;
    }

    if (ministerio_id) {
      if (future === 'false') {
        const rows = await sql`
          SELECT DISTINCT ON (e.user_id) e.user_id, ev.data
          FROM escalas e
          JOIN eventos ev ON ev.id = e.evento_id
          WHERE e.ministerio_id = ${ministerio_id} AND ev.data < CURRENT_DATE
          ORDER BY e.user_id, ev.data DESC
        `;
        return rows;
      }
      const rows = await sql`
        SELECT e.id, e.evento_id, e.user_id, e.funcao, u.nome as user_nome
        FROM escalas e
        JOIN users u ON u.id = e.user_id
        JOIN eventos ev ON ev.id = e.evento_id
        WHERE e.ministerio_id = ${ministerio_id} AND ev.data >= CURRENT_DATE
        ORDER BY ev.data, u.nome
      `;
      return rows;
    }

    const rows = await sql`
      SELECT e.*, u.nome as user_nome, u.foto_url, ev.titulo as evento_titulo, ev.data as evento_data, m.nome as ministerio_nome
      FROM escalas e
      JOIN users u ON u.id = e.user_id
      JOIN eventos ev ON ev.id = e.evento_id
      JOIN ministerios m ON m.id = e.ministerio_id
      ORDER BY ev.data DESC, m.nome
    `;
    return rows;
  }

  async create(
    user: RequestUser,
    body: {
      evento_id?: string;
      ministerio_id?: string;
      user_id?: string;
      funcao?: string;
    },
  ) {
    const { evento_id, ministerio_id, user_id, funcao } = body;
    if (!evento_id || !ministerio_id || !user_id) {
      throw new BadRequestException('evento_id, ministerio_id e user_id obrigatórios');
    }

    await this.authz.requireMinisterioAccess(user, ministerio_id);

    const evento = await sql`SELECT data FROM eventos WHERE id = ${evento_id}`;
    if (evento.length === 0) throw new NotFoundException('evento não encontrado');

    const indisponivel = await sql`
      SELECT id, motivo FROM user_indisponibilidades
      WHERE user_id = ${user_id} AND data_inicio <= ${evento[0].data} AND data_fim >= ${evento[0].data}
      LIMIT 1
    `;
    if (indisponivel.length > 0) {
      throw new ConflictException({
        error: 'Usuário indisponível',
        message: `Usuário marcou indisponibilidade para esta data${indisponivel[0].motivo ? `: ${indisponivel[0].motivo}` : '.'}`,
      });
    }

    const conflitos = await sql`
      SELECT e.id, m.nome as ministerio_nome, e.funcao
      FROM escalas e
      JOIN eventos ev ON ev.id = e.evento_id
      JOIN ministerios m ON m.id = e.ministerio_id
      WHERE e.user_id = ${user_id}
        AND ev.data = ${evento[0].data}
        AND e.ministerio_id != ${ministerio_id}
    `;

    const userRow =
      await sql`SELECT permite_escala_multipla FROM users WHERE id = ${user_id}`;
    if (userRow.length === 0) throw new NotFoundException('usuário não encontrado');

    if (conflitos.length > 0 && !userRow[0].permite_escala_multipla) {
      throw new ConflictException({
        error: 'Conflito de escala',
        conflitos: conflitos.map((c: any) => ({
          ministerio: c.ministerio_nome,
          funcao: c.funcao,
        })),
        message: `Usuário já escalado em: ${conflitos.map((c: any) => c.ministerio_nome).join(', ')}. Ative 'permite escala múltipla' no perfil para continuar.`,
      });
    }

    const rows = await sql`
      INSERT INTO escalas (evento_id, ministerio_id, user_id, funcao)
      VALUES (${evento_id}, ${ministerio_id}, ${user_id}, ${funcao ?? null})
      ON CONFLICT (evento_id, user_id, ministerio_id) DO NOTHING
      RETURNING *
    `;

    const warning =
      conflitos.length > 0
        ? `Atenção: usuário também escalado em ${conflitos.map((c: any) => c.ministerio_nome).join(', ')}`
        : undefined;

    if (rows.length > 0) {
      const min = await sql`SELECT nome FROM ministerios WHERE id = ${ministerio_id}`;
      const ev = await sql`SELECT titulo, data FROM eventos WHERE id = ${evento_id}`;
      const dataFormatada = new Date(ev[0].data).toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
      });

      await sql`
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
        VALUES (${user_id}, 'escala', 'Você foi escalado!', ${`${min[0]?.nome} — ${ev[0]?.titulo} (${dataFormatada})`}, '/minha-area')
      `;

      sendPushToUser(user_id, {
        title: 'Você foi escalado!',
        body: `${min[0]?.nome} — ${ev[0]?.titulo} (${dataFormatada})`,
        url: '/minha-area',
      }).catch((err) => console.error('Push error:', err));
    }

    return { ...rows[0], warning };
  }

  async update(
    user: RequestUser,
    id: string,
    body: { status?: string; funcao?: string },
  ) {
    const escala =
      await sql`SELECT ministerio_id, user_id FROM escalas WHERE id = ${id}`;
    if (escala.length === 0) throw new NotFoundException('não encontrado');

    const isOwner = escala[0].user_id === user.userId;
    if (!isOwner) {
      await this.authz.requireMinisterioAccess(user, escala[0].ministerio_id);
    }

    const { status, funcao } = body;

    if (isOwner && user.role === 'membro') {
      const rows =
        await sql`UPDATE escalas SET status = ${status} WHERE id = ${id} RETURNING *`;
      return rows[0];
    }

    const rows = await sql`
      UPDATE escalas SET
        status = COALESCE(${status}, status),
        funcao = COALESCE(${funcao}, funcao)
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  }

  async delete(user: RequestUser, id: string) {
    const escala = await sql`SELECT ministerio_id FROM escalas WHERE id = ${id}`;
    if (escala.length === 0) throw new NotFoundException('não encontrado');

    await this.authz.requireMinisterioAccess(user, escala[0].ministerio_id);

    await sql`DELETE FROM escalas WHERE id = ${id}`;
    return { ok: true };
  }

  async listMinhas(userId: string) {
    const eventos = await sql`
      SELECT e.id, e.titulo, e.data, e.horario, e.observacoes,
             CASE WHEN es.user_id IS NOT NULL THEN true ELSE false END as is_escalado,
             es.id as escala_id, es.funcao as minha_funcao, es.status as meu_status,
             es.observacao as minha_observacao, es.ministerio_id as ministerio_id,
             m.nome as ministerio, m.icone, m.cor,
             (SELECT count(*)::int FROM escalas WHERE evento_id = e.id) as total_escalados
      FROM eventos e
      LEFT JOIN escalas es ON es.evento_id = e.id AND es.user_id = ${userId}
      LEFT JOIN ministerios m ON m.id = es.ministerio_id
      WHERE e.data >= CURRENT_DATE
      ORDER BY e.data ASC
      LIMIT 20
    `;
    return eventos;
  }

  async listTrocas(userId: string) {
    const rows = await sql`
      SELECT t.*,
        sol.nome as solicitante_nome, sol.foto_url as solicitante_foto,
        dest.nome as destinatario_nome, dest.foto_url as destinatario_foto,
        ev_sol.titulo as evento_solicitante, ev_sol.data as data_solicitante, ev_sol.horario as horario_solicitante,
        ev_dest.titulo as evento_destinatario, ev_dest.data as data_destinatario, ev_dest.horario as horario_destinatario,
        m.nome as ministerio, m.icone as ministerio_icone,
        es.funcao as funcao_solicitante, ed.funcao as funcao_destinatario
      FROM escala_trocas t
      JOIN users sol ON sol.id = t.solicitante_id
      JOIN users dest ON dest.id = t.destinatario_id
      JOIN escalas es ON es.id = t.escala_solicitante_id
      JOIN escalas ed ON ed.id = t.escala_destinatario_id
      JOIN eventos ev_sol ON ev_sol.id = es.evento_id
      JOIN eventos ev_dest ON ev_dest.id = ed.evento_id
      JOIN ministerios m ON m.id = es.ministerio_id
      WHERE (t.solicitante_id = ${userId} OR t.destinatario_id = ${userId})
        AND t.status = 'pendente'
      ORDER BY t.criado_em DESC
    `;
    return rows;
  }

  async createTroca(
    userId: string,
    body: { escala_solicitante_id?: string; escala_destinatario_id?: string },
  ) {
    const { escala_solicitante_id, escala_destinatario_id } = body;
    if (!escala_solicitante_id || !escala_destinatario_id) {
      throw new BadRequestException('IDs das escalas obrigatórios');
    }

    const minha = await sql`
      SELECT * FROM escalas WHERE id = ${escala_solicitante_id} AND user_id = ${userId}
    `;
    if (minha.length === 0) {
      throw new ForbiddenException('Escala não pertence a você');
    }

    const outra = await sql`SELECT * FROM escalas WHERE id = ${escala_destinatario_id}`;
    if (outra.length === 0) {
      throw new NotFoundException('Escala destino não encontrada');
    }
    if (outra[0].ministerio_id !== minha[0].ministerio_id) {
      throw new BadRequestException('Escalas devem ser do mesmo ministério');
    }

    const eventos = await sql`
      SELECT id, data FROM eventos WHERE id IN (${minha[0].evento_id}, ${outra[0].evento_id}) AND data >= CURRENT_DATE
    `;
    if (eventos.length < 2) {
      throw new BadRequestException('Ambos eventos devem ser futuros');
    }

    const rows = await sql`
      INSERT INTO escala_trocas (solicitante_id, escala_solicitante_id, destinatario_id, escala_destinatario_id)
      VALUES (${userId}, ${escala_solicitante_id}, ${outra[0].user_id}, ${escala_destinatario_id})
      RETURNING *
    `;

    const solUser = await sql`SELECT nome FROM users WHERE id = ${userId} LIMIT 1`;
    const solNome = solUser[0]?.nome || 'Alguém';

    await sql`
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
      VALUES (${outra[0].user_id}, 'troca_escala', ${'Solicitação de troca'}, ${`${solNome} quer trocar de escala com você`}, '/minha-area')
    `;
    sendPushToUser(outra[0].user_id, {
      title: 'Solicitação de troca',
      body: `${solNome} quer trocar de escala com você`,
      url: '/minha-area',
    }).catch(() => {});

    return rows[0];
  }

  async updateTroca(userId: string, id: string, status: string) {
    if (!['aceita', 'recusada'].includes(status)) {
      throw new BadRequestException('Status inválido');
    }

    const troca =
      await sql`SELECT * FROM escala_trocas WHERE id = ${id} AND status = 'pendente'`;
    if (troca.length === 0) {
      throw new NotFoundException('Troca não encontrada ou já processada');
    }

    const t = troca[0];

    if (t.destinatario_id !== userId) {
      throw new ForbiddenException('Sem permissão');
    }

    if (status === 'recusada') {
      await sql`UPDATE escala_trocas SET status = 'recusada' WHERE id = ${id}`;
      await sql`
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
        VALUES (${t.solicitante_id}, 'troca_escala', ${'Troca recusada'}, ${'Sua solicitação de troca foi recusada'}, '/minha-area')
      `;
      sendPushToUser(t.solicitante_id, {
        title: 'Troca recusada',
        body: 'Sua solicitação de troca foi recusada',
        url: '/minha-area',
      }).catch(() => {});
      return { ok: true, status: 'recusada' };
    }

    const escSol =
      await sql`SELECT * FROM escalas WHERE id = ${t.escala_solicitante_id}`;
    const escDest =
      await sql`SELECT * FROM escalas WHERE id = ${t.escala_destinatario_id}`;
    const evSol =
      await sql`SELECT data FROM eventos WHERE id = ${escSol[0].evento_id}`;
    const evDest =
      await sql`SELECT data FROM eventos WHERE id = ${escDest[0].evento_id}`;

    const indispDest = await sql`
      SELECT 1 FROM user_indisponibilidades
      WHERE user_id = ${t.destinatario_id} AND data_inicio <= ${evSol[0].data} AND data_fim >= ${evSol[0].data}
    `;
    if (indispDest.length > 0) {
      throw new ConflictException(
        'Você está indisponível na data da escala que receberia',
      );
    }

    const indispSol = await sql`
      SELECT 1 FROM user_indisponibilidades
      WHERE user_id = ${t.solicitante_id} AND data_inicio <= ${evDest[0].data} AND data_fim >= ${evDest[0].data}
    `;
    if (indispSol.length > 0) {
      throw new ConflictException(
        'O solicitante está indisponível na data que receberia',
      );
    }

    await sql`UPDATE escalas SET user_id = ${t.destinatario_id} WHERE id = ${t.escala_solicitante_id}`;
    await sql`UPDATE escalas SET user_id = ${t.solicitante_id} WHERE id = ${t.escala_destinatario_id}`;
    await sql`UPDATE escala_trocas SET status = 'aceita' WHERE id = ${id}`;

    await sql`
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
      VALUES (${t.solicitante_id}, 'troca_escala', ${'Troca aceita!'}, ${'Sua troca de escala foi aceita'}, '/minha-area')
    `;
    sendPushToUser(t.solicitante_id, {
      title: 'Troca aceita!',
      body: 'Sua troca de escala foi aceita',
      url: '/minha-area',
    }).catch(() => {});

    return { ok: true, status: 'aceita' };
  }

  async notify(
    user: RequestUser,
    body: { evento_id?: string; ministerio_id?: string },
  ) {
    this.authz.requireLiderOrAdmin(user);

    const { evento_id, ministerio_id } = body;
    if (!evento_id || !ministerio_id) {
      throw new BadRequestException('evento_id e ministerio_id obrigatórios');
    }

    const evento = await sql`SELECT titulo, data FROM eventos WHERE id = ${evento_id}`;
    if (!evento.length) throw new NotFoundException('Evento não encontrado');

    const dataFormatada = new Date(evento[0].data).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });

    const escalados = await sql`
      SELECT DISTINCT e.user_id FROM escalas e
      WHERE e.evento_id = ${evento_id} AND e.ministerio_id = ${ministerio_id}
    `;

    let sent = 0;
    await Promise.allSettled(
      escalados.map(async (e: any) => {
        const count = await sendPushToUser(e.user_id, {
          title: 'Lembrete de Escala',
          body: `Lembre-se que você está escalado para ${evento[0].titulo} dia ${dataFormatada}`,
          url: '/minha-area',
        });
        sent += count;
      }),
    );

    return { sent, total: escalados.length };
  }
}
