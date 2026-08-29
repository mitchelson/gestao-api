import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class ConfigService {
  async getAll() {
    const rows = await sql`SELECT chave, valor FROM app_config`;
    return Object.fromEntries(rows.map((r) => [r.chave, r.valor]));
  }

  async set(chave: string, valor: string) {
    await sql`
      INSERT INTO app_config (chave, valor, atualizado_em)
      VALUES (${chave}, ${valor}, now())
      ON CONFLICT (chave) DO UPDATE SET valor = ${valor}, atualizado_em = now()
    `;
    return { ok: true };
  }
}
