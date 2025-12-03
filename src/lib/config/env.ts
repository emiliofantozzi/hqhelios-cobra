/**
 * Configuración centralizada de variables de entorno.
 * Valida y exporta todas las env vars requeridas.
 *
 * @module lib/config/env
 */

/**
 * Variables de entorno de Supabase.
 */
export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

/**
 * Variables de entorno de Clerk.
 */
export const clerkEnv = {
  webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
} as const;

/**
 * Valida que todas las variables de entorno requeridas estén configuradas.
 * Llamar esta función al inicio de cada módulo que use env vars.
 *
 * @throws {Error} Si alguna variable requerida no está configurada
 */
export function validateEnv() {
  const missing: string[] = [];

  if (!supabaseEnv.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseEnv.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supabaseEnv.serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Valida variables de Clerk.
 * @throws {Error} Si CLERK_WEBHOOK_SECRET no está configurado
 */
export function validateClerkEnv() {
  if (!clerkEnv.webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }
}
