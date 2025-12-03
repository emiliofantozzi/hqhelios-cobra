/**
 * Provisiona un tenant y usuario para nuevos usuarios de Clerk.
 * Usado por el webhook (primario) y getTenantId (fallback JIT).
 *
 * @module lib/auth/provision-tenant
 */
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';
import { generateSlug, generateTenantName } from '@/lib/utils/generate-slug';
import { supabaseEnv, validateEnv } from '@/lib/config/env';
import { getTenantConfig } from '@/lib/config/tenant-defaults';

interface ProvisionUserInput {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Provisiona un tenant y usuario para un nuevo usuario de Clerk.
 * Esta función es idempotente - si el usuario ya existe, retorna el tenant_id existente.
 *
 * @param clerkUser - Datos del usuario de Clerk
 * @returns Promise con el tenant_id del usuario
 * @throws {Error} Si falla la creación del tenant o usuario
 */
export async function provisionTenantForUser(
  clerkUser: ProvisionUserInput
): Promise<string> {
  validateEnv();

  const supabase = createClient(supabaseEnv.url!, supabaseEnv.serviceKey!);

  // 1. Idempotency check - si el usuario ya existe, retornar su tenant_id
  const { data: existingUser } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('clerk_user_id', clerkUser.id)
    .maybeSingle();

  if (existingUser?.tenant_id) {
    console.log(`User ${clerkUser.id} already exists, returning existing tenant`);
    return existingUser.tenant_id;
  }

  // 2. Generar slug y nombre del tenant
  const slug = generateSlug(clerkUser.email);
  const tenantName = generateTenantName(clerkUser.email);
  const firstName = (clerkUser.firstName || '').substring(0, 100);
  const lastName = (clerkUser.lastName || '').substring(0, 100);

  console.log(`Provisioning tenant for user ${clerkUser.id}: ${slug}`);

  // Variables para rollback
  let createdTenantId: string | null = null;
  let createdUserId: string | null = null;

  try {
    // 3. Crear tenant con configuración por defecto
    const tenantConfig = getTenantConfig();
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug: slug,
        ...tenantConfig,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error(
        `Failed to create tenant: ${tenantError?.message || 'Unknown error'}`
      );
    }

    createdTenantId = tenant.id;
    console.log(`Tenant created: ${tenant.id}`);

    // 4. Crear usuario asociado al tenant
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: clerkUser.id,
        tenant_id: tenant.id,
        email: clerkUser.email,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        is_active: true,
      })
      .select('id')
      .single();

    if (userError || !user) {
      // Si es error de duplicado (race condition), recuperar el tenant existente
      if (userError?.code === '23505') {
        console.warn(`User ${clerkUser.id} created by concurrent process`);
        const { data: existingAfterRace } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('clerk_user_id', clerkUser.id)
          .maybeSingle();

        if (existingAfterRace?.tenant_id) {
          // Limpiar el tenant huérfano que acabamos de crear
          await supabase.from('tenants').delete().eq('id', createdTenantId);
          return existingAfterRace.tenant_id;
        }
      }

      // Rollback tenant
      if (createdTenantId) {
        await supabase.from('tenants').delete().eq('id', createdTenantId);
      }
      throw new Error(
        `Failed to create user: ${userError?.message || 'Unknown error'}`
      );
    }

    createdUserId = user.id;
    console.log(`User created for tenant: ${tenant.id}`);

    // 5. Actualizar metadata de Clerk con tenant_id
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          tenant_id: tenant.id,
        },
      });
      console.log(`Clerk metadata updated for user: ${clerkUser.id}`);
    } catch (clerkError) {
      console.error('Error updating Clerk metadata:', clerkError);

      // Rollback user y tenant
      if (createdUserId) {
        await supabase.from('users').delete().eq('id', createdUserId);
      }
      if (createdTenantId) {
        await supabase.from('tenants').delete().eq('id', createdTenantId);
      }

      throw new Error(
        `Failed to update Clerk metadata: ${clerkError instanceof Error ? clerkError.message : 'Unknown error'}`
      );
    }

    return tenant.id;
  } catch (error) {
    console.error('Error in provisionTenantForUser:', error);
    throw error;
  }
}
