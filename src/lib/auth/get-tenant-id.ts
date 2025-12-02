/**
 * Helper para obtener el tenant_id del usuario autenticado.
 *
 * @module lib/auth/get-tenant-id
 */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  const tenantId = user.publicMetadata.tenant_id as string | undefined;

  if (!tenantId) {
    throw new Error('User does not have a tenant assigned');
  }

  return tenantId;
}

/**
 * Obtiene el usuario completo de la base de datos.
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found in database');
  }

  return user;
}
