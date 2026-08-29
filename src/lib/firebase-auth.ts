import { readFileSync, existsSync } from "node:fs"
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function loadServiceAccount(): ServiceAccount | null {
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE?.trim() ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim().startsWith("/")
      ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()
      : "")

  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`FIREBASE service account não encontrado: ${filePath}`)
    }
    return JSON.parse(readFileSync(filePath, "utf8")) as ServiceAccount
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  return JSON.parse(raw) as ServiceAccount
}

function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID não configurado no servidor")
    }

    const serviceAccount = loadServiceAccount()
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      })
    } else {
      initializeApp({ projectId })
    }
  }

  return getAuth()
}

export async function verifyFirebaseIdToken(idToken: string) {
  const auth = getFirebaseAdminAuth()
  const decoded = await auth.verifyIdToken(idToken)

  if (!decoded.uid) {
    throw new Error("Token inválido")
  }

  return {
    firebaseUid: decoded.uid,
    email: decoded.email ?? null,
    name: decoded.name ?? decoded.email ?? null,
    picture: decoded.picture ?? null,
  }
}
