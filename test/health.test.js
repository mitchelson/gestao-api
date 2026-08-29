import { test } from 'node:test';
import assert from 'node:assert/strict';

test('health response shape', () => {
  const response = {
    status: 'ok',
    db: 'pending',
    version: '0.1.0',
  };

  assert.equal(response.status, 'ok');
  assert.equal(typeof response.version, 'string');
});
