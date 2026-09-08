/**
 * Âncora de acompanhamento WhatsApp no domingo do culto (fuso de Boa Vista / RR).
 *
 * Regra:
 * - Cadastro no domingo → aquele domingo
 * - Cadastro seg–sáb → domingo anterior
 * - Responsáveis da semana vêem só visitantes cuja data_cadastro cai na
 *   janela [domingo 00:00, próximo domingo 00:00)
 */

export const PIBRR_TZ = 'America/Boa_Vista';
/** Boa Vista / RR não tem horário de verão — offset fixo UTC−4 */
const PIBRR_OFFSET = '-04:00';

const DOW_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Data civil YYYY-MM-DD no fuso da igreja */
export function dataLocalPibrr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PIBRR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Dia da semana 0=domingo … 6=sábado no fuso da igreja */
export function dowLocalPibrr(date: Date = new Date()): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: PIBRR_TZ,
    weekday: 'short',
  }).format(date);
  return DOW_SHORT[short] ?? 0;
}

/**
 * Domingo âncora (YYYY-MM-DD) para uma data de cadastro / momento.
 * Domingo → o próprio dia; segunda–sábado → domingo anterior.
 */
export function domingoAncoraYmd(date: Date = new Date()): string {
  const ymd = dataLocalPibrr(date);
  const dow = dowLocalPibrr(date);
  const [y, m, d] = ymd.split('-').map(Number);
  // Meio-dia UTC evita trocar de dia ao subtrair
  const cursor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  cursor.setUTCDate(cursor.getUTCDate() - dow);
  return cursor.toISOString().slice(0, 10);
}

/** Início do dia civil (00:00) em America/Boa_Vista, como Instant UTC */
export function inicioDoDiaPibrr(ymd: string): Date {
  return new Date(`${ymd}T00:00:00${PIBRR_OFFSET}`);
}

export type JanelaSemanaCulto = {
  /** YYYY-MM-DD do domingo do culto desta semana de acompanhamento */
  domingoYmd: string;
  /** Inclusive — domingo 00:00 Boa Vista */
  inicio: Date;
  /** Exclusive — próximo domingo 00:00 Boa Vista */
  fim: Date;
};

/** Janela da semana do culto atual (= domingo mais recente, incluindo hoje se domingo) */
export function janelaSemanaCultoAtual(agora: Date = new Date()): JanelaSemanaCulto {
  const domingoYmd = domingoAncoraYmd(agora);
  const inicio = inicioDoDiaPibrr(domingoYmd);
  const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { domingoYmd, inicio, fim };
}

/** Formata o domingo do culto para UI (ex.: 06/09/2026) */
export function formatarDomingoCulto(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

/** Visitante pertence à janela da semana do culto? */
export function cadastroNaSemanaCulto(
  dataCadastro: string | Date | null | undefined,
  janela: JanelaSemanaCulto = janelaSemanaCultoAtual(),
): boolean {
  if (!dataCadastro) return false;
  const t = new Date(dataCadastro).getTime();
  if (Number.isNaN(t)) return false;
  return t >= janela.inicio.getTime() && t < janela.fim.getTime();
}

/** Filtra lista de pendências WhatsApp pela semana do culto atual. */
export function filtrarPendenciasSemanaCulto<
  T extends { data_cadastro?: string | Date | null },
>(
  lista: T[],
  agora: Date = new Date(),
): { items: T[]; domingoYmd: string; domingoLabel: string } {
  const janela = janelaSemanaCultoAtual(agora);
  return {
    items: lista.filter((v) => cadastroNaSemanaCulto(v.data_cadastro, janela)),
    domingoYmd: janela.domingoYmd,
    domingoLabel: formatarDomingoCulto(janela.domingoYmd),
  };
}
