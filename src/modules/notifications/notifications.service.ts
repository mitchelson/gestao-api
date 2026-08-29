import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class NotificationsService {
  async getForUser(userId: string, countOnly: boolean) {
    if (countOnly) {
      const unread = await sql`
        SELECT count(*)::int as total FROM notifications
        WHERE user_id = ${userId} AND lida = false
      `;
      return { count: unread[0].total };
    }

    const rows = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY criado_em DESC
      LIMIT 50
    `;
    const unread = await sql`
      SELECT count(*)::int as total FROM notifications
      WHERE user_id = ${userId} AND lida = false
    `;
    return { notifications: rows, unread: unread[0].total };
  }

  async markRead(userId: string, id?: string, all?: boolean) {
    if (all) {
      await sql`UPDATE notifications SET lida = true WHERE user_id = ${userId} AND lida = false`;
    } else if (id) {
      await sql`UPDATE notifications SET lida = true WHERE id = ${id} AND user_id = ${userId}`;
    }
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await sql`UPDATE notifications SET lida = true WHERE user_id = ${userId} AND lida = false`;
    return { ok: true };
  }
}
