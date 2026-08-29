import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';

test('health response shape', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
  }).compile();

  const controller = moduleRef.get(HealthController);
  const response = controller.getHealth();

  assert.equal(response.status, 'ok');
  assert.equal(typeof response.version, 'string');
});
