/**
 * Script de seed para Epic 1 - Solo tenant y usuario demo.
 * Companies, contacts e invoices se seedean en Epic 2.
 *
 * Este script es idempotente: puede ejecutarse múltiples veces sin
 * crear duplicados. Usa upsert basado en slug (no en ID).
 *
 * @module prisma/seed
 *
 * Ejecutar: pnpm prisma db seed
 *
 * @example
 * ```bash
 * # Primera ejecución - crea tenant y user
 * pnpm prisma db seed
 *
 * # Segunda ejecución - actualiza datos existentes (no duplica)
 * pnpm prisma db seed
 * ```
 */
import { createClient } from '@supabase/supabase-js';
import {
  TABLE_TENANTS,
  TABLE_USERS,
  DEMO_TENANT_ID,
  DEMO_USER_ID,
  DEMO_CLERK_USER_ID,
  DEMO_SLUG,
  DEMO_TENANT_NAME,
  DEMO_USER_EMAIL,
  DEMO_USER_FIRST_NAME,
  DEMO_USER_LAST_NAME,
  DEFAULT_TENANT_CONFIG,
  DEFAULT_USER_CONFIG,
} from './seed-constants';

/**
 * Valida que las variables de entorno requeridas estén configuradas.
 *
 * @throws {Error} Si falta alguna variable de entorno requerida
 *
 * @example
 * ```typescript
 * try {
 *   validateEnv();
 *   console.log('✅ Variables de entorno configuradas');
 * } catch (error) {
 *   console.error('❌ Faltan variables:', error.message);
 * }
 * ```
 */
function validateEnv(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nPlease configure them in .env.local`
    );
  }
}

/**
 * Función principal del seed script.
 *
 * Crea o actualiza:
 * 1. Tenant demo "Demo Corp" con slug "demo"
 * 2. Usuario admin "admin@demo.com"
 *
 * El script es idempotente - puede ejecutarse múltiples veces sin duplicados.
 * Si falla la creación del usuario, hace rollback del tenant.
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Si falla validación de env, creación de tenant o usuario
 *
 * @example
 * ```typescript
 * await main(); // Crea tenant + user
 * await main(); // Actualiza (no duplica)
 * ```
 */
async function main(): Promise<void> {
  console.log('🌱 Seed Epic 1: Tenant y Usuario Demo...\n');

  // ========================================
  // VALIDAR ENVIRONMENT VARIABLES
  // ========================================
  try {
    validateEnv();
    console.log('✅ Environment variables validated\n');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // ========================================
  // INICIALIZAR SUPABASE CLIENT
  // ========================================
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ========================================
  // 1. CREAR O ACTUALIZAR TENANT DEMO
  // ========================================
  console.log('📦 Creating/updating demo tenant...');

  const { data: tenant, error: tenantError } = await supabase
    .from(TABLE_TENANTS)
    .upsert(
      {
        id: DEMO_TENANT_ID,
        name: DEMO_TENANT_NAME,
        slug: DEMO_SLUG,
        ...DEFAULT_TENANT_CONFIG,
      },
      {
        onConflict: 'slug', // ✅ Upsert por slug, NO por id (idempotencia correcta)
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (tenantError) {
    console.error('❌ Error creating tenant:', tenantError);
    throw new Error(`Failed to create tenant: ${tenantError.message}`);
  }

  console.log(`✅ Tenant "${DEMO_TENANT_NAME}" created/updated (slug: ${DEMO_SLUG})\n`);

  // ========================================
  // 2. CREAR O ACTUALIZAR USUARIO ADMIN
  // ========================================
  console.log('👤 Creating/updating admin user...');

  const { data: user, error: userError } = await supabase
    .from(TABLE_USERS)
    .upsert(
      {
        id: DEMO_USER_ID,
        tenant_id: DEMO_TENANT_ID,
        clerk_user_id: DEMO_CLERK_USER_ID,
        email: DEMO_USER_EMAIL,
        first_name: DEMO_USER_FIRST_NAME,
        last_name: DEMO_USER_LAST_NAME,
        ...DEFAULT_USER_CONFIG,
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  // ========================================
  // ROLLBACK SI FALLA CREAR USUARIO
  // ========================================
  if (userError) {
    console.error('❌ Error creating user:', userError);
    console.log('🔄 Rolling back: Deleting tenant...');

    // Intentar eliminar tenant creado
    const { error: deleteError } = await supabase
      .from(TABLE_TENANTS)
      .delete()
      .eq('id', DEMO_TENANT_ID);

    if (deleteError) {
      console.error('⚠️  Warning: Failed to rollback tenant:', deleteError);
    } else {
      console.log('✅ Rollback successful: Tenant deleted');
    }

    throw new Error(`Failed to create user: ${userError.message}`);
  }

  console.log(`✅ User "${DEMO_USER_EMAIL}" created/updated\n`);

  // ========================================
  // RESUMEN
  // ========================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 SEED EPIC 1 COMPLETADO');
  console.log('═══════════════════════════════════════════');
  console.log(`
📊 Datos creados/actualizados:
   • 1 Tenant: ${DEMO_TENANT_NAME} (slug: ${DEMO_SLUG})
   • 1 Usuario: ${DEMO_USER_EMAIL} (role: ${DEFAULT_USER_CONFIG.role})

📝 Nota: Companies, contacts e invoices se seedean en Epic 2.

🔐 Para acceder al tenant demo:
   Usa Clerk con email: ${DEMO_USER_EMAIL}
   O configura ${DEMO_CLERK_USER_ID} en Clerk para bypass

📋 IDs fijos para testing:
   Tenant ID: ${DEMO_TENANT_ID}
   User ID: ${DEMO_USER_ID}
`);
}

/**
 * Ejecuta el seed script con manejo de errores.
 */
main()
  .catch((e) => {
    console.error('\n❌ SEED FAILED:', e.message);
    console.error('\nStack trace:', e.stack);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed finalizado.');
  });
