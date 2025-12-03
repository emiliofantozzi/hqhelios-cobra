/**
 * Configuración de valores por defecto para nuevos tenants.
 * Permite personalización futura sin cambiar código.
 *
 * @module lib/config/tenant-defaults
 */

/**
 * Tipo de plan disponible para tenants.
 */
export type PlanType = 'trial' | 'basic' | 'pro' | 'enterprise';

/**
 * Configuración por defecto para nuevos tenants.
 *
 * NOTA: En el futuro, estos valores pueden venir de:
 * - Variables de entorno (para deploys regionales)
 * - Base de datos (configuración dinámica)
 * - Query params del signup (personalización por campaña)
 */
export const TENANT_DEFAULTS = {
  /**
   * Zona horaria por defecto.
   * @default 'America/Mexico_City'
   */
  timezone: (process.env.DEFAULT_TIMEZONE || 'America/Mexico_City') as string,

  /**
   * Moneda por defecto (código ISO 4217).
   * @default 'USD'
   */
  defaultCurrency: (process.env.DEFAULT_CURRENCY || 'USD') as string,

  /**
   * Plan inicial para nuevos tenants.
   * @default 'trial'
   */
  planType: (process.env.DEFAULT_PLAN_TYPE || 'trial') as PlanType,

  /**
   * Estado activo por defecto.
   * @default true
   */
  isActive: true,
} as const;

/**
 * Obtiene configuración de tenant personalizada.
 * En el futuro puede aceptar parámetros para personalización.
 *
 * @param options - Opciones de personalización (futuro)
 * @returns Configuración de tenant
 *
 * @example
 * const config = getTenantConfig();
 * // Futuro: getTenantConfig({ region: 'US', plan: 'pro' })
 */
export function getTenantConfig(options?: {
  timezone?: string;
  currency?: string;
  plan?: PlanType;
}) {
  return {
    timezone: options?.timezone || TENANT_DEFAULTS.timezone,
    default_currency: options?.currency || TENANT_DEFAULTS.defaultCurrency,
    plan_type: options?.plan || TENANT_DEFAULTS.planType,
    is_active: TENANT_DEFAULTS.isActive,
  };
}
