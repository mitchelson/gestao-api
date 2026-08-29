import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFiles } from '../src/lib/load-env';

test('loadEnvFiles overrides empty process.env from file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gestao-env-'));
  const prev = process.env.GOOGLE_CLIENT_IDS;
  try {
    process.env.GOOGLE_CLIENT_IDS = '';
    writeFileSync(
      join(dir, '.env.production'),
      'GOOGLE_CLIENT_IDS=abc.apps.googleusercontent.com\n',
    );
    loadEnvFiles(dir);
    assert.equal(process.env.GOOGLE_CLIENT_IDS, 'abc.apps.googleusercontent.com');
  } finally {
    if (prev === undefined) delete process.env.GOOGLE_CLIENT_IDS;
    else process.env.GOOGLE_CLIENT_IDS = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
