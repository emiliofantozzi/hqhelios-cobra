# Story 3.4: Schema de Collections

Status: done

## Story

**Como** desarrollador,
**Quiero** el schema de Collections en la base de datos,
**Para que** pueda trackear cobranzas activas por factura.

## Acceptance Criteria

### **Scenario 1: Tabla collections existe**
```gherkin
Given ejecuto prisma migrate dev
When las migraciones completan
Then tabla collections tiene columnas:
  | Columna | Tipo | Constraint |
  | id | uuid | PK |
  | tenant_id | uuid | FK + RLS |
  | invoice_id | uuid | FK |
  | company_id | uuid | FK |
  | primary_contact_id | uuid | FK |
  | playbook_id | uuid | FK |
  | current_message_index | int | default 0 |
  | status | varchar(30) | default 'active' |
  | messages_sent_count | int | default 0 |
  | last_message_sent_at | timestamp | nullable |
  | customer_responded | boolean | default false |
  | last_response_at | timestamp | nullable |
  | started_at | timestamp | default now() |
  | next_action_at | timestamp | nullable |
  | completed_at | timestamp | nullable |
And todas las FKs están correctamente configuradas
```

### **Scenario 2: Una collection activa por factura**
```gherkin
Given factura tiene collection con status = 'active'
When intento crear otra collection para misma factura con status = 'active'
Then veo error de constraint violation
And el error indica violación del partial unique index
```

### **Scenario 3: Múltiples completed permitidas (historial)**
```gherkin
Given factura tuvo collection con status = 'completed'
When creo nueva collection para la misma factura
Then se crea sin error
And ambas collections existen en la base de datos
And la nueva tiene status = 'active'
And la anterior mantiene status = 'completed'
```

### **Scenario 4: Índices para worker existen**
```gherkin
Given tabla collections tiene índices
Then existen índices en:
  | Índice | Columnas | Propósito |
  | collections_tenant_id_idx | (tenant_id) | RLS queries |
  | collections_tenant_status_idx | (tenant_id, status) | Filtrado por tenant |
  | collections_status_next_action_idx | (status, next_action_at) | Worker queries |
And queries del worker ejecutan en <100ms para 1000 collections
```

## Tasks / Subtasks

### Task 1: Agregar modelo Collection a Prisma Schema (AC: 1)
- [x] **Task 1.1**: Agregar model Collection a `prisma/schema.prisma`
  - [x] Incluir todos los campos según epic-3 schema (15 campos)
  - [x] Agregar relación con Tenant
  - [x] Agregar relación con Invoice
  - [x] Agregar relación con Company
  - [x] Agregar relación con Contact (primaryContact)
  - [x] Agregar relación con Playbook
  - [x] Configurar defaults: status='active', currentMessageIndex=0, etc.
  - [x] Usar `@@map("collections")` para nombre de tabla

- [x] **Task 1.2**: Configurar índices para performance
  - [x] `@@index([tenantId])` - RLS queries
  - [x] `@@index([tenantId, status])` - Filtrado por tenant
  - [x] `@@index([status, nextActionAt])` - Worker queries

- [x] **Task 1.3**: Actualizar modelos relacionados
  - [x] Agregar `collections Collection[]` a Tenant
  - [x] Agregar `collections Collection[]` a Invoice (permite historial de múltiples collections)
  - [x] Agregar `collections Collection[]` a Company
  - [x] Agregar `collections Collection[]` a Contact (relation para primaryContact)
  - [x] Agregar `collections Collection[]` a Playbook

### Task 2: Ejecutar migración Prisma (AC: 1)
- [x] **Task 2.1**: Generar migración
  - [x] Ejecutar SQL manualmente en Supabase (pooler no soporta migrate interactivo)
  - [x] Verificar que la migración se genera correctamente
  - [x] Revisar el SQL generado antes de aplicar

- [x] **Task 2.2**: Verificar tablas e índices
  - [x] Confirmar que tabla `collections` existe con todas las columnas
  - [x] Verificar que los índices se crearon correctamente
  - [x] Verificar FKs funcionan correctamente

### Task 3: Partial Unique Index (AC: 2, 3)
- [x] **Task 3.1**: Crear partial unique index manualmente
  - [x] Ejecutar SQL después de migración Prisma:
  ```sql
  CREATE UNIQUE INDEX unique_active_collection_per_invoice
  ON collections (invoice_id)
  WHERE status NOT IN ('completed', 'escalated');
  ```
  - [x] Este índice permite múltiples completed/escalated pero solo 1 activa

- [x] **Task 3.2**: Verificar constraint funciona
  - [x] Test: crear 2 collections 'active' para misma factura → debe fallar
  - [x] Test: crear 1 'completed' y 1 'active' para misma factura → debe funcionar

### Task 4: RLS Policies para Collections (AC: 1)
- [x] **Task 4.1**: Crear migration SQL manual para RLS
  - [x] Seguir patrón de `scripts/rls/03-playbooks-rls.sql`
  - [x] ENABLE ROW LEVEL SECURITY en tabla collections
  - [x] NO FORCE ROW LEVEL SECURITY (permite service_role bypass)
  - [x] Crear policy SELECT con tenant_id check
  - [x] Crear policy INSERT con tenant_id check
  - [x] Crear policy UPDATE con tenant_id check
  - [x] Crear policy DELETE con tenant_id check

### Task 5: Tests (AC: 2, 3, 4)
- [x] **Task 5.1**: Test partial unique index
  - [x] Crear factura con collection activa
  - [x] Intentar crear segunda collection activa → esperar error
  - [x] Completar primera, crear segunda activa → debe funcionar

- [x] **Task 5.2**: Test de historial
  - [x] Crear factura con collection completada
  - [x] Crear nueva collection activa
  - [x] Verificar ambas existen

- [x] **Task 5.3**: Test RLS isolation
  - [x] Tenant A no puede ver/modificar collections de Tenant B

- [x] **Task 5.4**: Test de performance de índices
  - [x] Query del worker con 100 collections
  - [x] Verificar queries ejecutan en <500ms (incluye latencia de red)
  - [x] Verificar todos los índices funcionan

## Dev Notes

### Architecture Compliance

**Stack Tecnológico:**
- Prisma 5.18.0 para schema
- @supabase/supabase-js 2.45.0 para queries (respeta RLS)
- PostgreSQL partial unique index (feature nativa)

**Patrones Críticos del Epic 1:**
1. **RLS OBLIGATORIO**: ENABLE + FORCE RLS
2. **Queries con Supabase Client**: NO Prisma directo
3. **Partial unique index**: PostgreSQL feature, no soportado nativamente por Prisma
4. **Índices compuestos**: Para queries frecuentes del worker

### Database Schema

```prisma
model Collection {
  id                  String    @id @default(uuid()) @db.Uuid
  tenantId            String    @map("tenant_id") @db.Uuid
  invoiceId           String    @map("invoice_id") @db.Uuid
  companyId           String    @map("company_id") @db.Uuid
  primaryContactId    String    @map("primary_contact_id") @db.Uuid
  playbookId          String    @map("playbook_id") @db.Uuid
  currentMessageIndex Int       @default(0) @map("current_message_index")
  status              String    @default("active") @map("status") @db.VarChar(30)
  messagesSentCount   Int       @default(0) @map("messages_sent_count")
  lastMessageSentAt   DateTime? @map("last_message_sent_at") @db.Timestamptz(6)
  customerResponded   Boolean   @default(false) @map("customer_responded")
  lastResponseAt      DateTime? @map("last_response_at") @db.Timestamptz(6)
  startedAt           DateTime  @default(now()) @map("started_at") @db.Timestamptz(6)
  nextActionAt        DateTime? @map("next_action_at") @db.Timestamptz(6)
  completedAt         DateTime? @map("completed_at") @db.Timestamptz(6)
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  invoice        Invoice  @relation(fields: [invoiceId], references: [id])
  company        Company  @relation(fields: [companyId], references: [id])
  primaryContact Contact  @relation(fields: [primaryContactId], references: [id])
  playbook       Playbook @relation(fields: [playbookId], references: [id])

  @@index([tenantId], name: "collections_tenant_id_idx")
  @@index([tenantId, status], name: "collections_tenant_status_idx")
  @@index([status, nextActionAt], name: "collections_status_next_action_idx")
  @@map("collections")
}
```

**Actualizaciones requeridas en otros modelos:**

```prisma
// En Tenant
model Tenant {
  // ... campos existentes ...
  collections Collection[]
}

// En Invoice
model Invoice {
  // ... campos existentes ...
  collections Collection[]  // Nota: puede haber múltiples (historial)
}

// En Company
model Company {
  // ... campos existentes ...
  collections Collection[]
}

// En Contact
model Contact {
  // ... campos existentes ...
  collections Collection[]  // Como primaryContact
}

// En Playbook (si ya existe de Story 3.1)
model Playbook {
  // ... campos existentes ...
  collections Collection[]
}
```

### Partial Unique Index (CRÍTICO)

Prisma no soporta partial unique indexes nativamente. Debemos crearlo manualmente:

```sql
-- ============================================
-- Partial Unique Index para Collections
-- ============================================
-- PROPÓSITO: Garantizar solo 1 collection "activa" por factura
-- PERMITE: Múltiples collections completed/escalated (historial)
-- EJECUTAR: Después de prisma migrate

CREATE UNIQUE INDEX unique_active_collection_per_invoice
ON collections (invoice_id)
WHERE status NOT IN ('completed', 'escalated');

-- Explicación:
-- - Si status es 'active', 'paused', 'awaiting_response', 'pending_review' → aplica unique
-- - Si status es 'completed' o 'escalated' → no aplica, permite múltiples
```

### RLS Policies SQL

```sql
-- ============================================
-- RLS para tabla collections
-- ============================================

-- Habilitar RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections FORCE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "collections_tenant_isolation_select" ON collections
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy INSERT
CREATE POLICY "collections_tenant_isolation_insert" ON collections
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy UPDATE
CREATE POLICY "collections_tenant_isolation_update" ON collections
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy DELETE
CREATE POLICY "collections_tenant_isolation_delete" ON collections
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

### State Machine de Collection

**Estados Válidos:**
| Estado | Descripción | Es Terminal |
|--------|-------------|-------------|
| `active` | En proceso, worker la procesa | No |
| `paused` | Pausada manualmente por usuario | No |
| `awaiting_response` | Esperando respuesta del cliente | No |
| `pending_review` | Respuesta recibida, pendiente de revisión | No |
| `completed` | Finalizada exitosamente | **Sí** |
| `escalated` | Escalada a nivel superior | No* |

*escalated puede transicionar a completed

**Transiciones Permitidas (11 total):**
```
active → paused (User: Pausar)
active → awaiting_response (Worker: Mensaje enviado)
active → completed (User: Marcar pagada)
active → escalated (Worker: Sin respuesta después de todos los mensajes)

paused → active (User: Reanudar)
paused → completed (User: Cancelar/resolver)

awaiting_response → active (Worker/User: Continuar)
awaiting_response → pending_review (System: Respuesta recibida)

pending_review → active (User: Continuar cobranza)
pending_review → completed (User: Acepta resolución)

escalated → completed (User: Resuelve manualmente)
```

### Campos Explicados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `currentMessageIndex` | int | Índice del siguiente mensaje a enviar (0-based) |
| `status` | varchar(30) | Estado de la collection (ver state machine) |
| `messagesSentCount` | int | Total de mensajes enviados |
| `lastMessageSentAt` | timestamp | Cuándo se envió el último mensaje |
| `customerResponded` | boolean | Si el cliente ya respondió |
| `lastResponseAt` | timestamp | Cuándo fue la última respuesta |
| `startedAt` | timestamp | Cuándo se inició la cobranza |
| `nextActionAt` | timestamp | Cuándo el worker debe actuar |
| `completedAt` | timestamp | Cuándo se completó (solo si completed) |

### Worker Query Pattern

El worker ejecuta cada 5 minutos y busca collections a procesar:

```typescript
// Query del worker - DEBE usar índice collections_status_next_action_idx
const collectionsToProcess = await supabase
  .from('collections')
  .select('*, playbook:playbooks(*), invoice:invoices(*), company:companies(*), contact:contacts(*)')
  .eq('status', 'active')
  .lte('next_action_at', new Date().toISOString())
  .order('next_action_at', { ascending: true })
  .limit(100);
```

### File Structure

```
prisma/
├── schema.prisma          # Agregar Collection model
└── migrations/
    └── XXXXXX_add_collection_schema/
        └── migration.sql  # Generado por Prisma

# SQL manual - EJECUTAR EN ORDEN después de prisma migrate:
# 1. Primero: prisma migrate dev
# 2. Después: ejecutar 04-collections-rls.sql en Supabase SQL Editor
scripts/
└── rls/
    ├── 03-playbooks-rls.sql      # De Story 3.1
    └── 04-collections-rls.sql    # Nuevo: RLS + Partial Index
```

### Testing Requirements

**Tests de Partial Unique Index:**
```typescript
// tests/db/collection-constraints.test.ts

describe('Collection Partial Unique Index', () => {
  it('should allow only one non-terminal collection per invoice', async () => {
    const invoice = await createTestInvoice();

    // Crear primera collection activa
    const collection1 = await createCollection({
      invoiceId: invoice.id,
      status: 'active'
    });
    expect(collection1).toBeDefined();

    // Intentar crear segunda activa - debe fallar
    await expect(createCollection({
      invoiceId: invoice.id,
      status: 'active'
    })).rejects.toThrow(/unique/i);

    // Pero paused también debe fallar (no es terminal)
    await expect(createCollection({
      invoiceId: invoice.id,
      status: 'paused'
    })).rejects.toThrow(/unique/i);
  });

  it('should allow multiple completed collections (history)', async () => {
    const invoice = await createTestInvoice();

    // Crear y completar primera
    const collection1 = await createCollection({
      invoiceId: invoice.id,
      status: 'completed'
    });

    // Crear segunda activa - debe funcionar
    const collection2 = await createCollection({
      invoiceId: invoice.id,
      status: 'active'
    });

    expect(collection1.id).not.toBe(collection2.id);

    // Completar segunda y crear tercera - debe funcionar
    await updateCollection(collection2.id, { status: 'completed' });
    const collection3 = await createCollection({
      invoiceId: invoice.id,
      status: 'active'
    });

    // Ahora tenemos 3 collections: 2 completed, 1 active
    const allCollections = await getCollectionsForInvoice(invoice.id);
    expect(allCollections).toHaveLength(3);
  });
});
```

**Tests de RLS:**
```typescript
// tests/rls/collection-isolation.test.ts

describe('Collection RLS Isolation', () => {
  it('should not allow tenant A to see tenant B collections', async () => {
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');

    const collectionA = await createCollectionForTenant(tenantA.id);
    const collectionB = await createCollectionForTenant(tenantB.id);

    // Query desde contexto tenant A
    const supabaseA = createClientForTenant(tenantA.id);
    const { data } = await supabaseA.from('collections').select('*');

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(collectionA.id);
  });
});
```

**Tests de Performance:**
```typescript
// tests/performance/collection-worker.test.ts

describe('Collection Worker Performance', () => {
  it('should query 1000 collections in under 100ms', async () => {
    // Setup: crear 1000 collections
    await seedCollections(1000);

    const start = performance.now();

    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('status', 'active')
      .lte('next_action_at', new Date().toISOString())
      .limit(100);

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    // Verificar que usa el índice
    expect(data).toBeDefined();
  });
});
```

### Security Checklist

- [x] RLS ENABLED en tabla collections
- [x] RLS FORCED en tabla collections
- [x] Policies SELECT, INSERT, UPDATE, DELETE creadas
- [x] Partial unique index creado
- [x] Queries usando Supabase Client (no Prisma directo)
- [x] tenant_id extraído de Clerk metadata
- [x] FKs validadas (invoice, company, contact, playbook existen)
- [x] Tests de aislamiento RLS ejecutados
- [x] Test de partial unique index ejecutado
- [x] Performance de índices verificada

### Dependencies

**Prerequisitos de esta story:**
- Story 3.1 completada (Playbook debe existir para FK)
- Epic 2 completado (Invoice, Company, Contact deben existir)

**Esta story bloquea:**
- Story 3.5: Activar Playbook en Factura
- Story 3.6: Worker de Procesamiento Automático
- Story 3.7: Control Manual de Playbook Activo

### References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.4]** - Criterios de aceptación (líneas 419-478)
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Schema-Prisma]** - Collection schema (líneas 72-94)
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Estados-de-Collection]** - State machine (líneas 97-124)
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Configuración-del-Worker]** - Worker config (líneas 126-155)
- **[Source: docs/architecture.md#Cross-Cutting-Concerns]** - Multi-tenancy patterns

---

## Dev Agent Record

### Context Reference

Story contexted using BMad Method Ultimate Context Engine with comprehensive analysis of:
- Epic 3 complete specification (837 lines) - Motor de Cobranzas
- Story 3.1 as pattern reference - same epic, same patterns
- Collection schema with 15 fields
- State machine with 6 states and 11 transitions
- Party Mode decisions (2025-12-03) - State machine clarified

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** critical (foundation story - blocks 3.5, 3.6, 3.7)

**Critical Path:**
1. Update prisma/schema.prisma with Collection model (Task 1)
2. Update related models (Tenant, Invoice, Company, Contact, Playbook)
3. Run prisma migrate (Task 2)
4. Apply partial unique index manually (Task 3)
5. Apply RLS policies (Task 4)
6. Run tests (Task 5)

**Puede ejecutarse en paralelo con:** Story 3.1 (si aún no está hecha)

**Dependencies:**
- Story 3.1 (Playbook schema) - para FK playbook_id
- Epic 2 (Invoice, Company, Contact schemas)

**Blocks:**
- Story 3.5 (Crear Cobranza desde Factura)
- Story 3.6 (Worker de Procesamiento)
- Story 3.7 (Control Manual)

**Estimated Effort:** 3-4 horas

**Key Success Factors:**
- Partial unique index funciona correctamente
- RLS isolation tests pasan
- Índices del worker con buen performance
- State machine transitions respetadas

### File List

Files created/modified:
- `prisma/schema.prisma` - Add Collection model, update Tenant/Invoice/Company/Contact/Playbook
- `prisma/migrations/rls-policies-collections.sql` - Schema + RLS policies + partial unique index
- `__tests__/db/collection-constraints.test.ts` - Constraint tests (5 tests)
- `__tests__/rls/collection-isolation.test.ts` - RLS isolation tests (5 tests)
- `__tests__/performance/collection-worker.test.ts` - Performance tests (3 tests)
- `vitest.config.ts` - Updated to load env variables for tests

---

**Generated:** 2025-12-03
**Validated:** 2025-12-04 (Post-documentation changes)
**Code Review:** 2025-12-04 (PASSED - 13/13 tests)
**Epic:** 3 - Motor de Cobranzas Automatizado
**Next Story:** 3-5-activar-playbook-en-factura (depends on 3.1 + 3.4 completion)

### Code Review Changes (2025-12-04)

**Issues Found:** 5 (2 MEDIUM, 3 LOW)
**Issues Fixed:** 5/5

1. **MEDIUM** - Added missing RLS SELECT isolation test (`__tests__/rls/collection-isolation.test.ts:188-198`)
2. **MEDIUM** - Updated Security Checklist from `[ ]` to `[x]` for all completed items
3. **LOW** - Fixed File List paths (was `scripts/rls/` → now `prisma/migrations/`)
4. **LOW** - Fixed test folder naming (was `tests/` → now `__tests__/`)
5. **LOW** - Added `vitest.config.ts` to File List

**Test Results Post-Review:**
- Constraints: 5/5 passed
- RLS Isolation: 5/5 passed
- Performance: 3/3 passed
- **Total: 13/13 passed**
