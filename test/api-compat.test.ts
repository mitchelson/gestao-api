import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiCompatMiddleware } from '../src/common/middleware/api-compat.middleware';
import type { Request, Response } from 'express';

function apply(url: string): string {
  const req = { url } as Request;
  let called = false;
  apiCompatMiddleware(req, {} as Response, () => {
    called = true;
  });
  assert.equal(called, true);
  return req.url;
}

test('api compat rewrites /api to /v1', () => {
  assert.equal(apply('/api/users/me'), '/v1/users/me');
  assert.equal(apply('/api/escalas/minhas?x=1'), '/v1/escalas/minhas?x=1');
  assert.equal(apply('/api'), '/v1');
  assert.equal(apply('/api?foo=1'), '/v1?foo=1');
});

test('api compat leaves /v1 and /health alone', () => {
  assert.equal(apply('/v1/users/me'), '/v1/users/me');
  assert.equal(apply('/health'), '/health');
});
