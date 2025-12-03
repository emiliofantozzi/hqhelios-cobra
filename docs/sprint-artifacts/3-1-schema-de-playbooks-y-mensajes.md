# Story 3.1: Schema de Playbooks y Mensajes

Status: done

## Story

**Como** desarrollador,
**Quiero** el schema de Playbooks y PlaybookMessages en la base de datos,
**Para que** pueda almacenar templates de workflows de cobranza.

## Acceptance Criteria

### **Scenario 1: Migraciones crean tablas**
```gherkin
Given ejecuto prisma migrate dev
When las migraciones completan
Then existen tablas:
  | Tabla | Columnas Clave |
  | playbooks | id, tenant_id, name, trigger_type, trigger_days, is_default |
  | playbook_messages | id, playbook_id, sequence_order, channel, temperature |
And todas las columnas tienen los tipos correctos según el schema
And los defaults están aplicados (is_active=true, is_default=false, wait_days=0)
```

### **Scenario 2: RLS aplicado correctamente**
```gherkin
Given RLS está habilitado en ambas tablas
When usuario de tenant A consulta playbooks
Then solo ve playbooks de tenant A
And no puede ver playbooks de tenant B
And las políticas aplican a SELECT, INSERT, UPDATE, DELETE
```

### **Scenario 3: Constraint de default único por trigger_type**
```gherkin
Given existe playbook con is_default=true y trigger_type='post_due' para tenant A
When intento crear otro playbook con is_default=true y trigger_type='post_due' para tenant A
Then veo error de constraint violation
And el error indica violación de unique constraint
```

### **Scenario 4: Sequence order único por playbook**
```gherkin
Given playbook tiene mensaje con sequence_order=1
When intento crear otro mensaje con sequence_order=1 para el mismo playbook
Then veo error de constraint violation
And el mensaje original permanece intacto
```

## Tasks / Subtasks

### Task 1: Agregar modelos a Prisma Schema (AC: 1)
- [x] **Task 1.1**: Agregar model Playbook a `prisma/schema.prisma`
  - [x] Incluir todos los campos según epic-3 schema
  - [x] Agregar relación con Tenant
  - [x] Agregar relación con PlaybookMessage[]
  - [x] Configurar `@@unique([tenantId, triggerType, isDefault])` - permite solo 1 default por trigger type por tenant
  - [x] Configurar `@@index([tenantId])`
  - [x] Usar `@@map("playbooks")` para nombre de tabla en snake_case

- [x] **Task 1.2**: Agregar model PlaybookMessage a `prisma/schema.prisma`
  - [x] Incluir todos los campos según epic-3 schema
  - [x] Agregar relación con Playbook (onDelete: Cascade)
  - [x] Configurar `@@unique([playbookId, sequenceOrder])`
  - [x] Configurar `@@index([playbookId])`
  - [x] Usar `@@map("playbook_messages")` para nombre de tabla

- [x] **Task 1.3**: Actualizar model Tenant
  - [x] Agregar `playbooks Playbook[]` a las relaciones del Tenant

### Task 2: Ejecutar migración Prisma (AC: 1)
- [x] **Task 2.1**: Generar migración
  - [x] Ejecutar SQL manual en Supabase SQL Editor
  - [x] Verificar que las tablas se crearon correctamente
  - [x] Sincronizar con `prisma db pull`

- [x] **Task 2.2**: Verificar tablas creadas
  - [x] Confirmar que tabla `playbooks` existe con todas las columnas
  - [x] Confirmar que tabla `playbook_messages` existe con todas las columnas
  - [x] Verificar que los índices se crearon correctamente

### Task 3: RLS Policies para Playbooks (AC: 2)
- [x] **Task 3.1**: Crear migration SQL manual para RLS en playbooks
  - [x] Crear archivo en `prisma/migrations/rls-policies-playbooks.sql`
  - [x] ENABLE ROW LEVEL SECURITY en tabla playbooks
  - [x] FORCE ROW LEVEL SECURITY en tabla playbooks
  - [x] Crear policy SELECT con tenant_id check
  - [x] Crear policy INSERT con tenant_id check
  - [x] Crear policy UPDATE con tenant_id check
  - [x] Crear policy DELETE con tenant_id check

### Task 4: RLS Policies para PlaybookMessages (AC: 2)
- [x] **Task 4.1**: Crear RLS policies para playbook_messages
  - [x] ENABLE ROW LEVEL SECURITY en tabla playbook_messages
  - [x] FORCE ROW LEVEL SECURITY en tabla playbook_messages
  - [x] Policy SELECT: JOIN con playbooks para verificar tenant_id
  - [x] Policy INSERT: validar que playbook_id pertenece al tenant
  - [x] Policy UPDATE: JOIN con playbooks para verificar tenant_id
  - [x] Policy DELETE: JOIN con playbooks para verificar tenant_id

### Task 5: Verificar Constraints (AC: 3, 4)
- [x] **Task 5.1**: Test de constraint default único
  - [x] Crear playbook con is_default=true, trigger_type='post_due'
  - [x] Intentar crear segundo playbook con mismos valores
  - [x] Verificar que falla con unique constraint violation

- [x] **Task 5.2**: Test de constraint sequence_order único
  - [x] Crear playbook con mensaje sequence_order=1
  - [x] Intentar crear otro mensaje con sequence_order=1 en mismo playbook
  - [x] Verificar que falla con unique constraint violation
  - [x] Verificar que mismo sequence_order funciona en playbooks diferentes

### Task 6: Tests de Aislamiento RLS (AC: 2)
- [x] **Task 6.1**: Test tenant A no ve datos de tenant B
  - [x] Crear playbook para tenant A
  - [x] Crear playbook para tenant B
  - [x] Query desde contexto tenant A
  - [x] Verificar que solo ve su playbook
  - [x] Repetir para mensajes

## Dev Notes

### Architecture Compliance

**Stack Tecnológico (Epic 1 + Architecture):**
- Next.js 14.2.13 (App Router ya establecido)
- React 18.3.1, TypeScript 5.4.5
- Prisma 5.18.0 para schema, @supabase/supabase-js 2.45.0 para queries
- Clerk 4.29.9 para auth (patterns ya establecidos en Epic 1)

**Patrones Críticos del Epic 1 (Retrospectiva):**
1. **RLS OBLIGATORIO**: ENABLE + FORCE RLS en ambas tablas
2. **Queries con Supabase Client**: NO usar Prisma directo (bypasea RLS)
3. **Índices compuestos**: `(tenant_id, ...)` para queries frecuentes
4. **Cascade delete**: PlaybookMessage se elimina al eliminar Playbook
5. **Soft delete preparado**: Campo `is_active` para futuro uso

**Errores a NO Repetir del Epic 1:**
- NO usar SECURITY DEFINER en funciones RPC (bypassea RLS)
- NO usar service role key en frontend
- NO olvidar FORCE RLS (solo ENABLE no es suficiente)
- NO asumir que Prisma respeta RLS (usar Supabase Client)

### Database Schema

```prisma
model Playbook {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  name            String   @db.VarChar(255)
  description     String?  @db.Text
  triggerType     String   @map("trigger_type") @db.VarChar(20) // pre_due, post_due, manual
  triggerDays     Int?     @map("trigger_days")
  isActive        Boolean  @default(true) @map("is_active")
  isDefault       Boolean  @default(false) @map("is_default")
  createdByUserId String?  @map("created_by_user_id") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  messages    PlaybookMessage[]

  // Solo 1 playbook default por trigger_type por tenant
  // Esto aplica solo cuando is_default=true
  @@unique([tenantId, triggerType, isDefault])
  @@index([tenantId])
  @@map("playbooks")
}

model PlaybookMessage {
  id                   String   @id @default(uuid()) @db.Uuid
  playbookId           String   @map("playbook_id") @db.Uuid
  sequenceOrder        Int      @map("sequence_order")
  channel              String   @db.VarChar(20) // email, whatsapp
  temperature          String   @db.VarChar(20) // amigable, firme, urgente
  subjectTemplate      String?  @map("subject_template") @db.Text // solo para email
  bodyTemplate         String   @map("body_template") @db.Text
  useAiGeneration      Boolean  @default(false) @map("use_ai_generation")
  aiInstructions       String?  @map("ai_instructions") @db.Text
  waitDays             Int      @default(0) @map("wait_days")
  sendOnlyIfNoResponse Boolean  @default(true) @map("send_only_if_no_response")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @default(now()) @updatedAt @map("updated_at")

  playbook Playbook @relation(fields: [playbookId], references: [id], onDelete: Cascade)

  // Solo 1 mensaje por sequence_order por playbook
  @@unique([playbookId, sequenceOrder])
  @@index([playbookId])
  @@map("playbook_messages")
}
```

**Actualización requerida en Tenant:**
```prisma
model Tenant {
  // ... campos existentes ...

  playbooks Playbook[]  // Agregar esta línea

  // ... resto del modelo ...
}
```

### RLS Policies SQL

```sql
-- ============================================
-- RLS para tabla playbooks
-- ============================================

-- Habilitar RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks FORCE ROW LEVEL SECURITY;

-- Policy SELECT: Solo ver playbooks del tenant actual
CREATE POLICY "playbooks_tenant_isolation_select" ON playbooks
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy INSERT: Solo insertar en tenant actual
CREATE POLICY "playbooks_tenant_isolation_insert" ON playbooks
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy UPDATE: Solo actualizar playbooks del tenant actual
CREATE POLICY "playbooks_tenant_isolation_update" ON playbooks
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy DELETE: Solo eliminar playbooks del tenant actual
CREATE POLICY "playbooks_tenant_isolation_delete" ON playbooks
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================
-- RLS para tabla playbook_messages
-- ============================================

-- Habilitar RLS
ALTER TABLE playbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_messages FORCE ROW LEVEL SECURITY;

-- Policy SELECT: Verificar tenant via JOIN con playbooks
CREATE POLICY "playbook_messages_tenant_isolation_select" ON playbook_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbooks p
      WHERE p.id = playbook_messages.playbook_id
      AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Policy INSERT: Verificar que el playbook pertenece al tenant
CREATE POLICY "playbook_messages_tenant_isolation_insert" ON playbook_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playbooks p
      WHERE p.id = playbook_messages.playbook_id
      AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Policy UPDATE: Verificar tenant via JOIN
CREATE POLICY "playbook_messages_tenant_isolation_update" ON playbook_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM playbooks p
      WHERE p.id = playbook_messages.playbook_id
      AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Policy DELETE: Verificar tenant via JOIN
CREATE POLICY "playbook_messages_tenant_isolation_delete" ON playbook_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playbooks p
      WHERE p.id = playbook_messages.playbook_id
      AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );
```

### Índices y Constraints

**Partial Unique Index para Default Playbook (IMPLEMENTADO):**

El constraint original `@@unique([tenantId, triggerType, isDefault])` tenía un problema:
- Permitía solo 1 playbook con `is_default=false` (incorrecto!)
- Limitaba la creación de playbooks no-default

**Solución implementada:** Partial unique index que solo aplica cuando `is_default=true`:

```sql
-- En prisma/migrations/rls-policies-playbooks.sql
CREATE UNIQUE INDEX unique_default_playbook_per_tenant_trigger
ON playbooks (tenant_id, trigger_type)
WHERE is_default = true;
```

**Comportamiento correcto:**
- ✅ Múltiples playbooks con `is_default=false` para mismo tenant/trigger_type
- ✅ Solo 1 playbook con `is_default=true` por tenant/trigger_type
- ✅ Constraint solo se evalúa cuando `is_default=true`

### Campos Explicados

**Playbook:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `triggerType` | varchar(20) | `pre_due` (antes de vencer), `post_due` (después), `manual` |
| `triggerDays` | int? | Días relativos. -7 = 7 días antes, +3 = 3 días después. NULL para manual |
| `isDefault` | boolean | Si es el playbook por defecto para su trigger_type |
| `createdByUserId` | uuid? | Usuario que creó el playbook (para auditoría) |

**PlaybookMessage:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sequenceOrder` | int | Orden en la secuencia (1, 2, 3...) |
| `channel` | varchar(20) | `email` o `whatsapp` |
| `temperature` | varchar(20) | `amigable`, `firme`, `urgente` |
| `subjectTemplate` | text? | Template del subject (solo email) |
| `bodyTemplate` | text | Template del body con variables `{{var}}` |
| `useAiGeneration` | boolean | Si debe usar IA para generar contenido |
| `aiInstructions` | text? | Instrucciones para la IA si useAiGeneration=true |
| `waitDays` | int | Días a esperar antes de enviar este mensaje |
| `sendOnlyIfNoResponse` | boolean | Saltar si el cliente ya respondió |

### Variables de Template Disponibles (Referencia Epic 3)

Para uso en `bodyTemplate` y `subjectTemplate`:
```
{{company_name}}       - Nombre de la empresa
{{contact_first_name}} - Nombre del contacto
{{invoice_number}}     - Número de factura
{{amount}}             - Monto formateado
{{currency}}           - Moneda (USD, MXN, etc.)
{{due_date}}           - Fecha de vencimiento
{{days_overdue}}       - Días de retraso (negativo si antes del vencimiento)
```

### File Structure

```
prisma/
├── schema.prisma          # Agregar Playbook y PlaybookMessage models
└── migrations/
    └── XXXXXX_add_playbook_schema/
        └── migration.sql  # Generado por Prisma + RLS manual

# Scripts de RLS (ejecutar después de migrate)
scripts/
└── rls/
    └── 03-playbooks-rls.sql  # Policies de RLS
```

### Testing Requirements

**Tests de Constraints:**
```typescript
// tests/db/playbook-constraints.test.ts

describe('Playbook Constraints', () => {
  it('should allow only one default playbook per trigger_type per tenant', async () => {
    const tenantId = await createTestTenant();

    // Crear primer default
    const playbook1 = await createPlaybook({
      tenantId,
      triggerType: 'post_due',
      isDefault: true,
      name: 'Default Post Due'
    });

    // Intentar crear segundo default del mismo tipo
    await expect(createPlaybook({
      tenantId,
      triggerType: 'post_due',
      isDefault: true,
      name: 'Another Default'
    })).rejects.toThrow(/unique constraint/i);

    // Pero permitir default de otro tipo
    const playbook2 = await createPlaybook({
      tenantId,
      triggerType: 'pre_due',
      isDefault: true,
      name: 'Default Pre Due'
    });
    expect(playbook2).toBeDefined();
  });

  it('should enforce unique sequence_order per playbook', async () => {
    const playbook = await createPlaybook({ name: 'Test' });

    await createPlaybookMessage({
      playbookId: playbook.id,
      sequenceOrder: 1
    });

    await expect(createPlaybookMessage({
      playbookId: playbook.id,
      sequenceOrder: 1
    })).rejects.toThrow(/unique constraint/i);
  });
});
```

**Tests de RLS:**
```typescript
// tests/rls/playbook-isolation.test.ts

describe('Playbook RLS Isolation', () => {
  it('should not allow tenant A to see tenant B playbooks', async () => {
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');

    // Crear playbooks en cada tenant
    const playbookA = await createPlaybookForTenant(tenantA.id);
    const playbookB = await createPlaybookForTenant(tenantB.id);

    // Query desde contexto tenant A
    const supabaseA = createClientForTenant(tenantA.id);
    const { data } = await supabaseA.from('playbooks').select('*');

    // Solo debe ver playbookA
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(playbookA.id);
  });

  it('should cascade delete messages when playbook is deleted', async () => {
    const playbook = await createPlaybook({ name: 'Test' });
    const message = await createPlaybookMessage({
      playbookId: playbook.id,
      sequenceOrder: 1
    });

    await deletePlaybook(playbook.id);

    // Message should be deleted via CASCADE
    const messages = await getMessagesForPlaybook(playbook.id);
    expect(messages).toHaveLength(0);
  });
});
```

### Security Checklist

**Schema y Código:**
- [x] Policies SELECT, INSERT, UPDATE, DELETE para playbooks
- [x] Policies SELECT, INSERT, UPDATE, DELETE para playbook_messages
- [x] Partial unique index para default playbook
- [x] Unique constraint `(playbook_id, sequence_order)`
- [x] Cascade delete de messages (onDelete: Cascade)
- [x] Tests de integración escritos

**Ejecutado en DB (2025-12-03):**
- [x] RLS ENABLED en tabla playbooks
- [x] RLS FORCED en tabla playbooks
- [x] RLS ENABLED en tabla playbook_messages
- [x] RLS FORCED en tabla playbook_messages
- [x] Partial unique index `unique_default_playbook_per_tenant_trigger`

### Project Structure Notes

- **Prisma schema**: `prisma/schema.prisma` - Agregar modelos después de InvoiceStatusHistory
- **Migraciones**: Se generan en `prisma/migrations/` con timestamp
- **RLS scripts**: Pueden ejecutarse como parte de la migración o por separado
- **Convención de nombres**: snake_case en DB, camelCase en TypeScript (Prisma @map)

### References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.1]** - Criterios de aceptación
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Schema-Prisma]** - Schema completo líneas 35-94
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Contexto-Técnico]** - ADRs aplicables
- **[Source: docs/architecture.md#Database-Schema]** - Patrones de schema
- **[Source: docs/architecture.md#Cross-Cutting-Concerns]** - Multi-tenancy patterns
- **[Source: docs/sprint-artifacts/2-1-crear-empresas-cliente.md#RLS-Policies]** - Patrón de RLS

---

## Dev Agent Record

### Context Reference

Story contexted using BMad Method Ultimate Context Engine with comprehensive analysis of:
- Epic 3 complete specification (837 lines) - Motor de Cobranzas
- Epic 2 Stories as format reference (Story 2.1: 834 lines)
- Current Prisma schema (145 lines) - existing models
- Architecture document (1860+ lines) - Complete stack and patterns
- Sprint status tracking - Epic 3 contexted, ready for development
- Party Mode decisions (2025-12-03) - Gaps resolved, risks mitigated

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** critical (foundation story - blocks 3.2, 3.3)

**Critical Path:**
1. Update prisma/schema.prisma with new models (Task 1)
2. Run prisma migrate (Task 2)
3. Apply RLS policies (Task 3, 4)
4. Verify constraints work correctly (Task 5)
5. Run RLS isolation tests (Task 6)

**Dependencies:**
- Epic 2 completado (done)
- Supabase + Clerk configurados
- Patrones de RLS establecidos en Epic 1

**Blocks:**
- Story 3.2 (Builder de Playbooks) - necesita schema
- Story 3.3 (Playbooks Pre-configurados) - necesita schema
- Story 3.4 (Schema de Collections) - puede ejecutarse en paralelo

**Estimated Effort:** 3-4 horas

**Key Success Factors:**
- RLS isolation tests MUST pass
- Unique constraints funcionando correctamente
- Cascade delete de messages verificado
- No breaking changes a modelos existentes

### File List

Files created/modified:
- `prisma/schema.prisma` - ✅ Playbook, PlaybookMessage models + createdBy relation
- `prisma/migrations/rls-policies-playbooks.sql` - ✅ RLS policies + partial unique index
- `prisma/migrations/manual-3-1-playbooks-schema.sql` - ✅ Manual SQL ejecutado en Supabase
- `src/lib/services/playbook-constraints.test.ts` - ✅ Integration tests
- `src/lib/services/playbook-rls.test.ts` - ✅ RLS isolation tests

---

**Generated:** 2025-12-03
**Epic:** 3 - Motor de Cobranzas Automatizado
**Next Story:** 3-2-builder-de-playbooks (depends on 3.1 completion)
