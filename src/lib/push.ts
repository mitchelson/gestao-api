import webpush from "web-push"
import { sql } from "./sql.js"

let configured = false
function ensureConfigured() {
  if (configured) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return
  webpush.setVapidDetails("mailto:" + (process.env.VAPID_EMAIL || "admin@example.com"), pub, priv)
  configured = true
}

/** Envia push para Expo Push Tokens (app mobile) */
async function sendExpoPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const tokens = await sql`SELECT token FROM expo_push_tokens WHERE user_id = ${userId}`
  if (tokens.length === 0) return 0

  const messages = tokens.map((t: any) => ({
    to: t.token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: { url: payload.url },
  }))

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    })
    const data = await res.json()

    // Remove tokens expirados
    const receipts: any[] = Array.isArray(data.data) ? data.data : [data.data]
    for (let i = 0; i < receipts.length; i++) {
      if (receipts[i]?.status === "error" && receipts[i]?.details?.error === "DeviceNotRegistered") {
        await sql`DELETE FROM expo_push_tokens WHERE token = ${tokens[i].token}`
      }
    }
    return receipts.filter((r) => r?.status === "ok").length
  } catch {
    return 0
  }
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  // Envia para web push (PWA) e Expo push (app nativo) em paralelo
  const [webCount, expoCount] = await Promise.all([
    sendWebPushToUser(userId, payload),
    sendExpoPushToUser(userId, payload),
  ])
  return webCount + expoCount
}

async function sendWebPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured()
  if (!configured) return 0

  const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}`

  const results = await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`
        }
        throw err
      })
    )
  )

  return results.filter((r) => r.status === "fulfilled").length
}
