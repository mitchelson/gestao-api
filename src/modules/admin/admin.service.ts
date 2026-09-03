import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class AdminService {
  async getDashboard(user?: RequestUser) {
    const rows = await sql`
      SELECT count(*)::int AS total
      FROM users
      WHERE coalesce(ativo, true) = true
    `;

    const escalasPendentes = await sql`
      SELECT count(*)::int as total FROM escalas es
      INNER JOIN eventos e ON e.id = es.evento_id
      WHERE es.status = 'pendente' AND e.data >= CURRENT_DATE
    `;

    const escalasSemana = await sql`
      SELECT count(*)::int as total FROM escalas es
      INNER JOIN eventos e ON e.id = es.evento_id
      WHERE e.data >= CURRENT_DATE AND e.data < CURRENT_DATE + interval '7 days'
    `;

    let pedidosMinisterio = 0;
    try {
      const ped = await sql`
        SELECT count(*)::int as total FROM ministerio_membros
        WHERE pendente = true
      `;
      pedidosMinisterio = (ped[0]?.total as number) ?? 0;
    } catch {
      pedidosMinisterio = 0;
    }

    let acolhimentoId: string | null = null;
    try {
      const cfg = await sql`
        SELECT valor FROM app_config WHERE chave = 'acolhimento_ministerio_id' LIMIT 1
      `;
      acolhimentoId = (cfg[0]?.valor as string) || null;
    } catch {
      acolhimentoId = null;
    }

    const showWhatsapp =
      !user ||
      user.role === 'admin' ||
      (!!acolhimentoId && (user.ministerioIds || []).includes(acolhimentoId));

    let whatsappPendentes = 0;
    if (showWhatsapp) {
      try {
        const pend = await sql`
          SELECT count(*)::int as total FROM visitantes v
          WHERE v.sem_whatsapp IS NOT TRUE
            AND EXISTS (
              SELECT 1 FROM mensagem_categorias c WHERE c.ativa = true
              AND NOT EXISTS (
                SELECT 1 FROM visitante_mensagens_enviadas me
                WHERE me.visitante_id = v.id AND me.categoria_id = c.id
              )
            )
        `;
        whatsappPendentes = (pend[0]?.total as number) ?? 0;
      } catch {
        whatsappPendentes = 0;
      }
    }

    return {
      totalMembros: rows[0]?.total ?? 0,
      pendenciasEscalas: escalasPendentes[0]?.total ?? 0,
      escalasSemana: escalasSemana[0]?.total ?? 0,
      pedidosMinisterio,
      whatsappPendentes,
    };
  }
}
