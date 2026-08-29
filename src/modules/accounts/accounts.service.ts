import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  assignAccountRole,
  ensureAccountExists,
  fetchAccountRoles,
  getOrCreateMinistryContext,
  removeAccountRole,
  syncLegacyPrimaryRole,
} from '../../lib/account-roles';
import { sql } from '../../lib/sql';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';

@Injectable()
export class AccountsService {
  constructor(private readonly authz: AuthorizationService) {}

  async getRoles(requestUser: RequestUser, accountId: string) {
    if (requestUser.userId !== accountId && requestUser.role !== 'admin') {
      throw new ForbiddenException('Sem permissão');
    }
    const roles = await fetchAccountRoles(accountId);
    return { roles };
  }

  async assignRole(
    admin: RequestUser,
    accountId: string,
    body: {
      role_name?: string;
      context_id?: string | null;
      ministerio_id?: string | null;
    },
  ) {
    this.authz.requireAdmin(admin);

    const { role_name, context_id, ministerio_id } = body;
    if (!role_name) throw new BadRequestException('role_name obrigatório');

    await ensureAccountExists(accountId);

    let contextId: string | null = context_id ?? null;
    if (!contextId && ministerio_id) {
      contextId = await getOrCreateMinistryContext(ministerio_id);
    }

    const globalOnly = [
      'admin',
      'supervisor',
      'membro',
      'congregado',
      'visitante',
      'visitor',
    ];
    if (globalOnly.includes(role_name) && !ministerio_id) {
      contextId = null;
    }

    await assignAccountRole(accountId, role_name, contextId, admin.userId);

    if (!contextId) {
      await syncLegacyPrimaryRole(accountId);
    } else if (role_name === 'lider' && ministerio_id) {
      await sql`
        INSERT INTO ministerio_membros (user_id, ministerio_id, is_lider, pendente)
        VALUES (${accountId}::uuid, ${ministerio_id}::uuid, true, false)
        ON CONFLICT (ministerio_id, user_id)
        DO UPDATE SET is_lider = true, pendente = false
      `;
    }

    const roles = await fetchAccountRoles(accountId);
    const user = await sql`SELECT role FROM users WHERE id = ${accountId}::uuid`;
    return { roles, role: user[0]?.role };
  }

  async removeRole(
    admin: RequestUser,
    accountId: string,
    body: {
      role_name?: string;
      context_id?: string | null;
      ministerio_id?: string | null;
    },
  ) {
    this.authz.requireAdmin(admin);

    const { role_name, context_id, ministerio_id } = body;
    if (!role_name) throw new BadRequestException('role_name obrigatório');

    let contextId: string | null = context_id ?? null;
    let ministryId: string | null = ministerio_id ?? null;
    if (!contextId && ministryId) {
      contextId = await getOrCreateMinistryContext(ministryId);
    }
    if (!ministryId && contextId) {
      const ctx = await sql`
        SELECT context_id::text as ministerio_id FROM contexts
        WHERE id = ${contextId}::uuid AND context_type = 'ministry'
      `;
      ministryId = ctx[0]?.ministerio_id || null;
    }

    await removeAccountRole(accountId, role_name, contextId);

    if (role_name === 'lider' && ministryId) {
      await sql`
        UPDATE ministerio_membros SET is_lider = false
        WHERE user_id = ${accountId}::uuid AND ministerio_id = ${ministryId}::uuid
      `;
    }

    const legacy = await syncLegacyPrimaryRole(accountId);
    const roles = await fetchAccountRoles(accountId);
    return { roles, role: legacy };
  }
}
