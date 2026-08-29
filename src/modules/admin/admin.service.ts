import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class AdminService {
  async getDashboard() {
    const rows = await sql`
      SELECT count(*)::int AS total
      FROM users
      WHERE coalesce(ativo, true) = true
    `;
    return {
      totalMembros: rows[0]?.total ?? 0,
    };
  }
}
