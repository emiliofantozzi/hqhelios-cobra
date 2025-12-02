/**
 * Script para validar aislamiento RLS entre tenants.
 * Ejecutar: npx tsx scripts/test-rls-isolation.ts
 *
 * Nota: Usa service_role para setup/cleanup y anon key para verificar RLS.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing environment variables (SUPABASE_URL, SERVICE_ROLE_KEY, ANON_KEY)');
  process.exit(1);
}

// Cliente admin para setup/cleanup (bypassa RLS)
const adminClient = createClient(supabaseUrl!, supabaseServiceKey!);

// Cliente anon para verificar RLS (respeta RLS)
const anonClient = createClient(supabaseUrl!, supabaseAnonKey!);

async function testRlsIsolation() {
  console.log('🧪 Iniciando test de aislamiento RLS...\n');
  console.log('   Admin client: service_role (bypassa RLS para setup)');
  console.log('   Test client: anon key (respeta RLS)\n');

  // 1. Crear 2 tenants de prueba
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();

  console.log('📝 Creando tenants de prueba (con admin)...');
  console.log(`   Tenant A: ${tenantAId}`);
  console.log(`   Tenant B: ${tenantBId}`);

  const { error: tenantError } = await adminClient.from('tenants').insert([
    { id: tenantAId, name: 'Tenant A Test', slug: `test-a-${Date.now()}` },
    { id: tenantBId, name: 'Tenant B Test', slug: `test-b-${Date.now()}` },
  ]);

  if (tenantError) {
    console.error('❌ Error creando tenants:', tenantError.message);
    process.exit(1);
  }
  console.log('✅ Tenants creados\n');

  // 2. Insertar usuario en Tenant A
  console.log('👤 Creando usuario en Tenant A (con admin)...');
  const userAId = randomUUID();
  const { error: userError } = await adminClient.from('users').insert({
    id: userAId,
    tenant_id: tenantAId,
    clerk_user_id: `test_clerk_${Date.now()}`,
    email: 'test@tenant-a.com',
    first_name: 'Test',
    last_name: 'User A',
  });

  if (userError) {
    console.error('❌ Error creando usuario:', userError.message);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }
  console.log('✅ Usuario creado en Tenant A\n');

  // 3. TEST AC2: Query con contexto de Tenant B usando RPC
  console.log('🔍 Test AC2: Query usuarios con contexto de Tenant B (anon)...');

  const { data: usersBFromB, error: queryBError } = await anonClient.rpc(
    'query_users_with_tenant',
    { p_tenant_id: tenantBId }
  );

  if (queryBError) {
    console.error('❌ Error en query:', queryBError.message);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  if (!usersBFromB || usersBFromB.length === 0) {
    console.log('✅ PASS AC2: Tenant B no puede ver usuarios de Tenant A\n');
  } else {
    console.log('❌ FAIL AC2: Tenant B puede ver datos de otro tenant!');
    console.log('   Usuarios encontrados:', usersBFromB);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  // 4. TEST AC2: Query con contexto de Tenant A
  console.log('🔍 Test AC2: Query usuarios con contexto de Tenant A (anon)...');

  const { data: usersFromA, error: queryAError } = await anonClient.rpc(
    'query_users_with_tenant',
    { p_tenant_id: tenantAId }
  );

  if (queryAError) {
    console.error('❌ Error en query:', queryAError.message);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  if (usersFromA && usersFromA.length === 1) {
    console.log('✅ PASS AC2: Tenant A puede ver su propio usuario\n');
  } else {
    console.log('❌ FAIL AC2: Tenant A no puede ver su usuario');
    console.log('   Usuarios encontrados:', usersFromA);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  // 5. TEST AC3: Query con UUID que no existe
  console.log('🔍 Test AC3: Query con tenant_id inexistente (anon)...');

  const fakeId = randomUUID();
  const { data: usersNoContext } = await anonClient.rpc(
    'query_users_with_tenant',
    { p_tenant_id: fakeId }
  );

  if (!usersNoContext || usersNoContext.length === 0) {
    console.log('✅ PASS AC3: Query con tenant inexistente retorna vacio\n');
  } else {
    console.log('❌ FAIL AC3: Query retorno datos inesperados');
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  // 6. TEST AC2: Verificar aislamiento de tenants table
  console.log('🔍 Test AC2: Verificar aislamiento tabla tenants (anon)...');

  const { data: tenantsFromA } = await anonClient.rpc('query_tenants_with_tenant', {
    p_tenant_id: tenantAId,
  });

  const { data: tenantsFromB } = await anonClient.rpc('query_tenants_with_tenant', {
    p_tenant_id: tenantBId,
  });

  if (
    tenantsFromA?.length === 1 &&
    tenantsFromA[0].id === tenantAId &&
    tenantsFromB?.length === 1 &&
    tenantsFromB[0].id === tenantBId
  ) {
    console.log('✅ PASS AC2: Cada tenant solo ve su propio registro\n');
  } else {
    console.log('❌ FAIL AC2: Aislamiento de tenants incorrecto');
    console.log('   Tenants desde A:', tenantsFromA);
    console.log('   Tenants desde B:', tenantsFromB);
    await cleanup(tenantAId, tenantBId);
    process.exit(1);
  }

  // 7. Limpieza
  await cleanup(tenantAId, tenantBId);

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ TODOS LOS TESTS DE AISLAMIENTO RLS PASARON');
  console.log('');
  console.log('   AC1: Migraciones ejecutadas ✓ (tablas existen)');
  console.log('   AC2: Aislamiento de datos funciona ✓');
  console.log('   AC3: Queries sin tenant valido retornan vacio ✓');
  console.log('═══════════════════════════════════════════════════════');
}

async function cleanup(tenantAId: string, tenantBId: string) {
  console.log('🧹 Limpiando datos de prueba (con admin)...');
  await adminClient.from('users').delete().eq('tenant_id', tenantAId);
  await adminClient.from('users').delete().eq('tenant_id', tenantBId);
  await adminClient.from('tenants').delete().in('id', [tenantAId, tenantBId]);
  console.log('✅ Datos de prueba eliminados\n');
}

testRlsIsolation().catch((err) => {
  console.error('Error en test:', err);
  process.exit(1);
});
