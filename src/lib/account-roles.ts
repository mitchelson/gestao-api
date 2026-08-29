import { sql } from "./sql.js"

export type AccountRoleRow = {
  role_id: string
  role_name: string
  role_display_name: string
  context_id: string | null
  context_type: string | null
  context_name: string | null
  assigned_at: string
  expires_at: string | null
}

const ROLE_RANK: Record<string, number> = {
  admin: 100,
  supervisor: 80,
  lider: 60,
  membro: 40,
  congregado: 20,
  visitante: 10,
  visitor: 10,
  professor_ebd: 30,
  aluno_ebd: 15,
}

/** Map new role names to legacy users.role values */
export function toLegacyRole(roleName: string): string {
  if (roleName === "visitante") return "visitor"
  return roleName
}

export function fromLegacyRole(roleName: string): string {
  if (roleName === "visitor") return "visitante"
  return roleName
}

export async function fetchAccountRoles(accountId: string): Promise<AccountRoleRow[]> {
  try {
    const rows = await sql`
      SELECT * FROM get_account_roles(${accountId}::uuid, NULL)
    `
    return rows as AccountRoleRow[]
  } catch (error) {
    console.error("fetchAccountRoles:", error)
    return []
  }
}

export async function fetchAccountRolesBatch(
  accountIds: string[]
): Promise<Record<string, AccountRoleRow[]>> {
  if (accountIds.length === 0) return {}
  try {
    const rows = await sql`
      SELECT
        ar.account_id::text as account_id,
        r.id as role_id,
        r.name as role_name,
        r.display_name as role_display_name,
        ar.context_id,
        c.context_type,
        c.name as context_name,
        ar.assigned_at,
        ar.expires_at
      FROM account_roles ar
      INNER JOIN roles r ON ar.role_id = r.id
      LEFT JOIN contexts c ON ar.context_id = c.id
      WHERE ar.account_id = ANY(${accountIds})
        AND ar.is_active = true
        AND (ar.expires_at IS NULL OR ar.expires_at > now())
      ORDER BY ar.assigned_at DESC
    `
    const map: Record<string, AccountRoleRow[]> = {}
    for (const row of rows as any[]) {
      const id = String(row.account_id)
      if (!map[id]) map[id] = []
      map[id].push({
        role_id: row.role_id,
        role_name: row.role_name,
        role_display_name: row.role_display_name,
        context_id: row.context_id,
        context_type: row.context_type,
        context_name: row.context_name,
        assigned_at: row.assigned_at,
        expires_at: row.expires_at,
      })
    }
    return map
  } catch (error) {
    console.error("fetchAccountRolesBatch:", error)
    // Fallback: per-account queries
    const map: Record<string, AccountRoleRow[]> = {}
    await Promise.all(
      accountIds.map(async (id) => {
        map[id] = await fetchAccountRoles(id)
      })
    )
    return map
  }
}

export async function assignAccountRole(
  accountId: string,
  roleName: string,
  contextId: string | null,
  assignedBy?: string | null
): Promise<void> {
  const normalized = fromLegacyRole(roleName)
  if (contextId) {
    await sql`
      SELECT assign_role(
        ${accountId}::uuid,
        ${normalized},
        ${contextId}::uuid,
        ${assignedBy ?? null}::uuid,
        NULL
      )
    `
  } else {
    await sql`
      SELECT assign_role(
        ${accountId}::uuid,
        ${normalized},
        NULL,
        ${assignedBy ?? null}::uuid,
        NULL
      )
    `
  }
}

export async function removeAccountRole(
  accountId: string,
  roleName: string,
  contextId: string | null
): Promise<void> {
  const normalized = fromLegacyRole(roleName)
  if (contextId) {
    await sql`
      SELECT remove_role(${accountId}::uuid, ${normalized}, ${contextId}::uuid)
    `
  } else {
    await sql`
      SELECT remove_role(${accountId}::uuid, ${normalized}, NULL)
    `
  }
}

/** Recompute users.role from global account_roles */
export async function syncLegacyPrimaryRole(accountId: string): Promise<string> {
  const roles = await fetchAccountRoles(accountId)
  const globalRoles = roles.filter((r) => !r.context_id || r.context_type === "global")

  let best = "membro"
  let bestRank = -1
  for (const r of globalRoles) {
    const rank = ROLE_RANK[r.role_name] ?? 0
    if (rank > bestRank) {
      bestRank = rank
      best = r.role_name
    }
  }

  // If only contextual lider remains and no global, keep membro
  if (globalRoles.length === 0 && roles.some((r) => r.role_name === "lider")) {
    best = "membro"
  }

  const legacy = toLegacyRole(best)
  await sql`UPDATE users SET role = ${legacy} WHERE id = ${accountId}::uuid`
  await sql`
    UPDATE accounts SET journey_stage = ${
      best === "visitante" || best === "visitor"
        ? "visitante"
        : best === "admin"
          ? "admin"
          : best === "lider" || best === "supervisor"
            ? "líder"
            : best === "membro"
              ? "membro"
              : "visitante"
    }, updated_at = now()
    WHERE id = ${accountId}::uuid
  `
  return legacy
}

export async function ensureAccountExists(userId: string): Promise<void> {
  await sql`
    INSERT INTO accounts (
      id, email, name, avatar_url, phone, auth_provider, auth_provider_id,
      last_login_at, journey_stage, is_active, is_verified, created_at, updated_at
    )
    SELECT
      u.id,
      u.email,
      u.nome,
      u.foto_url,
      u.telefone,
      CASE
        WHEN u.apple_id IS NOT NULL THEN 'apple'
        WHEN u.firebase_uid IS NOT NULL THEN 'firebase'
        ELSE 'google'
      END,
      COALESCE(u.google_id, u.apple_id, u.firebase_uid),
      u.ultimo_login_em,
      CASE
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role IN ('supervisor', 'lider') THEN 'líder'
        WHEN u.role = 'membro' THEN 'membro'
        ELSE 'visitante'
      END,
      COALESCE(u.ativo, true),
      true,
      COALESCE(u.criado_em, now()),
      COALESCE(u.criado_em, now())
    FROM users u
    WHERE u.id = ${userId}::uuid
    ON CONFLICT (id) DO NOTHING
  `
}

export async function getOrCreateMinistryContext(ministerioId: string): Promise<string | null> {
  const existing = await sql`
    SELECT id FROM contexts
    WHERE context_type = 'ministry' AND context_id = ${ministerioId}::uuid
    LIMIT 1
  `
  if (existing[0]?.id) return existing[0].id as string

  const min = await sql`SELECT id, nome, descricao FROM ministerios WHERE id = ${ministerioId}::uuid`
  if (!min[0]) return null

  const created = await sql`
    SELECT create_context_for_resource(
      'ministry',
      ${ministerioId}::uuid,
      ${min[0].nome},
      ${min[0].descricao ?? null}
    ) as id
  `
  return (created[0]?.id as string) ?? null
}

export async function syncMinistryLeaderRole(
  userId: string,
  ministerioId: string,
  isLider: boolean,
  assignedBy?: string | null
): Promise<void> {
  await ensureAccountExists(userId)
  const contextId = await getOrCreateMinistryContext(ministerioId)
  if (!contextId) return

  if (isLider) {
    await assignAccountRole(userId, "lider", contextId, assignedBy)
  } else {
    await removeAccountRole(userId, "lider", contextId)
  }
}
