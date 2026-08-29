import { sql } from "./sql.js"

export type MobileProvider = "google" | "apple" | "firebase"

export interface MobileAuthProfile {
  provider: MobileProvider
  providerAccountId: string
  email?: string | null
  name?: string | null
  picture?: string | null
}

type UserRow = {
  id: string
  role: string
  ativo: boolean
  google_id?: string | null
  apple_id?: string | null
  firebase_uid?: string | null
  email?: string | null
}

type ResolvedUser = {
  userId: string
  role: string
  blocked: boolean
}

const ROLE_RANK: Record<string, number> = {
  admin: 5,
  supervisor: 4,
  lider: 3,
  membro: 2,
  visitor: 1,
}

function normalizeEmail(email?: string | null) {
  const trimmed = email?.trim().toLowerCase()
  return trimmed || null
}

async function findByProvider(profile: MobileAuthProfile) {
  if (profile.provider === "google") {
    return sql`
      SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
      WHERE google_id = ${profile.providerAccountId}
      LIMIT 1
    `
  }
  if (profile.provider === "apple") {
    return sql`
      SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
      WHERE apple_id = ${profile.providerAccountId}
      LIMIT 1
    `
  }
  return sql`
    SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
    WHERE firebase_uid = ${profile.providerAccountId}
    LIMIT 1
  `
}

async function findByEmail(email: string) {
  return sql`
    SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
    WHERE lower(trim(email)) = ${email}
    LIMIT 1
  `
}

async function findPending(profile: MobileAuthProfile, normalizedEmail: string | null) {
  if (normalizedEmail) {
    const byEmail = await sql`
      SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
      WHERE google_id IS NULL
        AND apple_id IS NULL
        AND firebase_uid IS NULL
        AND lower(trim(email)) = ${normalizedEmail}
      LIMIT 1
    `
    if (byEmail.length > 0) return byEmail
  }

  if (profile.name) {
    const byName = await sql`
      SELECT id, role, ativo, google_id, apple_id, firebase_uid, email FROM users
      WHERE google_id IS NULL
        AND apple_id IS NULL
        AND firebase_uid IS NULL
        AND nome = ${profile.name}
      LIMIT 1
    `
    if (byName.length > 0) return byName
  }

  return []
}

function pickCanonicalUser(a: UserRow, b: UserRow) {
  const rankA = ROLE_RANK[a.role] ?? 0
  const rankB = ROLE_RANK[b.role] ?? 0
  if (rankA !== rankB) return rankA > rankB ? a : b
  return a
}

async function linkProvider(userId: string, profile: MobileAuthProfile) {
  if (profile.provider === "google") {
    await sql`
      UPDATE users SET google_id = COALESCE(google_id, ${profile.providerAccountId})
      WHERE id = ${userId}
    `
  } else if (profile.provider === "apple") {
    await sql`
      UPDATE users SET apple_id = COALESCE(apple_id, ${profile.providerAccountId})
      WHERE id = ${userId}
    `
  } else {
    await sql`
      UPDATE users SET firebase_uid = COALESCE(firebase_uid, ${profile.providerAccountId})
      WHERE id = ${userId}
    `
  }
}

async function updateProfileOnLogin(userId: string, profile: MobileAuthProfile) {
  await sql`UPDATE users SET ultimo_login_em = now() WHERE id = ${userId}`

  if (profile.name) {
    await sql`UPDATE users SET nome = ${profile.name} WHERE id = ${userId}`
  }
  if (profile.email) {
    await sql`UPDATE users SET email = ${profile.email} WHERE id = ${userId}`
  }
  if (profile.picture) {
    await sql`UPDATE users SET foto_url = ${profile.picture} WHERE id = ${userId}`
  }
}

async function mergeUsers(canonicalId: string, duplicateId: string) {
  if (canonicalId === duplicateId) return

  const rows = await sql`
    SELECT id, google_id, apple_id, firebase_uid, nome, foto_url, email FROM users
    WHERE id IN (${canonicalId}, ${duplicateId})
  `

  const canonical = rows.find((row) => row.id === canonicalId)
  const duplicate = rows.find((row) => row.id === duplicateId)
  if (!canonical || !duplicate) return

  await sql`
    UPDATE users SET
      google_id = COALESCE(google_id, ${duplicate.google_id}),
      apple_id = COALESCE(apple_id, ${duplicate.apple_id}),
      firebase_uid = COALESCE(firebase_uid, ${duplicate.firebase_uid}),
      nome = COALESCE(NULLIF(trim(nome), ''), ${duplicate.nome}),
      foto_url = COALESCE(foto_url, ${duplicate.foto_url}),
      email = COALESCE(email, ${duplicate.email})
    WHERE id = ${canonicalId}
  `

  await sql`
    DELETE FROM ministerio_membros mm_dup
    WHERE mm_dup.user_id = ${duplicateId}
      AND EXISTS (
        SELECT 1 FROM ministerio_membros mm_can
        WHERE mm_can.user_id = ${canonicalId}
          AND mm_can.ministerio_id = mm_dup.ministerio_id
      )
  `
  await sql`
    UPDATE ministerio_membros SET user_id = ${canonicalId}
    WHERE user_id = ${duplicateId}
  `

  await sql`
    DELETE FROM escalas e_dup
    WHERE e_dup.user_id = ${duplicateId}
      AND EXISTS (
        SELECT 1 FROM escalas e_can
        WHERE e_can.user_id = ${canonicalId}
          AND e_can.evento_id = e_dup.evento_id
          AND e_can.ministerio_id = e_dup.ministerio_id
      )
  `
  await sql`UPDATE escalas SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`

  await sql`
    UPDATE user_indisponibilidades SET user_id = ${canonicalId}
    WHERE user_id = ${duplicateId}
  `

  await sql`
    DELETE FROM feed_likes fl_dup
    WHERE fl_dup.user_id = ${duplicateId}
      AND EXISTS (
        SELECT 1 FROM feed_likes fl_can
        WHERE fl_can.user_id = ${canonicalId} AND fl_can.post_id = fl_dup.post_id
      )
  `
  await sql`UPDATE feed_likes SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`
  await sql`UPDATE feed_comments SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`

  await sql`
    DELETE FROM ministerio_form_respostas
    WHERE user_id = ${duplicateId}
      AND EXISTS (SELECT 1 FROM ministerio_form_respostas WHERE user_id = ${canonicalId})
  `
  await sql`
    UPDATE ministerio_form_respostas SET user_id = ${canonicalId}
    WHERE user_id = ${duplicateId}
  `

  await sql`UPDATE notifications SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`
  await sql`UPDATE expo_push_tokens SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`
  await sql`UPDATE push_subscriptions SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`
  await sql`UPDATE visitantes SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`
  await sql`UPDATE responsaveis SET user_id = ${canonicalId} WHERE user_id = ${duplicateId}`

  await sql`
    DELETE FROM user_gift_results
    WHERE user_id = ${duplicateId}
      AND EXISTS (SELECT 1 FROM user_gift_results WHERE user_id = ${canonicalId})
  `
  await sql`
    UPDATE user_gift_results SET user_id = ${canonicalId}
    WHERE user_id = ${duplicateId}
  `

  await sql`DELETE FROM users WHERE id = ${duplicateId}`
}

async function resolveByEmailMerge(
  profile: MobileAuthProfile,
  normalizedEmail: string,
  currentUser?: UserRow
): Promise<ResolvedUser | null> {
  const byEmail = await findByEmail(normalizedEmail)
  if (byEmail.length === 0) return null

  const emailUser = byEmail[0]
  if (!emailUser.ativo) {
    return { userId: emailUser.id, role: emailUser.role, blocked: true }
  }

  if (currentUser && currentUser.id !== emailUser.id) {
    const canonical = pickCanonicalUser(emailUser as UserRow, currentUser)
    const duplicate = canonical.id === emailUser.id ? currentUser : emailUser
    await mergeUsers(canonical.id, duplicate.id)
    await linkProvider(canonical.id, profile)
    await updateProfileOnLogin(canonical.id, profile)
    const updated = await sql`SELECT role FROM users WHERE id = ${canonical.id}`
    return { userId: canonical.id, role: updated[0].role, blocked: false }
  }

  await linkProvider(emailUser.id, profile)
  await updateProfileOnLogin(emailUser.id, profile)
  const updated = await sql`SELECT role FROM users WHERE id = ${emailUser.id}`
  return { userId: emailUser.id, role: updated[0].role, blocked: false }
}

async function createUser(profile: MobileAuthProfile, role: string) {
  if (profile.provider === "google") {
    const inserted = await sql`
      INSERT INTO users (google_id, email, nome, foto_url, role)
      VALUES (
        ${profile.providerAccountId},
        ${profile.email || null},
        ${profile.name || null},
        ${profile.picture || null},
        ${role}
      )
      RETURNING id
    `
    return inserted[0].id as string
  }

  if (profile.provider === "apple") {
    const inserted = await sql`
      INSERT INTO users (apple_id, email, nome, foto_url, role)
      VALUES (
        ${profile.providerAccountId},
        ${profile.email || null},
        ${profile.name || null},
        ${profile.picture || null},
        ${role}
      )
      RETURNING id
    `
    return inserted[0].id as string
  }

  const inserted = await sql`
    INSERT INTO users (firebase_uid, email, nome, foto_url, role)
    VALUES (
      ${profile.providerAccountId},
      ${profile.email || null},
      ${profile.name || null},
      ${profile.picture || null},
      ${role}
    )
    RETURNING id
  `
  return inserted[0].id as string
}

export async function resolveMobileAuthUser(
  profile: MobileAuthProfile
): Promise<ResolvedUser> {
  const normalizedEmail = normalizeEmail(profile.email)

  const byProvider = await findByProvider(profile)
  if (byProvider.length > 0) {
    const providerUser = byProvider[0]
    if (!providerUser.ativo) {
      return { userId: providerUser.id, role: providerUser.role, blocked: true }
    }

    if (normalizedEmail) {
      const merged = await resolveByEmailMerge(profile, normalizedEmail, providerUser as UserRow)
      if (merged) return merged
    }

    await updateProfileOnLogin(providerUser.id, profile)
    return { userId: providerUser.id, role: providerUser.role, blocked: false }
  }

  if (normalizedEmail) {
    const merged = await resolveByEmailMerge(profile, normalizedEmail)
    if (merged) return merged
  }

  const pendente = await findPending(profile, normalizedEmail)
  if (pendente.length > 0) {
    const user = pendente[0]
    if (!user.ativo) {
      return { userId: user.id, role: user.role, blocked: true }
    }
    await linkProvider(user.id, profile)
    await updateProfileOnLogin(user.id, profile)
    const updated = await sql`SELECT role FROM users WHERE id = ${user.id}`
    return { userId: user.id, role: updated[0].role, blocked: false }
  }

  const count = await sql`SELECT count(*)::int as total FROM users`
  const role = count[0].total === 0 ? "admin" : "visitor"
  const userId = await createUser(profile, role)
  return { userId, role, blocked: false }
}
