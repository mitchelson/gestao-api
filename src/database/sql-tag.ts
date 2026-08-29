import type { Pool, QueryResultRow } from 'pg';

export type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<QueryResultRow[]>;

export function createSqlTag(pool: Pool): SqlTag {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = '';
    const params: unknown[] = [];

    strings.forEach((part, index) => {
      text += part;
      if (index < values.length) {
        params.push(values[index]);
        text += `$${params.length}`;
      }
    });

    const result = await pool.query(text, params);
    return result.rows;
  };
}
