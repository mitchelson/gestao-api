import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from '../src/health/health.controller';
import type { DatabaseService } from '../src/database/database.service';

test('health response shape', async () => {
  const database = { ping: async () => true } as Pick<DatabaseService, 'ping'>;
  const controller = new HealthController(database as DatabaseService);
  const response = await controller.getHealth();

  assert.equal(response.status, 'ok');
  assert.equal(response.db, 'connected');
  assert.equal(typeof response.version, 'string');
});
