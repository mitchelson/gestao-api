import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignJWT } from 'jose';
import { verifyAppleIdentityToken } from '../../lib/apple-auth';
import { verifyFirebaseIdToken } from '../../lib/firebase-auth';
import { verifyGoogleIdToken } from '../../lib/google-auth';
import {
  resolveMobileAuthUser,
  type MobileAuthProfile,
} from '../../lib/mobile-auth-user';
import { getAccountPermissions, getAccountRoles } from '../../lib/permissions';
import { sql } from '../../lib/sql';

@Injectable()
export class AuthService {
  private readonly secret = new TextEncoder().encode(
    process.env.AUTH_JWT_SECRET ??
      process.env.AUTH_MOBILE_SECRET ??
      process.env.AUTH_SECRET ??
      'fallback-secret',
  );

  private buildAppleName(fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  }) {
    if (!fullName) return null;
    const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  private async profileFromBody(
    body: Record<string, unknown>,
  ): Promise<MobileAuthProfile> {
    if (body.provider === 'apple' || body.identityToken) {
      const identityToken = body.identityToken as string | undefined;
      if (!identityToken) {
        throw new UnauthorizedException('identityToken obrigatório');
      }
      const apple = await verifyAppleIdentityToken(identityToken);
      const clientEmail =
        typeof body.email === 'string' && body.email.trim()
          ? body.email.trim()
          : null;
      const fullName = body.fullName as
        | { givenName?: string | null; familyName?: string | null }
        | undefined;

      return {
        provider: 'apple',
        providerAccountId: apple.appleId,
        email: apple.email ?? clientEmail,
        name: this.buildAppleName(fullName),
        picture: null,
      };
    }

    const idToken = body.idToken as string | undefined;
    if (!idToken) {
      throw new UnauthorizedException('idToken obrigatório');
    }

    if (body.provider === 'firebase') {
      const firebase = await verifyFirebaseIdToken(idToken);
      return {
        provider: 'firebase',
        providerAccountId: firebase.firebaseUid,
        email: firebase.email,
        name: firebase.name,
        picture: firebase.picture,
      };
    }

    const google = await verifyGoogleIdToken(idToken);
    return {
      provider: 'google',
      providerAccountId: google.googleId,
      email: google.email,
      name: google.name,
      picture: google.picture,
    };
  }

  async mobileLogin(body: Record<string, unknown>) {
    try {
      const profile = await this.profileFromBody(body);
      const resolved = await resolveMobileAuthUser(profile);

      if (resolved.blocked) {
        throw new ForbiddenException('Conta bloqueada');
      }

      const ministerioRows = await sql`
        SELECT ministerio_id FROM ministerio_membros WHERE user_id = ${resolved.userId}
      `;
      const ministerioIds = ministerioRows.map((r: any) => r.ministerio_id);

      const userRow = await sql`
        SELECT id, nome, email, foto_url, role FROM users WHERE id = ${resolved.userId}
      `;

      const row = userRow[0];
      if (!row) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const user = {
        id: row.id,
        name: row.nome,
        email: row.email,
        image: row.foto_url,
        role: row.role,
        ministerioIds,
      };

      const token = await new SignJWT({
        userId: resolved.userId,
        role: user.role,
        ministerioIds,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .setSubject(resolved.userId)
        .sign(this.secret);

      return { token, user };
    } catch (err: unknown) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Erro interno';
      console.error('[/v1/auth/mobile]', err);
      throw new UnauthorizedException(message);
    }
  }

  async getPermissions(userId: string) {
    const [permissions, roles] = await Promise.all([
      getAccountPermissions(userId),
      getAccountRoles(userId),
    ]);

    const accountResult = await sql`
      SELECT journey_stage FROM accounts WHERE id = ${userId}::uuid
    `;

    const journeyStage = accountResult[0]?.journey_stage || 'visitante';

    return {
      permissions: permissions.map((p) => ({
        name: p.permission_name,
        display_name: p.permission_display_name,
        category: p.permission_category,
      })),
      roles: roles.map((r) => ({
        role_name: r.name,
        role_display_name: r.display_name,
        context_type: r.context_type,
        context_name: r.context_name,
      })),
      journey_stage: journeyStage,
    };
  }
}
