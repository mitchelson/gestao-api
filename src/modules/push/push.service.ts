import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class PushService {
  async subscribeWebPush(
    userId: string,
    endpoint: string,
    keys: { p256dh: string; auth: string },
  ) {
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${userId}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET p256dh = ${keys.p256dh}, auth = ${keys.auth}, user_id = ${userId}
    `;
    return { ok: true };
  }

  async unsubscribeWebPush(userId: string, endpoint: string) {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${userId}`;
    return { ok: true };
  }

  async registerExpoToken(userId: string, token: string) {
    await sql`
      INSERT INTO expo_push_tokens (user_id, token, criado_em)
      VALUES (${userId}, ${token}, now())
      ON CONFLICT (user_id, token) DO UPDATE SET criado_em = now()
    `;
    return { ok: true };
  }
}
