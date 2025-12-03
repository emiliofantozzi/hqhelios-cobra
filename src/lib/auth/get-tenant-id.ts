/**
 * Helper para obtener el tenant_id del usuario autenticado.
 *
 * @module lib/auth/get-tenant-id
 */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/db/supabase'; // FIX 18: Regular import instead of dynamic
import { isValidUUID } from '@/lib/utils/validation';
import '@/types/clerk.types'; // Importar extension de tipos

/**
 * Obtiene el tenant_id del usuario actualmente autenticado.
 *
 * @returns Promise con el tenant_id del usuario
 * @throws {Error} Si el usuario no esta autenticado o no tiene tenant asignado
 *
 * @example
 * ```ts
 * const tenantId = await getTenantId();
 * console.log(tenantId); // "uuid-del-tenant"
 * ```
 */
export async function getTenantId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Obtener usuario de Clerk para acceder a public_metadata
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // FIX 17: Add null safety on publicMetadata
  const tenantId = user.publicMetadata?.tenant_id as string | undefined;

  if (!tenantId) {
    throw new Error('User does not have a tenant assigned');
  }

  // Validar formato UUID
  if (!isValidUUID(tenantId)) {
    throw new Error(`Invalid tenant_id format: ${tenantId}`);
  }

  return tenantId;
}

/**
 * Obtiene el usuario completo de la base de datos.
 * IMPORTANTE: Usa RLS para garantizar aislamiento de tenants.
 *
 * @returns Promise con el usuario completo incluyendo datos de DB
 * @throws {Error} Si el usuario no esta autenticado o no existe en DB
 *
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * console.log(user.email, user.role);
 * ```
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Obtener tenant_id primero
  const tenantId = await getTenantId();

  // FIX 18: Use regular import (already imported at top)
  const supabase = await getSupabaseClient(tenantId);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('tenant_id', tenantId) // Validar tenant explicitamente
    .single();

  if (error || !user) {
    throw new Error('User not found in database');
  }

  // FIX 8: Check if user is active
  if (!user.is_active) {
    throw new Error('User is inactive');
  }

  return user;
}
