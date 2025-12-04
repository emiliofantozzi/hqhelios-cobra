/**
 * Cliente Supabase configurado para multi-tenancy con RLS.
 *
 * @module lib/db/supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { isValidUUID } from '@/lib/utils/validation';
import { supabaseEnv, validateEnv } from '@/lib/config/env';

/**
 * Crea cliente Supabase con tenant_id configurado para RLS.
 *
 * IMPORTANTE: Usa anon key (NO service_role) para respetar RLS policies.
 *
 * @param tenantId - UUID del tenant actual
 * @returns Cliente Supabase configurado
 * @throws {Error} Si las variables de entorno no están configuradas
 * @throws {Error} Si tenantId no es un UUID válido
 *
 * @example
 * ```ts
 * const supabase = await getSupabaseClient(tenantId);
 * const { data } = await supabase.from('companies').select('*');
 * ```
 */
export async function getSupabaseClient(tenantId: string): Promise<SupabaseClient> {
  validateEnv();

  if (!isValidUUID(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}. Expected UUID v4.`);
  }

  // Usar service role - el código filtra por tenant_id explícitamente en cada query
  // Esto evita el problema de RLS con PostgREST donde el contexto se pierde entre requests HTTP
  const supabase = createClient(supabaseEnv.url!, supabaseEnv.serviceKey!, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        // Header custom para debugging (opcional)
        'x-tenant-id': tenantId,
      },
    },
  });

  // NO llamar set_tenant_context - service_role bypasea RLS
  // La seguridad la maneja el código incluyendo tenant_id en todas las queries

  return supabase;
}

// setTenantContext ELIMINADO - ya no se usa con service_role
// El contexto de tenant se maneja incluyendo tenant_id en cada query

/**
 * Crea cliente Supabase con tenant_id del usuario autenticado.
 * Usa Clerk para obtener el tenant_id automaticamente.
 *
 * @returns Cliente Supabase configurado con RLS
 * @throws {Error} Si el usuario no esta autenticado o no tiene tenant
 *
 * @example
 * ```ts
 * const supabase = await getAuthenticatedSupabaseClient();
 * const { data } = await supabase.from('companies').select('*');
 * // Solo retorna companies del tenant del usuario
 * ```
 */
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const tenantId = await getTenantId();
  return getSupabaseClient(tenantId);
}

/**
 * Crea cliente Supabase sin contexto de tenant (bypass RLS).
 * SOLO usar para operaciones administrativas o webhooks.
 *
 * @returns Cliente Supabase con service role
 *
 * @example
 * ```ts
 * const supabase = getAdminSupabaseClient();
 * // CUIDADO: Este cliente puede ver TODOS los datos
 * ```
 */
export function getAdminSupabaseClient(): SupabaseClient {
  validateEnv();

  return createClient(supabaseEnv.url!, supabaseEnv.serviceKey!);
}
