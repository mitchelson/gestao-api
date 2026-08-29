import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { sql } from '../../lib/sql.js';
import type { RequestUser } from '../types/auth.types';

@Injectable()
export class AuthorizationService {
  requireAuth(user?: RequestUser): RequestUser {
    if (!user) throw new UnauthorizedException('Não autenticado');
    return user;
  }

  requireAdmin(user: RequestUser): void {
    if (user.role !== 'admin') throw new ForbiddenException('Sem permissão');
  }

  requireLiderOrAdmin(user: RequestUser): void {
    if (!['admin', 'supervisor', 'lider'].includes(user.role)) {
      throw new ForbiddenException('Sem permissão');
    }
  }

  async requireMinisterioAccess(user: RequestUser, ministerioId: string): Promise<void> {
    if (user.role === 'admin') return;

    if (user.role === 'lider' || user.role === 'supervisor') {
      const rows = await sql`
        SELECT 1 FROM ministerio_membros
        WHERE user_id = ${user.userId} AND ministerio_id = ${ministerioId}
          AND (is_lider = true OR ${user.role} = 'supervisor')
      `;
      if (rows.length > 0) return;
    }

    throw new ForbiddenException('Sem permissão');
  }
}
