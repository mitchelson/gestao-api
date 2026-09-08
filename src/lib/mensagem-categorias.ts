/** Postgres pode devolver boolean, "t"/"f", 0/1 ou "true"/"false". */
export function coerceAtiva(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 't' ||
    value === 'true' ||
    value === 'TRUE'
  );
}

/** Normaliza body.ativa para boolean explícito (ou undefined se ausente). */
export function parseAtivaInput(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === false || value === 0 || value === '0' || value === 'f' || value === 'false' || value === 'FALSE') {
    return false;
  }
  if (coerceAtiva(value)) return true;
  return Boolean(value);
}

export function normalizeModelo(raw: Record<string, unknown>, categoriaId?: string) {
  return {
    id: String(raw.id ?? ''),
    categoria_id: String(raw.categoria_id ?? categoriaId ?? ''),
    titulo: String(raw.titulo ?? ''),
    // legado: conteudo → corpo
    corpo: String(raw.corpo ?? raw.conteudo ?? ''),
    ordem: Number(raw.ordem ?? 0),
  };
}

export function normalizeCategoria(raw: Record<string, unknown>) {
  const id = String(raw.id ?? '');
  const modelosRaw = Array.isArray(raw.modelos) ? raw.modelos : [];
  return {
    ...raw,
    id,
    nome: String(raw.nome ?? ''),
    dia: raw.dia != null ? String(raw.dia) : raw.dia,
    descricao: raw.descricao == null ? null : String(raw.descricao),
    ordem: Number(raw.ordem ?? 0),
    ativa: coerceAtiva(raw.ativa),
    modelos: modelosRaw.map((m) =>
      normalizeModelo(
        (m && typeof m === 'object' ? m : {}) as Record<string, unknown>,
        id,
      ),
    ),
  };
}
