/**
 * Seed Script para Epic 2 - Companies y Contacts demo.
 *
 * Este script crea datos de ejemplo para desarrollo y testing:
 * - 5 empresas con diferentes niveles de riesgo
 * - 2-3 contactos por empresa
 *
 * Prerequisito: Ejecutar primero seed.ts (Epic 1) para crear tenant demo.
 *
 * @module prisma/seed-epic2
 *
 * Ejecutar: pnpm db:seed:epic2
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  DEMO_TENANT_ID,
  DEMO_SLUG,
} from './seed-constants';

// =============================================
// CONSTANTES DE SEED EPIC 2
// =============================================

const TABLE_COMPANIES = 'companies';
const TABLE_CONTACTS = 'contacts';

/**
 * Empresas demo para desarrollo
 */
const DEMO_COMPANIES = [
  {
    name: 'Acme Corporation',
    tax_id: 'ACM123456789',
    email: 'cobranza@acme.com',
    phone: '+52 55 1234 5678',
    address: 'Av. Reforma 123, CDMX',
    industry: 'Tecnología',
    payment_terms_days: 30,
    risk_level: 'bajo',
  },
  {
    name: 'Industrias del Norte SA',
    tax_id: 'IDN987654321',
    email: 'pagos@industriasnorte.mx',
    phone: '+52 81 9876 5432',
    address: 'Blvd. Industrial 456, Monterrey',
    industry: 'Manufactura',
    payment_terms_days: 45,
    risk_level: 'medio',
  },
  {
    name: 'Servicios Globales MX',
    tax_id: 'SGM456789123',
    email: 'finanzas@serviciosglobales.mx',
    phone: '+52 33 4567 8901',
    address: 'Calle López Mateos 789, Guadalajara',
    industry: 'Servicios',
    payment_terms_days: 60,
    risk_level: 'alto',
  },
  {
    name: 'Constructora Moderna',
    tax_id: 'COM321654987',
    email: 'contabilidad@constructoramoderna.com',
    phone: '+52 55 3216 5498',
    address: 'Periférico Sur 1010, CDMX',
    industry: 'Construcción',
    payment_terms_days: 30,
    risk_level: 'medio',
  },
  {
    name: 'Tech Solutions LATAM',
    tax_id: 'TSL789123456',
    email: 'billing@techsolutions.lat',
    phone: '+52 55 7891 2345',
    address: 'Santa Fe 2020, CDMX',
    industry: 'Software',
    payment_terms_days: 15,
    risk_level: 'bajo',
  },
];

/**
 * Contactos demo (se asignarán a las empresas creadas)
 */
const DEMO_CONTACTS_TEMPLATE = [
  // Contactos para Acme (índice 0)
  [
    {
      first_name: 'María',
      last_name: 'González',
      email: 'maria.gonzalez@acme.com',
      phone: '+52 55 1111 1111',
      position: 'Gerente de Finanzas',
      is_primary_contact: true,
      is_escalation_contact: false,
    },
    {
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      email: 'carlos.rodriguez@acme.com',
      phone: '+52 55 1111 2222',
      position: 'Contador Senior',
      is_primary_contact: false,
      is_escalation_contact: true,
    },
  ],
  // Contactos para Industrias del Norte (índice 1)
  [
    {
      first_name: 'Ana',
      last_name: 'Martínez',
      email: 'ana.martinez@industriasnorte.mx',
      phone: '+52 81 2222 1111',
      position: 'Directora Administrativa',
      is_primary_contact: true,
      is_escalation_contact: true, // En PyME es la misma persona
    },
    {
      first_name: 'Roberto',
      last_name: 'López',
      email: 'roberto.lopez@industriasnorte.mx',
      phone: '+52 81 2222 2222',
      position: 'Asistente Contable',
      is_primary_contact: false,
      is_escalation_contact: false,
    },
  ],
  // Contactos para Servicios Globales (índice 2)
  [
    {
      first_name: 'Patricia',
      last_name: 'Hernández',
      email: 'patricia.hernandez@serviciosglobales.mx',
      phone: '+52 33 3333 1111',
      position: 'CFO',
      is_primary_contact: true,
      is_escalation_contact: false,
    },
    {
      first_name: 'Luis',
      last_name: 'García',
      email: 'luis.garcia@serviciosglobales.mx',
      phone: '+52 33 3333 2222',
      position: 'Controller',
      is_primary_contact: false,
      is_escalation_contact: true,
    },
    {
      first_name: 'Sandra',
      last_name: 'Pérez',
      email: 'sandra.perez@serviciosglobales.mx',
      phone: '+52 33 3333 3333',
      position: 'Tesorera',
      is_primary_contact: false,
      is_escalation_contact: false,
    },
  ],
  // Contactos para Constructora Moderna (índice 3)
  [
    {
      first_name: 'Jorge',
      last_name: 'Ramírez',
      email: 'jorge.ramirez@constructoramoderna.com',
      phone: '+52 55 4444 1111',
      position: 'Director General',
      is_primary_contact: true,
      is_escalation_contact: true,
    },
  ],
  // Contactos para Tech Solutions (índice 4)
  [
    {
      first_name: 'Diana',
      last_name: 'Torres',
      email: 'diana.torres@techsolutions.lat',
      phone: '+52 55 5555 1111',
      position: 'VP Finance',
      is_primary_contact: true,
      is_escalation_contact: false,
    },
    {
      first_name: 'Miguel',
      last_name: 'Sánchez',
      email: 'miguel.sanchez@techsolutions.lat',
      phone: '+52 55 5555 2222',
      position: 'Accounts Payable Manager',
      is_primary_contact: false,
      is_escalation_contact: true,
    },
  ],
];

/**
 * Valida variables de entorno
 */
function validateEnv(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}`
    );
  }
}

/**
 * Función principal del seed Epic 2
 */
async function main(): Promise<void> {
  console.log('🌱 Seed Epic 2: Companies y Contacts Demo...\n');

  // Validar env
  validateEnv();
  console.log('✅ Environment validated\n');

  // Crear cliente Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar que existe el tenant demo
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', DEMO_SLUG)
    .single();

  if (!tenant) {
    throw new Error(
      '❌ Tenant demo no encontrado. Ejecuta primero: pnpm prisma db seed'
    );
  }

  console.log(`✅ Tenant encontrado: ${tenant.name}\n`);

  // ========================================
  // CREAR EMPRESAS
  // ========================================
  console.log('📦 Creando empresas demo...');

  const companiesWithTenant = DEMO_COMPANIES.map((company) => ({
    id: randomUUID(),
    ...company,
    tenant_id: DEMO_TENANT_ID,
    is_active: true,
  }));

  const { data: companies, error: companiesError } = await supabase
    .from(TABLE_COMPANIES)
    .upsert(companiesWithTenant, {
      onConflict: 'tenant_id,tax_id',
      ignoreDuplicates: false,
    })
    .select();

  if (companiesError) {
    console.error('❌ Error creando empresas:', companiesError);
    throw companiesError;
  }

  console.log(`✅ ${companies?.length || 0} empresas creadas/actualizadas\n`);

  // ========================================
  // CREAR CONTACTOS
  // ========================================
  console.log('👥 Creando contactos demo...');

  let totalContacts = 0;

  for (let i = 0; i < (companies?.length || 0); i++) {
    const company = companies![i];
    const contactsTemplate = DEMO_CONTACTS_TEMPLATE[i] || [];

    for (const contactData of contactsTemplate) {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from(TABLE_CONTACTS)
        .select('id')
        .eq('company_id', company.id)
        .eq('email', contactData.email)
        .maybeSingle();

      if (existing) {
        console.log(`  ℹ️ Contacto ${contactData.email} ya existe, saltando...`);
        totalContacts++;
        continue;
      }

      const { error: contactError } = await supabase
        .from(TABLE_CONTACTS)
        .insert({
          id: randomUUID(),
          ...contactData,
          tenant_id: DEMO_TENANT_ID,
          company_id: company.id,
          is_active: true,
        });

      if (contactError) {
        console.warn(`⚠️ Error con contacto ${contactData.email}:`, contactError.message);
      } else {
        totalContacts++;
      }
    }
  }

  console.log(`✅ ${totalContacts} contactos creados\n`);

  // ========================================
  // RESUMEN
  // ========================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 SEED EPIC 2 COMPLETADO');
  console.log('═══════════════════════════════════════════');
  console.log(`
📊 Datos creados:
   • ${companies?.length || 0} Empresas
   • ${totalContacts} Contactos

📋 Empresas:
${companies?.map((c) => `   - ${c.name} (${c.risk_level})`).join('\n') || ''}

🔐 Para ver los datos:
   1. Inicia sesión en la app
   2. Ve a /companies
`);
}

// Ejecutar
main()
  .catch((e) => {
    console.error('\n❌ SEED EPIC 2 FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed Epic 2 finalizado.');
  });
