import type { QueryResultRow } from 'pg';
import type { SqlTag } from '../database/sql-tag';

let globalSql: SqlTag | null = null;

export function setGlobalSql(sql: SqlTag) {
  globalSql = sql;
}

export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<QueryResultRow[]> {
  if (!globalSql) {
    throw new Error('Database not initialized');
  }
  return globalSql(strings, ...values);
}
