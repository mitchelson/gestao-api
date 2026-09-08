import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  coerceAtiva,
  normalizeCategoria,
  parseAtivaInput,
} from '../src/lib/mensagem-categorias';

test('coerceAtiva aceita boolean e formatos postgres', () => {
  assert.equal(coerceAtiva(true), true);
  assert.equal(coerceAtiva('t'), true);
  assert.equal(coerceAtiva('true'), true);
  assert.equal(coerceAtiva(1), true);
  assert.equal(coerceAtiva(false), false);
  assert.equal(coerceAtiva('f'), false);
  assert.equal(coerceAtiva(null), false);
});

test('parseAtivaInput distingue true/false/ausente', () => {
  assert.equal(parseAtivaInput(undefined), undefined);
  assert.equal(parseAtivaInput(true), true);
  assert.equal(parseAtivaInput(false), false);
  assert.equal(parseAtivaInput('false'), false);
  assert.equal(parseAtivaInput('true'), true);
});

test('normalizeCategoria força ativa boolean e modelos.corpo', () => {
  const cat = normalizeCategoria({
    id: 'c1',
    nome: 'Boas-vindas',
    dia: 'domingo',
    ordem: '2',
    ativa: 't',
    modelos: [
      { id: 'm1', titulo: 'Oi', conteudo: 'texto legado', ordem: 1 },
      { id: 'm2', categoria_id: 'c1', titulo: 'Oi2', corpo: 'corpo novo', ordem: 2 },
    ],
  });
  assert.equal(cat.ativa, true);
  assert.equal(cat.ordem, 2);
  assert.equal(cat.modelos[0].corpo, 'texto legado');
  assert.equal(cat.modelos[0].categoria_id, 'c1');
  assert.equal(cat.modelos[1].corpo, 'corpo novo');
});
