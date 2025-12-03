# Story 1.4: Seed Data de Tenant Demo

**Status:** done
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

- [x] **Task 1: Configurar Prisma para seed** (AC: #1, #2)
  - [x] 1.1 Verificar configuración de seed en `package.json`
  - [x] 1.2 Crear archivo `prisma/seed.ts`
  - [x] 1.3 Configurar tsx para ejecutar TypeScript (tsx ya instalado)
  - [x] 1.4 No se requirió instalar ts-node (se usó tsx existente)

- [x] **Task 2: Implementar seed de tenant y usuario** (AC: #1, #2)
  - [x] 2.1 Crear tenant "Demo Corp" con upsert (ID fijo para testing)
  - [x] 2.2 Crear usuario admin@demo.com con upsert
  - [x] 2.3 Usar clerk_user_id de prueba: `user_demo_development`

- [x] **Task 3: Documentar y testear** (AC: #1, #2)
  - [x] 3.1 README ya tenía documentación del seed
  - [x] 3.2 Testing: Ejecutar seed 2 veces sin errores - VERIFICADO
  - [x] 3.3 Verificar datos en logs de salida - VERIFICADO

> **Nota:** Tasks de empresas, contactos y facturas se moverán a Epic 2.

---

## Dev Notes

### Decisiones Arquitectónicas Aplicables

**ADR #1: Multi-Tenancy Strategy**
- El seed data debe tener un tenant_id fijo conocido para facilitar testing
- Todos los datos de ejemplo pertenecen al mismo tenant "demo"

**ADR #5: Stack Tecnológico**
- Usar Prisma seed con tsx para ejecutar TypeScript
- Supabase client para inserts (respetando RLS patterns)

### Stack Técnico Específico

| Dependencia | Versión Exacta | Uso |
|-------------|----------------|-----|
| tsx | 4.21.0 | Ejecutar TypeScript directamente (ya instalado) |
| @types/node | 20.x | Types para Node.js (ya instalado) |

### Configuración de package.json

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Instalación de Dependencias

```bash
# tsx y @types/node ya están instalados en el proyecto
# No se requiere instalación adicional
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
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "pnpm prisma db seed",
    "db:reset": "pnpm prisma migrate reset",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:seed": "vitest run prisma/seed.test.ts"
  }
}
```

### Dependencias a Instalar

```bash
# Dependencias de TypeScript ya están instaladas (tsx, @types/node)
# Solo se requiere instalar vitest para tests automatizados
pnpm add -D vitest@2.0.5 @vitest/coverage-v8@2.0.5
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

**Seed Scripts:**
- prisma/seed.ts (refactorizado en code review)
- prisma/seed-constants.ts (creado en code review)
- prisma/seed.test.ts (creado en code review)

**Configuration:**
- package.json (modificado - prisma.seed + scripts test)
- vitest.config.ts (creado en code review)

**Documentation:**
- README.md (sección de seed)

**Total:** 6 archivos

### Testing Commands
```bash
# Instalar dependencias de testing (para tests automatizados)
pnpm add -D vitest@2.0.5 @vitest/coverage-v8@2.0.5

# Ejecutar tests del seed
pnpm test:seed

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
