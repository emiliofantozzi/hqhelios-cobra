/**
 * Script de diagnóstico para verificar el estado del usuario
 * Uso: pnpm tsx scripts/diagnose-user.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
config({ path: '.env.local' });

async function diagnose(clerkUserId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno SUPABASE');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 DIAGNÓSTICO DE USUARIO\n');
  console.log('━'.repeat(50));

  // 1. Listar todos los usuarios en Supabase
  console.log('\n📋 Usuarios en Supabase:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, clerk_user_id, email, tenant_id, is_active');

  if (usersError) {
    console.error('❌ Error consultando usuarios:', usersError.message);
  } else if (users && users.length > 0) {
    console.table(users);
  } else {
    console.log('⚠️  No hay usuarios en la base de datos');
    console.log('   El webhook de Clerk probablemente no se ejecutó');
  }

  // 2. Listar todos los tenants
  console.log('\n📋 Tenants en Supabase:');
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, slug, is_active');

  if (tenantsError) {
    console.error('❌ Error consultando tenants:', tenantsError.message);
  } else if (tenants && tenants.length > 0) {
    console.table(tenants);
  } else {
    console.log('⚠️  No hay tenants en la base de datos');
  }

  // 3. Si se proporciona clerk_user_id específico
  if (clerkUserId) {
    console.log(`\n🔎 Buscando usuario con clerk_user_id: ${clerkUserId}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.log('❌ Usuario NO encontrado en Supabase');
      console.log('   Posibles causas:');
      console.log('   1. El webhook de Clerk no está configurado');
      console.log('   2. El webhook falló durante el registro');
      console.log('   3. El ID de Clerk es incorrecto');
    } else {
      console.log('✅ Usuario encontrado:');
      console.log('   Tenant ID:', user.tenant_id);
      console.log('   Email:', user.email);
      console.log('   Activo:', user.is_active);
      console.log('\n   Ahora debes actualizar Clerk con este tenant_id:');
      console.log(`   tenant_id: "${user.tenant_id}"`);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📝 SIGUIENTES PASOS:');
  console.log('━'.repeat(50));
  console.log(`
  Si hay datos en Supabase pero la app muestra error:
  1. Ve a Clerk Dashboard → Users → Tu usuario
  2. Edita "Public metadata" y añade:
     { "tenant_id": "<ID_DEL_TENANT_AQUÍ>" }
  3. Guarda y recarga la app

  Si NO hay datos en Supabase:
  1. Verifica que el webhook esté configurado en Clerk
  2. El endpoint debe ser: https://tu-dominio.com/api/webhooks/clerk
  3. Asegúrate que CLERK_WEBHOOK_SECRET esté configurado
  4. Re-registra el usuario o ejecuta el webhook manualmente
  `);
}

// Ejecutar con el primer argumento como clerk_user_id (opcional)
const clerkUserId = process.argv[2];
diagnose(clerkUserId).catch(console.error);
