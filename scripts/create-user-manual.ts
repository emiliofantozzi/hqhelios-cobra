/**
 * Script para crear manualmente un usuario y tenant cuando el webhook falla
 * Uso: pnpm tsx scripts/create-user-manual.ts <clerk_user_id> <email>
 * Ejemplo: pnpm tsx scripts/create-user-manual.ts user_abc123 emilio@example.com
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';
import { randomUUID } from 'crypto';

// Cargar variables de entorno
config({ path: '.env.local' });

async function createUserManually(clerkUserId: string, email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno SUPABASE');
    process.exit(1);
  }

  if (!clerkSecretKey) {
    console.error('❌ Falta CLERK_SECRET_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const clerk = createClerkClient({ secretKey: clerkSecretKey });

  console.log('\n🔧 CREACIÓN MANUAL DE USUARIO\n');
  console.log('━'.repeat(50));
  console.log('Clerk User ID:', clerkUserId);
  console.log('Email:', email);
  console.log('━'.repeat(50));

  // 1. Verificar si el usuario ya existe
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existingUser) {
    console.log('\n✅ Usuario ya existe en Supabase');
    console.log('   Tenant ID:', existingUser.tenant_id);

    // Solo actualizar Clerk
    console.log('\n📤 Actualizando metadata en Clerk...');
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        tenant_id: existingUser.tenant_id,
      },
    });
    console.log('✅ Clerk metadata actualizado');
    console.log('\n🎉 Todo listo! Recarga la app.');
    return;
  }

  // 2. Crear tenant
  console.log('\n📦 Creando tenant...');
  const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const tenantName = `Tenant de ${email.split('@')[0]}`;
  const tenantId = randomUUID();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      id: tenantId,
      name: tenantName,
      slug: `${slug}-${Date.now()}`,
      timezone: 'America/Mexico_City',
      default_currency: 'USD',
      plan_type: 'trial',
      is_active: true,
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Error creando tenant:', tenantError);
    process.exit(1);
  }
  console.log('✅ Tenant creado:', tenant.id);

  // 3. Crear usuario
  console.log('\n👤 Creando usuario...');
  const userId = randomUUID();
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      clerk_user_id: clerkUserId,
      tenant_id: tenant.id,
      email: email,
      first_name: email.split('@')[0],
      last_name: '',
      role: 'admin',
      is_active: true,
    })
    .select()
    .single();

  if (userError || !user) {
    // Rollback tenant
    await supabase.from('tenants').delete().eq('id', tenant.id);
    console.error('❌ Error creando usuario:', userError);
    process.exit(1);
  }
  console.log('✅ Usuario creado:', user.id);

  // 4. Actualizar Clerk metadata
  console.log('\n📤 Actualizando metadata en Clerk...');
  try {
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        tenant_id: tenant.id,
      },
    });
    console.log('✅ Clerk metadata actualizado');
  } catch (clerkError) {
    console.error('❌ Error actualizando Clerk:', clerkError);
    console.log('\n⚠️  Usuario creado en Supabase pero Clerk no actualizado');
    console.log('   Actualiza manualmente en Clerk Dashboard:');
    console.log(`   Public metadata: { "tenant_id": "${tenant.id}" }`);
    process.exit(1);
  }

  console.log('\n' + '━'.repeat(50));
  console.log('🎉 ¡COMPLETADO!');
  console.log('━'.repeat(50));
  console.log(`
  Tenant ID: ${tenant.id}
  User ID: ${user.id}

  Ahora recarga la aplicación y el error debería desaparecer.
  `);
}

// Obtener argumentos
const clerkUserId = process.argv[2];
const email = process.argv[3];

if (!clerkUserId || !email) {
  console.log(`
  Uso: pnpm tsx scripts/create-user-manual.ts <clerk_user_id> <email>

  Ejemplo:
  pnpm tsx scripts/create-user-manual.ts user_2abc123XYZ emilio@example.com

  Puedes encontrar tu clerk_user_id en:
  Clerk Dashboard → Users → Tu usuario → User ID
  `);
  process.exit(1);
}

createUserManually(clerkUserId, email).catch(console.error);
