import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { createSqlTag, type SqlTag } from './sql-tag';
import { setGlobalSql } from '../lib/sql';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly sql: SqlTag;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('DATABASE_URL is not set — database queries will fail at runtime');
    }

    this.pool = new Pool({
      connectionString: connectionString ?? 'postgresql://noop:noop@localhost/noop',
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    this.sql = createSqlTag(this.pool);
    setGlobalSql(this.sql);
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
