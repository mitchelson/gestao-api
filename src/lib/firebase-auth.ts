import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID não configurado no servidor")
    }

    if (raw) {
      const serviceAccount = JSON.parse(raw) as {
        project_id?: string
        client_email?: string
        private_key?: string
      }
      initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
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
