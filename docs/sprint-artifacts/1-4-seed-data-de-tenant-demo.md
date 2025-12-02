# Story 1.4: Seed Data de Tenant Demo

**Status:** ready-for-dev
**Epic:** 1 - Foundation Setup
**Priority:** High (Facilita desarrollo y testing)

---

## Story

**Como** desarrollador,
**Quiero** seed data de tenant de prueba,
**Para que** pueda desarrollar y testear sin registrarme cada vez.

---

## Acceptance Criteria

### AC1: Seed crea tenant demo
```gherkin
Given ejecuto "pnpm prisma db seed"
When el script completa
Then existe tenant "Demo Corp" con slug "demo"
And existe usuario admin@demo.com con role "admin"
And el tenant demo está listo para desarrollo
```

### AC2: Seed es idempotente
```gherkin
Given el seed ya se ejecutó una vez
When ejecuto el seed nuevamente
Then no hay errores de duplicados
And los datos existentes se actualizan (upsert)
And no se crean registros duplicados
```

> **Nota:** El seed de companies, contacts e invoices se realizará en Epic 2 cuando existan esas tablas.

---

## Tasks / Subtasks

- [ ] **Task 1: Configurar Prisma para seed** (AC: #1, #2)
  - [ ] 1.1 Verificar configuración de seed en `package.json`
  - [ ] 1.2 Crear archivo `prisma/seed.ts`
  - [ ] 1.3 Configurar ts-node para ejecutar TypeScript
  - [ ] 1.4 Instalar dependencias necesarias (`pnpm add -D ts-node`)

- [ ] **Task 2: Implementar seed de tenant y usuario** (AC: #1, #2)
  - [ ] 2.1 Crear tenant "Demo Corp" con upsert (ID fijo para testing)
  - [ ] 2.2 Crear usuario admin@demo.com con upsert
  - [ ] 2.3 Usar clerk_user_id de prueba: `user_demo_development`

- [ ] **Task 3: Documentar y testear** (AC: #1, #2)
  - [ ] 3.1 Documentar cómo ejecutar seed en README
  - [ ] 3.2 Testing: Ejecutar seed 2 veces sin errores
  - [ ] 3.3 Verificar datos en Supabase Dashboard

> **Nota:** Tasks de empresas, contactos y facturas se moverán a Epic 2.

---

## Dev Notes

### Decisiones Arquitectónicas Aplicables

**ADR #1: Multi-Tenancy Strategy**
- El seed data debe tener un tenant_id fijo conocido para facilitar testing
- Todos los datos de ejemplo pertenecen al mismo tenant "demo"

**ADR #5: Stack Tecnológico**
- Usar Prisma seed con ts-node para TypeScript
- Supabase client para inserts (respetando RLS patterns)

### Stack Técnico Específico

| Dependencia | Versión Exacta | Uso |
|-------------|----------------|-----|
| ts-node | 10.9.2 | Ejecutar TypeScript directamente |
| @types/node | 20.x | Types para Node.js |

### Configuración de package.json

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Instalación de Dependencias

```bash
pnpm add -D ts-node
```

### Script de Seed Simplificado (prisma/seed.ts)

```typescript
/**
 * Script de seed para Epic 1 - Solo tenant y usuario demo.
 * Companies, contacts e invoices se seedean en Epic 2.
 *
 * @module prisma/seed
 *
 * Ejecutar: pnpm prisma db seed
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// IDs fijos para seed (UUID v4 válidos)
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_CLERK_USER_ID = 'user_demo_development';

async function main() {
  console.log('🌱 Seed Epic 1: Tenant y Usuario Demo...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ========================================
  // 1. CREAR TENANT DEMO
  // ========================================
  console.log('📦 Creando tenant demo...');

  const { error: tenantError } = await supabase.from('tenants').upsert(
    {
      id: DEMO_TENANT_ID,
      name: 'Demo Corp',
      slug: 'demo',
      timezone: 'America/Mexico_City',
      default_currency: 'USD',
      plan_type: 'trial',
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (tenantError) {
    console.error('Error creando tenant:', tenantError);
    throw tenantError;
  }
  console.log('✅ Tenant "Demo Corp" creado\n');

  // ========================================
  // 2. CREAR USUARIO ADMIN
  // ========================================
  console.log('👤 Creando usuario admin...');

  const { error: userError } = await supabase.from('users').upsert(
    {
      id: DEMO_USER_ID,
      tenant_id: DEMO_TENANT_ID,
      clerk_user_id: DEMO_CLERK_USER_ID,
      email: 'admin@demo.com',
      first_name: 'Admin',
      last_name: 'Demo',
      role: 'admin',
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (userError) {
    console.error('Error creando usuario:', userError);
    throw userError;
  }
  console.log('✅ Usuario admin@demo.com creado\n');

  // ========================================
  // RESUMEN
  // ========================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 SEED EPIC 1 COMPLETADO');
  console.log('═══════════════════════════════════════════');
  console.log(`
📊 Datos creados:
   • 1 Tenant: Demo Corp (slug: demo)
   • 1 Usuario: admin@demo.com (role: admin)

📝 Nota: Companies, contacts e invoices se seedean en Epic 2.

🔐 Para acceder al tenant demo:
   Usa Clerk con email: admin@demo.com
   O configura DEMO_CLERK_USER_ID en Clerk para bypass

📋 IDs fijos para testing:
   Tenant ID: ${DEMO_TENANT_ID}
   User ID: ${DEMO_USER_ID}
`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed finalizado.');
  });
```

---

## Project Structure Notes

### Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `prisma/seed.ts` | Crear | Script de seed (tenant + user) |
| `package.json` | Modificar | Agregar configuración de prisma.seed |
| `README.md` | Modificar | Documentar cómo ejecutar seed |

### Configuración de package.json

Agregar en `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "pnpm prisma db seed",
    "db:reset": "pnpm prisma migrate reset"
  }
}
```

### Dependencias a Instalar

```bash
pnpm add -D ts-node @types/node
```

---

## References

- [Source: docs/architecture.md#Schema de Base de Datos Completo]
- [Source: docs/prd.md#Historia 1.1.4: Seed Data de Tenant Demo]
- [Source: docs/epics/epic-1-foundation.md#Story 1.4]
- [Prisma Seeding Guide](https://www.prisma.io/docs/guides/migrate/seed-database)

---

## Dev Agent Record

### Context Reference
- Epic: docs/epics/epic-1-foundation.md
- Architecture: docs/architecture.md (Schema completo)
- PRD: docs/prd.md (Historia 1.1.4)
- Prerequisito: Stories 1.1, 1.2, 1.3 completadas (tablas deben existir)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List
- Los IDs son UUIDs fijos para facilitar testing y referencias
- El seed usa upsert para ser idempotente
- Para usar el tenant demo con Clerk, se necesita crear usuario en Clerk Dashboard con el mismo email
- Alternativamente, modificar DEMO_CLERK_USER_ID para que coincida con un usuario real de Clerk
- **Nota:** El seed de companies, contacts e invoices se realizará en Epic 2

### File List
- prisma/seed.ts
- package.json (modificar)

### Testing Commands
```bash
# Instalar dependencias
pnpm add -D ts-node @types/node

# Ejecutar seed (primera vez)
pnpm prisma db seed

# Ejecutar seed (idempotente - segunda vez)
pnpm prisma db seed

# Reset completo (elimina datos y re-aplica migraciones + seed)
pnpm prisma migrate reset

# Verificar datos en Supabase Dashboard
# Ir a: https://supabase.com/dashboard → proyecto → Table Editor
```

### Datos de Seed para Testing Manual

| Entidad | ID/Slug | Notas |
|---------|---------|-------|
| Tenant | demo | Demo Corp |
| Usuario | admin@demo.com | Role: admin |

> **Nota:** Companies, contacts e invoices se seedean en Epic 2.
