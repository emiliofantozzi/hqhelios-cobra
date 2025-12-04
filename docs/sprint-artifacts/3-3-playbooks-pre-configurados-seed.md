# Story 3.3: Playbooks Pre-configurados (Seed)

Status: done

## Story

**Como** nuevo tenant,
**Quiero** playbooks pre-configurados disponibles desde el momento de registro,
**Para que** pueda empezar a usar el sistema de cobranzas inmediatamente.

## Acceptance Criteria

### **Scenario 1: Playbooks creados en onboarding**
```gherkin
Given se crea un nuevo tenant
When el proceso de onboarding completa
Then existen 3 playbooks pre-configurados
And están listos para usar
```

### **Scenario 2: Playbook Recordatorio Pre-Vencimiento**
```gherkin
Given el tenant tiene playbooks creados
When reviso el playbook "Recordatorio Pre-Vencimiento"
Then tiene:
  | Campo       | Valor     |
  | triggerType | pre_due   |
  | triggerDays | -7        |
  | isDefault   | true      |
  | messages    | 1 email   |
And el mensaje tiene temperature "amigable"
```

### **Scenario 3: Playbook Cobranza Post-Vencimiento**
```gherkin
Given el tenant tiene playbooks creados
When reviso el playbook "Cobranza Post-Vencimiento"
Then tiene:
  | Campo       | Valor     |
  | triggerType | post_due  |
  | triggerDays | 3         |
  | isDefault   | true      |
  | messages    | 3         |
And los mensajes siguen secuencia: email amigable → whatsapp firme → email urgente
```

### **Scenario 4: Playbook Escalamiento**
```gherkin
Given el tenant tiene playbooks creados
When reviso el playbook "Escalamiento"
Then tiene:
  | Campo       | Valor     |
  | triggerType | manual    |
  | isDefault   | false     |
  | messages    | 1 email   |
And el mensaje tiene temperature "urgente"
```

### **Scenario 5: Templates en español profesional**
```gherkin
Given los playbooks se crean
Then todos los templates están en español
And el tono es profesional pero no agresivo
And usan las variables de template correctamente
```

### **Scenario 6: Idempotencia en seed**
```gherkin
Given un tenant ya tiene playbooks creados
When se ejecuta el seed nuevamente
Then no se crean duplicados
And los playbooks existentes permanecen intactos
```

## Tasks / Subtasks

### Task 1: Crear constantes de playbooks por defecto (AC: 2, 3, 4, 5)
- [x] **Task 1.1**: Crear `src/lib/constants/default-playbooks.ts`
  - [x] Definir tipos TypeScript para playbooks y mensajes
  - [x] Crear array DEFAULT_PLAYBOOKS con los 3 playbooks
  - [x] Incluir templates completos en español profesional

### Task 2: Crear función de seed (AC: 1, 6)
- [x] **Task 2.1**: Crear `src/lib/seed/create-default-playbooks.ts`
  - [x] Función `createDefaultPlaybooks(tenantId, userId?)`
  - [x] Verificar idempotencia (no crear si ya existen)
  - [x] Crear playbooks y sus mensajes
  - [x] Manejar errores gracefully

### Task 3: Integrar con provisioning de tenant (AC: 1)
- [x] **Task 3.1**: Modificar `src/lib/auth/provision-tenant.ts`
  - [x] Importar `createDefaultPlaybooks`
  - [x] Llamar después de crear usuario, antes de Clerk metadata
  - [x] Envolver en try/catch para no fallar provisioning

## Dev Notes

### Architecture Compliance

**Stack Tecnológico:**
- Supabase con service_role key para seed
- TypeScript para tipos estrictos
- Patron idempotente para seed

**Patrones Críticos:**
- NO usar playbook-service.ts para evitar dependencias circulares
- Usar Supabase client directo con service_role key
- Seed no debe fallar el provisioning (try/catch obligatorio)

### File Structure

```
src/lib/
├── constants/
│   └── default-playbooks.ts    # Definiciones de playbooks
├── seed/
│   └── create-default-playbooks.ts  # Función de seed
└── auth/
    └── provision-tenant.ts     # Integración del seed
```

### Playbooks Creados

| Playbook | Tipo | Días | Default | Mensajes |
|----------|------|------|---------|----------|
| Recordatorio Pre-Vencimiento | pre_due | -7 | ✓ | 1 email amigable |
| Cobranza Post-Vencimiento | post_due | +3 | ✓ | 3 (email→whatsapp→email) |
| Escalamiento | manual | - | ✗ | 1 email urgente |

### Variables de Template Usadas

- `{{company_name}}` - Nombre de empresa
- `{{contact_first_name}}` - Nombre del contacto
- `{{invoice_number}}` - Número de factura
- `{{amount}}` - Monto formateado
- `{{currency}}` - Moneda
- `{{due_date}}` - Fecha de vencimiento
- `{{days_overdue}}` - Días de retraso

### References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.3]** - Criterios de aceptación
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Playbooks]** - Templates en español
- **[Source: docs/sprint-artifacts/3-1-schema-de-playbooks-y-mensajes.md]** - Schema ya creado
- **[Source: docs/sprint-artifacts/3-2-builder-de-playbooks.md]** - Builder funcional

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** done
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** medium

**Implementación:**
- 3 playbooks pre-configurados en español profesional
- Seed idempotente (no crea duplicados)
- Integrado con provisioning de tenant
- No falla provisioning si seed falla

**Dependencies:**
- Story 3.1 (Schema): ✅ DONE
- Story 3.2 (Builder): ✅ DONE

**Next Story:** 3-4-schema-de-collections (ready-for-dev)

### File List

Files created:
- `src/lib/constants/default-playbooks.ts` - Definiciones de playbooks
- `src/lib/seed/create-default-playbooks.ts` - Función de seed

Files modified:
- `src/lib/auth/provision-tenant.ts` - Integración del seed

---

**Generated:** 2025-12-03
**Epic:** 3 - Motor de Cobranzas Automatizado
**Depends on:** Story 3.1, Story 3.2 (ambas done)
