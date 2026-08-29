import { Injectable } from '@nestjs/common';
import { sql } from '../../lib/sql.js';

@Injectable()
export class FormMinisteriosService {
  private async ensureTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS ministerio_form_respostas (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        ministerios JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      DO $$ BEGIN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ministerio_form_respostas' AND column_name = 'user_id') = 'text' THEN
          ALTER TABLE ministerio_form_respostas DROP CONSTRAINT IF EXISTS ministerio_form_respostas_pkey;
          ALTER TABLE ministerio_form_respostas ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
          ALTER TABLE ministerio_form_respostas ADD PRIMARY KEY (user_id);
          ALTER TABLE ministerio_form_respostas ADD CONSTRAINT ministerio_form_respostas_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;
  }

  async getForUser(userId: string) {
    await this.ensureTable();
    const rows = await sql`SELECT ministerios FROM ministerio_form_respostas WHERE user_id = ${userId}::uuid`;
    const raw = rows[0]?.ministerios ?? null;
    const ministerios = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { ministerios };
  }

  async saveForUser(userId: string, ministerios: unknown[]) {
    await this.ensureTable();
    await sql`
      INSERT INTO ministerio_form_respostas (user_id, ministerios, updated_at)
      VALUES (${userId}::uuid, ${JSON.stringify(ministerios)}, now())
      ON CONFLICT (user_id) DO UPDATE SET ministerios = ${JSON.stringify(ministerios)}, updated_at = now()
    `;
    return { ok: true };
  }

  async listAllAdmin() {
    await this.ensureTable();
    await sql`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS form_obrigatorio BOOLEAN DEFAULT false`;

    const rows = await sql`
      SELECT mfr.user_id, mfr.ministerios, mfr.updated_at, u.nome, u.foto_url
      FROM ministerio_form_respostas mfr
      JOIN users u ON u.id = mfr.user_id
      ORDER BY mfr.updated_at DESC
    `;

    return rows.map((r) => ({
      ...r,
      ministerios:
        typeof r.ministerios === 'string' ? JSON.parse(r.ministerios as string) : r.ministerios,
    }));
  }
}
