/** Normaliza DATE/timestamptz do `pg` para `YYYY-MM-DD` (paridade com Neon/legado). */
export function toDateOnly(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

export function mapRowDates<T extends Record<string, unknown>>(
  row: T,
  keys: string[],
): T {
  const out = { ...row };
  for (const key of keys) {
    if (key in out) {
      (out as Record<string, unknown>)[key] = toDateOnly(out[key]);
    }
  }
  return out;
}
