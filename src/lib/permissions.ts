/**
 * Permission Helper Functions for Backend
 * 
 * This file provides TypeScript helpers for checking permissions
 * and managing roles in the new user-roles architecture.
 * 
 * Usage:
 * - Copy this file to your Next.js backend (e.g., lib/permissions.ts)
 * - Import these functions in your API routes
 * - Use hasPermission() to check if a user can perform an action
 * 
 * @requires pg or @vercel/postgres for database queries
 */

import { sql } from './sql';

// ============================================================================
// TYPES
// ============================================================================

export interface Account {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  auth_provider: string;
  auth_provider_id?: string;
  last_login_at?: Date;
  journey_stage: 'visitante' | 'congregado' | 'membro' | 'líder' | 'pastor' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  parent_role_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Context {
  id: string;
  context_type: 'ministry' | 'event' | 'ebd_class' | 'escala' | 'global';
  context_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountRole {
  id: string;
  account_id: string;
  role_id: string;
  context_id?: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  is_system: boolean;
  created_at: Date;
}

export interface AccountPermission {
  permission_name: string;
  permission_display_name: string;
  permission_category: string;
  role_name: string;
  context_type?: string;
  context_name?: string;
}

export interface AccountRoleWithContext extends Role {
  context_id?: string;
  context_type?: string;
  context_name?: string;
  assigned_at: Date;
  expires_at?: Date;
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if an account has a specific permission
 * 
 * @param accountId - UUID of the account
 * @param permissionName - Permission name (e.g., "escalas:create")
 * @param contextId - Optional context UUID (for context-specific permissions)
 * @returns Promise<boolean>
 * 
 * @example
 * const canCreateEscala = await hasPermission(userId, "escalas:create", ministryId);
 * if (!canCreateEscala) {
 *   return res.status(403).json({ error: "Forbidden" });
 * }
 */
export async function hasPermission(
  accountId: string,
  permissionName: string,
  contextId?: string
): Promise<boolean> {
  try {
    if (contextId) {
      // Check with context
      const result = await sql`
        SELECT has_permission(${accountId}::uuid, ${permissionName}, ${contextId}::uuid) as has_perm
      `;
      return result[0]?.has_perm === true;
    } else {
      // Check without context (global permission)
      const result = await sql`
        SELECT has_permission(${accountId}::uuid, ${permissionName}, NULL) as has_perm
      `;
      return result[0]?.has_perm === true;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for an account
 * 
 * @param accountId - UUID of the account
 * @param contextId - Optional context UUID to filter permissions
 * @returns Promise<AccountPermission[]>
 */
export async function getAccountPermissions(
  accountId: string,
  contextId?: string
): Promise<AccountPermission[]> {
  try {
    const result = contextId
      ? await sql`SELECT * FROM get_account_permissions(${accountId}::uuid, ${contextId}::uuid)`
      : await sql`SELECT * FROM get_account_permissions(${accountId}::uuid, NULL)`;
    
return result as AccountPermission[];
  } catch (error) {
    console.error('Error getting account permissions:', error);
    return [];
  }
}

/**
 * Get all roles for an account
 * 
 * @param accountId - UUID of the account
 * @param contextType - Optional context type to filter roles
 * @returns Promise<AccountRoleWithContext[]>
 */
export async function getAccountRoles(
  accountId: string,
  contextType?: string
): Promise<AccountRoleWithContext[]> {
  try {
    const result = contextType
      ? await sql`SELECT * FROM get_account_roles(${accountId}::uuid, ${contextType})`
      : await sql`SELECT * FROM get_account_roles(${accountId}::uuid, NULL)`;
    
    return result as AccountRoleWithContext[];
  } catch (error) {
    console.error('Error getting account roles:', error);
    return [];
  }
}

/**
 * Check if an account has a specific role (globally or in a context)
 * 
 * @param accountId - UUID of the account
 * @param roleName - Role name (e.g., "admin", "lider")
 * @param contextId - Optional context UUID
 * @returns Promise<boolean>
 */
export async function hasRole(
  accountId: string,
  roleName: string,
  contextId?: string
): Promise<boolean> {
  try {
    const query = contextId
      ? sql`
          SELECT EXISTS (
            SELECT 1
            FROM account_roles ar
            INNER JOIN roles r ON ar.role_id = r.id
            WHERE ar.account_id = ${accountId}::uuid
              AND r.name = ${roleName}
              AND ar.context_id = ${contextId}::uuid
              AND ar.is_active = true
              AND (ar.expires_at IS NULL OR ar.expires_at > now())
          ) as has_role
        `
      : sql`
          SELECT EXISTS (
            SELECT 1
            FROM account_roles ar
            INNER JOIN roles r ON ar.role_id = r.id
            WHERE ar.account_id = ${accountId}::uuid
              AND r.name = ${roleName}
              AND ar.is_active = true
              AND (ar.expires_at IS NULL OR ar.expires_at > now())
          ) as has_role
        `;
    
    const result = await query;
    return result[0]?.has_role === true;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Check if an account is a ministry leader
 * 
 * @param accountId - UUID of the account
 * @param ministryId - UUID of the ministry
 * @returns Promise<boolean>
 */
export async function isMinistryLeader(
  accountId: string,
  ministryId: string
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT is_ministry_leader(${accountId}::uuid, ${ministryId}::uuid) as is_leader
    `;
    return result[0]?.is_leader === true;
  } catch (error) {
    console.error('Error checking ministry leader:', error);
    return false;
  }
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Assign a role to an account
 * 
 * @param accountId - UUID of the account
 * @param roleName - Role name
 * @param contextId - Optional context UUID
 * @param assignedBy - UUID of the account assigning the role
 * @param expiresAt - Optional expiration date
 * @returns Promise<string> - ID of the created account_role
 */
export async function assignRole(
  accountId: string,
  roleName: string,
  contextId?: string,
  assignedBy?: string,
  expiresAt?: Date
): Promise<string> {
  try {
    const result = await sql`
      SELECT assign_role(
        ${accountId}::uuid,
        ${roleName},
        ${contextId ? contextId + '::uuid' : 'NULL'},
        ${assignedBy ? assignedBy + '::uuid' : 'NULL'},
        ${expiresAt ? expiresAt.toISOString() : 'NULL'}
      ) as account_role_id
    `;
    return result[0]?.account_role_id;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

/**
 * Remove a role from an account
 * 
 * @param accountId - UUID of the account
 * @param roleName - Role name
 * @param contextId - Optional context UUID
 * @returns Promise<boolean> - True if role was removed
 */
export async function removeRole(
  accountId: string,
  roleName: string,
  contextId?: string
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT remove_role(
        ${accountId}::uuid,
        ${roleName},
        ${contextId ? contextId + '::uuid' : 'NULL'}
      ) as removed
    `;
    return result[0]?.removed === true;
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

/**
 * Create a context for a resource (ministry, event, EBD class, etc)
 * 
 * @param contextType - Type of context
 * @param contextId - UUID of the resource
 * @param name - Display name
 * @param description - Optional description
 * @returns Promise<string> - ID of the context
 */
export async function createContext(
  contextType: Context['context_type'],
  contextId: string,
  name: string,
  description?: string
): Promise<string> {
  try {
    const result = await sql`
      SELECT create_context_for_resource(
        ${contextType},
        ${contextId}::uuid,
        ${name},
        ${description || null}
      ) as context_id
    `;
    return result[0]?.context_id;
  } catch (error) {
    console.error('Error creating context:', error);
    throw error;
  }
}

/**
 * Get ministry members with their roles
 * 
 * @param ministryId - UUID of the ministry
 * @returns Promise<any[]>
 */
export async function getMinistryMembers(ministryId: string): Promise<any[]> {
  try {
    const result = await sql`
      SELECT * FROM get_ministry_members(${ministryId}::uuid)
    `;
    return result;
  } catch (error) {
    console.error('Error getting ministry members:', error);
    return [];
  }
}

// ============================================================================
// ACCOUNT QUERIES
// ============================================================================

/**
 * Get account by ID
 * 
 * @param accountId - UUID of the account
 * @returns Promise<Account | null>
 */
export async function getAccountById(accountId: string): Promise<Account | null> {
  try {
    const result = await sql`
      SELECT * FROM accounts WHERE id = ${accountId}::uuid
    `;
    return result[0] as Account || null;
  } catch (error) {
    console.error('Error getting account:', error);
    return null;
  }
}

/**
 * Get account by email
 * 
 * @param email - Email address
 * @returns Promise<Account | null>
 */
export async function getAccountByEmail(email: string): Promise<Account | null> {
  try {
    const result = await sql`
      SELECT * FROM accounts WHERE email = ${email}
    `;
    return result[0] as Account || null;
  } catch (error) {
    console.error('Error getting account by email:', error);
    return null;
  }
}

/**
 * Get account dashboard data (complete profile with roles and permissions)
 * 
 * @param accountId - UUID of the account
 * @returns Promise<any>
 */
export async function getAccountDashboard(accountId: string): Promise<any> {
  try {
    const result = await sql`
      SELECT get_account_dashboard(${accountId}::uuid) as dashboard
    `;
    return result[0]?.dashboard || null;
  } catch (error) {
    console.error('Error getting account dashboard:', error);
    return null;
  }
}

// ============================================================================
// BACKWARDS COMPATIBILITY (for migration phase)
// ============================================================================

/**
 * Get user by ID (compatibility function that queries accounts)
 * During migration, use this to maintain compatibility with old code
 * 
 * @deprecated Use getAccountById instead
 */
export async function getUserById(userId: string): Promise<Account | null> {
  return getAccountById(userId);
}

/**
 * Check old-style role (for backwards compatibility during migration)
 * 
 * @deprecated Use hasRole or hasPermission instead
 */
export async function checkOldStyleRole(
  userId: string,
  requiredRole: 'admin' | 'supervisor' | 'lider' | 'membro'
): Promise<boolean> {
  // During migration, check both old users table and new accounts/roles
  const hasNewRole = await hasRole(userId, requiredRole);
  if (hasNewRole) return true;
  
  // Fallback to old users table (will be removed after migration)
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM users WHERE id = ${userId}::uuid AND role = ${requiredRole}
      ) as has_old_role
    `;
    return result[0]?.has_old_role === true;
  } catch (error) {
    return false;
  }
}
