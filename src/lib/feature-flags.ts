/**
 * Feature Flags System
 * 
 * This file provides a simple feature flag system to control
 * the rollout of the new permissions architecture.
 * 
 * Usage:
 * - Copy this file to your Next.js backend (e.g., lib/feature-flags.ts)
 * - Use isFeatureEnabled() to check if a feature is enabled
 * - Update feature flags via environment variables or database
 * 
 * @requires @vercel/postgres (optional, for database-backed flags)
 */

import { sql } from './sql';

// ============================================================================
// FEATURE FLAG DEFINITIONS
// ============================================================================

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rollout_percentage?: number; // 0-100, for gradual rollout
}

/**
 * Available feature flags for the migration
 */
export const FEATURE_FLAGS = {
  // Phase 2: Enable new permissions system for reading
  use_new_permissions_read: 'use_new_permissions_read',
  
  // Phase 3: Enable new permissions system for writing
  use_new_permissions: 'use_new_permissions',
  
  // Phase 4: Deprecate old users table
  deprecate_old_users: 'deprecate_old_users',
  
  // Per-feature flags
  enable_ministry_contexts: 'enable_ministry_contexts',
  enable_ebd_module: 'enable_ebd_module',
  enable_journey_tracking: 'enable_journey_tracking',
} as const;

// ============================================================================
// IN-MEMORY FEATURE FLAGS (for development/testing)
// ============================================================================

const inMemoryFlags: Record<string, boolean> = {
  [FEATURE_FLAGS.use_new_permissions_read]: false,
  [FEATURE_FLAGS.use_new_permissions]: false,
  [FEATURE_FLAGS.deprecate_old_users]: false,
  [FEATURE_FLAGS.enable_ministry_contexts]: true,
  [FEATURE_FLAGS.enable_ebd_module]: false,
  [FEATURE_FLAGS.enable_journey_tracking]: true,
};

// ============================================================================
// FEATURE FLAG CHECKING
// ============================================================================

/**
 * Check if a feature is enabled
 * 
 * Priority:
 * 1. Environment variable (FEATURE_FLAG_<NAME>=true/false)
 * 2. Database (if feature_flags table exists)
 * 3. In-memory default
 * 
 * @param flagName - Feature flag name
 * @returns Promise<boolean>
 */
export async function isFeatureEnabled(flagName: string): Promise<boolean> {
  try {
    // 1. Check environment variable first
    const envVar = `FEATURE_FLAG_${flagName.toUpperCase()}`;
    const envValue = process.env[envVar];
    
    if (envValue !== undefined) {
      return envValue === 'true' || envValue === '1';
    }
    
    // 2. Check database (if feature_flags table exists)
    try {
      const result = await sql`
        SELECT enabled, rollout_percentage 
        FROM feature_flags 
        WHERE name = ${flagName} 
        LIMIT 1
      `;
      
      if (result.length > 0) {
        const flag = result[0];
        
        // If rollout_percentage is set, use it for gradual rollout
        if (flag.rollout_percentage !== null && flag.rollout_percentage < 100) {
          const random = Math.random() * 100;
          return flag.enabled && random <= flag.rollout_percentage;
        }
        
        return flag.enabled === true;
      }
    } catch (dbError) {
      // Table doesn't exist or query failed, continue to in-memory
    }
    
    // 3. Fall back to in-memory default
    return inMemoryFlags[flagName] === true;
  } catch (error) {
    console.error(`Error checking feature flag ${flagName}:`, error);
    return false;
  }
}

/**
 * Get all feature flags (for admin dashboard)
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const result = await sql`
      SELECT name, enabled, description, rollout_percentage 
      FROM feature_flags 
      ORDER BY name
    `;
    
    return result as FeatureFlag[];
  } catch (error) {
    // Return in-memory flags if database query fails
    return Object.entries(inMemoryFlags).map(([name, enabled]) => ({
      name,
      enabled,
      description: '',
    }));
  }
}

/**
 * Enable a feature flag (admin only)
 */
export async function enableFeature(flagName: string): Promise<void> {
  try {
    await sql`
      INSERT INTO feature_flags (name, enabled)
      VALUES (${flagName}, true)
      ON CONFLICT (name) 
      DO UPDATE SET enabled = true, updated_at = now()
    `;
    
    // Update in-memory cache
    inMemoryFlags[flagName] = true;
  } catch (error) {
    console.error(`Error enabling feature ${flagName}:`, error);
    throw error;
  }
}

/**
 * Disable a feature flag (admin only)
 */
export async function disableFeature(flagName: string): Promise<void> {
  try {
    await sql`
      INSERT INTO feature_flags (name, enabled)
      VALUES (${flagName}, false)
      ON CONFLICT (name) 
      DO UPDATE SET enabled = false, updated_at = now()
    `;
    
    // Update in-memory cache
    inMemoryFlags[flagName] = false;
  } catch (error) {
    console.error(`Error disabling feature ${flagName}:`, error);
    throw error;
  }
}

/**
 * Set rollout percentage for gradual feature rollout (admin only)
 */
export async function setRolloutPercentage(
  flagName: string, 
  percentage: number
): Promise<void> {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Rollout percentage must be between 0 and 100');
  }
  
  try {
    await sql`
      UPDATE feature_flags 
      SET rollout_percentage = ${percentage}, updated_at = now()
      WHERE name = ${flagName}
    `;
  } catch (error) {
    console.error(`Error setting rollout percentage for ${flagName}:`, error);
    throw error;
  }
}

// ============================================================================
// MIGRATION PHASE HELPERS
// ============================================================================

/**
 * Get current migration phase based on feature flags
 * 
 * Phase 1: Preparation (tables created, no usage)
 * Phase 2: Dual-Write (write to both old and new)
 * Phase 3: Switchover (read from new, write to new only)
 * Phase 4: Cleanup (remove old tables)
 */
export async function getCurrentMigrationPhase(): Promise<1 | 2 | 3 | 4> {
  const deprecateOld = await isFeatureEnabled(FEATURE_FLAGS.deprecate_old_users);
  const useNewWrite = await isFeatureEnabled(FEATURE_FLAGS.use_new_permissions);
  const useNewRead = await isFeatureEnabled(FEATURE_FLAGS.use_new_permissions_read);
  
  if (deprecateOld) {
    return 4; // Cleanup phase
  } else if (useNewWrite) {
    return 3; // Switchover phase (new system only)
  } else if (useNewRead) {
    return 2; // Dual-write phase
  } else {
    return 1; // Preparation phase
  }
}

/**
 * Check if we should use the new permissions system for reads
 */
export async function shouldUseNewPermissionsForRead(): Promise<boolean> {
  return isFeatureEnabled(FEATURE_FLAGS.use_new_permissions_read);
}

/**
 * Check if we should use the new permissions system for writes
 */
export async function shouldUseNewPermissionsForWrite(): Promise<boolean> {
  return isFeatureEnabled(FEATURE_FLAGS.use_new_permissions);
}

// ============================================================================
// DATABASE SCHEMA FOR FEATURE FLAGS (optional)
// ============================================================================

/**
 * SQL to create feature_flags table (run this migration if you want database-backed flags)
 * 
 * CREATE TABLE IF NOT EXISTS feature_flags (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT UNIQUE NOT NULL,
 *   enabled BOOLEAN NOT NULL DEFAULT false,
 *   description TEXT,
 *   rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 * 
 * CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
 * CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
 */

export const FEATURE_FLAGS_MIGRATION_SQL = `
-- Feature Flags Table (optional, for database-backed feature flags)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Seed initial feature flags
INSERT INTO feature_flags (name, enabled, description) VALUES
  ('use_new_permissions_read', false, 'Read from new permissions system'),
  ('use_new_permissions', false, 'Write to new permissions system only'),
  ('deprecate_old_users', false, 'Old users table is deprecated'),
  ('enable_ministry_contexts', true, 'Enable ministry-specific role contexts'),
  ('enable_ebd_module', false, 'Enable EBD (Sunday School) module'),
  ('enable_journey_tracking', true, 'Track user journey stages')
ON CONFLICT (name) DO NOTHING;
`;
