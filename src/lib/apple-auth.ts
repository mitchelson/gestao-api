import * as jose from "jose"

const APPLE_JWKS = jose.createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
)

function getAppleAudiences() {
  return [
    process.env.APPLE_CLIENT_ID,
    process.env.APPLE_BUNDLE_ID,
    process.env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
    "com.zenvixlabs.pibrr",
  ].filter(Boolean) as string[]
}

export async function verifyAppleIdentityToken(identityToken: string) {
  const audiences = getAppleAudiences()
  if (audiences.length === 0) {
    throw new Error("Apple Client ID não configurado no servidor")
  }

  const { payload } = await jose.jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: audiences,
  })

  return {
    appleId: payload.sub as string,
    email: (payload.email as string | undefined) ?? null,
  }
}
