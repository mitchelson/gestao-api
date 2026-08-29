import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapRowDates, toDateOnly } from '../src/lib/dates';

test('toDateOnly formats Date and ISO strings', () => {
  assert.equal(toDateOnly(new Date('2026-10-03T00:00:00.000Z')), '2026-10-03');
  assert.equal(toDateOnly('2026-10-03T00:00:00.000Z'), '2026-10-03');
  assert.equal(toDateOnly('2026-10-03'), '2026-10-03');
  assert.equal(toDateOnly(null), null);
});

test('mapRowDates normalizes listed keys', () => {
  const row = mapRowDates(
    {
      id: '1',
      data_inicio: new Date('2026-10-03T00:00:00.000Z'),
      data_fim: '2026-10-14T00:00:00.000Z',
    },
    ['data_inicio', 'data_fim'],
  );
  assert.equal(row.data_inicio, '2026-10-03');
  assert.equal(row.data_fim, '2026-10-14');
  assert.equal(row.id, '1');
});
