import { Injectable } from '@nestjs/common';
import { calculateResults } from '../../lib/dons-espirituais.js';
import { sql } from '../../lib/sql.js';

@Injectable()
export class DonsEspirituaisService {
  async getResults(userId: string) {
    const rows = await sql`SELECT results FROM user_gift_results WHERE user_id = ${userId}`;
    return { results: rows[0]?.results ?? null };
  }

  async saveResults(userId: string, answers: number[]) {
    const results = calculateResults(answers);
    await sql`
      INSERT INTO user_gift_results (user_id, results, created_at)
      VALUES (${userId}, ${JSON.stringify(results)}, now())
      ON CONFLICT (user_id) DO UPDATE SET results = ${JSON.stringify(results)}, created_at = now()
    `;
    return { results };
  }

  async listAllAdmin() {
    return sql`
      SELECT ugr.user_id, ugr.results, ugr.created_at, u.nome, u.foto_url
      FROM user_gift_results ugr
      JOIN users u ON u.id = ugr.user_id
      ORDER BY ugr.created_at DESC
    `;
  }
}
