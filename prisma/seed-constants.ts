/**
 * Constantes compartidas para seed scripts de Epic 1.
 *
 * Este módulo centraliza todos los valores constantes usados en seed.ts
 * para facilitar testing, reutilización en Epic 2, y cumplir con
 * architecture.md (eliminar magic strings).
 *
 * @module prisma/seed-constants
 */

/**
 * Nombre de la tabla "tenants" en Supabase.
 * @constant
 * @type {string}
 */
export const TABLE_TENANTS = 'tenants' as const;

/**
 * Nombre de la tabla "users" en Supabase.
 * @constant
 * @type {string}
 */
export const TABLE_USERS = 'users' as const;

/**
 * ID fijo del tenant demo para desarrollo y testing.
 *
 * Este UUID v4 está reservado exclusivamente para el tenant de demostración.
 * Permite referencias consistentes en tests y seed scripts.
 *
 * **IMPORTANTE:** NO modificar este ID - está documentado en architecture.md
 * y usado en múltiples tests.
 *
 * @constant
 * @type {string}
 */
export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001' as const;

/**
 * ID fijo del usuario admin demo.
 *
 * Este UUID v4 está reservado para el usuario administrador del tenant demo.
 *
 * @constant
 * @type {string}
 */
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002' as const;

/**
 * Clerk User ID para el usuario demo en desarrollo.
 *
 * Este ID debe coincidir con un usuario creado en Clerk Dashboard
 * o ser configurado como bypass en desarrollo local.
 *
 * @constant
 * @type {string}
 */
export const DEMO_CLERK_USER_ID = 'user_demo_development' as const;

/**
 * Slug único del tenant demo.
 *
 * Este slug es usado para garantizar idempotencia en el seed.
 * El upsert se realiza basado en este slug (no en ID).
 *
 * @constant
 * @type {string}
 */
export const DEMO_SLUG = 'demo' as const;

/**
 * Nombre del tenant demo.
 * @constant
 * @type {string}
 */
export const DEMO_TENANT_NAME = 'Demo Corp' as const;

/**
 * Email del usuario admin demo.
 * @constant
 * @type {string}
 */
export const DEMO_USER_EMAIL = 'admin@demo.com' as const;

/**
 * Nombre del usuario admin demo.
 * @constant
 * @type {string}
 */
export const DEMO_USER_FIRST_NAME = 'Admin' as const;

/**
 * Apellido del usuario admin demo.
 * @constant
 * @type {string}
 */
export const DEMO_USER_LAST_NAME = 'Demo' as const;

/**
 * Configuración por defecto para el tenant demo.
 *
 * Estos valores son usados al crear el tenant en seed.ts.
 *
 * @constant
 * @type {object}
 */
export const DEFAULT_TENANT_CONFIG = {
  /** Zona horaria por defecto para México */
  timezone: 'America/Mexico_City',
  /** Moneda por defecto (USD) */
  default_currency: 'USD',
  /** Plan inicial (trial) */
  plan_type: 'trial',
  /** Tenant activo */
  is_active: true,
} as const;

/**
 * Configuración por defecto para el usuario admin demo.
 *
 * @constant
 * @type {object}
 */
export const DEFAULT_USER_CONFIG = {
  /** Rol de administrador */
  role: 'admin',
  /** Usuario activo */
  is_active: true,
} as const;
