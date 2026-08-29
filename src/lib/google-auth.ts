import * as jose from "jose"

const GOOGLE_JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
)

export function getValidGoogleAudiences() {
  return [
    process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  ].filter(Boolean) as string[]
}

export async function verifyGoogleIdToken(idToken: string) {
  const audiences = getValidGoogleAudiences()
  if (audiences.length === 0) {
    throw new Error("Google Client ID não configurado no servidor")
  }

  try {
    const { payload } = await jose.jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: audiences,
    })

    if (!payload.sub) {
      throw new Error("Token inválido")
    }

    return {
      googleId: payload.sub as string,
      email: (payload.email as string | undefined) ?? null,
      name:
        (payload.name as string | undefined) ??
        (payload.email as string | undefined) ??
        null,
      picture: (payload.picture as string | undefined) ?? null,
    }
  } catch (err) {
    if (err instanceof jose.errors.JWTClaimValidationFailed && err.claim === "aud") {
      console.error(
        "[verifyGoogleIdToken] Audience rejeitado. Configurados:",
        audiences
      )
      throw new Error("Audience inválido")
    }
    if (err instanceof jose.errors.JWTExpired) {
      throw new Error("Token inválido")
    }
    throw err
  }
}
