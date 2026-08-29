import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify } from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import type { RequestUser } from '../types/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret = new TextEncoder().encode(
    process.env.AUTH_JWT_SECRET ??
      process.env.AUTH_MOBILE_SECRET ??
      process.env.AUTH_SECRET ??
      'fallback-secret',
  );

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: RequestUser;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      if (isPublic) return true;
      throw new UnauthorizedException('Não autenticado');
    }

    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, this.secret);
      const userId = (payload.userId as string) ?? (payload.sub as string);
      const role = (payload.role as string) ?? 'membro';
      const ministerioIds = (payload.ministerioIds as string[]) ?? [];

      request.user = { userId, role, ministerioIds };
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
