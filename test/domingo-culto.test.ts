import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cadastroNaSemanaCulto,
  domingoAncoraYmd,
  filtrarPendenciasSemanaCulto,
  formatarDomingoCulto,
  inicioDoDiaPibrr,
  janelaSemanaCultoAtual,
} from '../src/lib/domingo-culto';

test('domingoAncoraYmd: domingo permanece; seg–sáb volta ao domingo anterior', () => {
  // 2026-09-06 = domingo em Boa Vista
  assert.equal(domingoAncoraYmd(new Date('2026-09-06T12:00:00-04:00')), '2026-09-06');
  // segunda
  assert.equal(domingoAncoraYmd(new Date('2026-09-07T08:00:00-04:00')), '2026-09-06');
  // sábado
  assert.equal(domingoAncoraYmd(new Date('2026-09-12T23:30:00-04:00')), '2026-09-06');
});

test('janelaSemanaCultoAtual: [domingo 00:00, próximo domingo 00:00)', () => {
  const janela = janelaSemanaCultoAtual(new Date('2026-09-08T15:00:00-04:00'));
  assert.equal(janela.domingoYmd, '2026-09-06');
  assert.equal(janela.inicio.toISOString(), inicioDoDiaPibrr('2026-09-06').toISOString());
  assert.equal(janela.fim.toISOString(), inicioDoDiaPibrr('2026-09-13').toISOString());
});

test('cadastroNaSemanaCulto respeita limites half-open', () => {
  const janela = janelaSemanaCultoAtual(new Date('2026-09-08T12:00:00-04:00'));
  assert.equal(cadastroNaSemanaCulto('2026-09-06T00:00:00-04:00', janela), true);
  assert.equal(cadastroNaSemanaCulto('2026-09-12T23:59:59-04:00', janela), true);
  assert.equal(cadastroNaSemanaCulto('2026-09-13T00:00:00-04:00', janela), false);
  assert.equal(cadastroNaSemanaCulto('2026-09-05T23:59:59-04:00', janela), false);
});

test('filtrarPendenciasSemanaCulto + formatarDomingoCulto', () => {
  const agora = new Date('2026-09-08T12:00:00-04:00');
  const { items, domingoYmd, domingoLabel } = filtrarPendenciasSemanaCulto(
    [
      { id: 'in', data_cadastro: '2026-09-07T10:00:00-04:00' },
      { id: 'out', data_cadastro: '2026-08-30T10:00:00-04:00' },
    ],
    agora,
  );
  assert.equal(items.length, 1);
  assert.equal((items[0] as { id: string }).id, 'in');
  assert.equal(domingoYmd, '2026-09-06');
  assert.equal(domingoLabel, formatarDomingoCulto('2026-09-06'));
  assert.equal(domingoLabel, '06/09/2026');
});
