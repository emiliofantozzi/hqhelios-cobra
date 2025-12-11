---
id: epic-3
title: "Motor de Cobranzas Automatizado"
status: pending
priority: high
dependencies: [epic-2]
stories_count: 7
frs_covered: [FR14, FR15, FR16, FR17, FR18, FR19, FR20]
---

# Epic 3: Motor de Cobranzas Automatizado ⚙️

## Objetivo
Crear un sistema de playbooks y collections que automatiza el proceso de cobranza.

## Valor para el Usuario
Miguel configura playbooks una vez y el sistema ejecuta automáticamente las secuencias de mensajes según reglas determinísticas.

## FRs Cubiertos
- **FR14:** Schema de Playbooks
- **FR15:** Builder de Playbooks
- **FR16:** Playbooks pre-configurados
- **FR17:** Schema de Collections
- **FR18:** Crear cobranza desde factura
- **FR19:** Worker de procesamiento automático
- **FR20:** Control manual de cobranzas

## Contexto Técnico

### ADRs Aplicables
- **ADR #2:** Motor determinístico para decisiones, IA solo para contenido
- **ADR #3:** Cobranza individual 1:1 (1 Collection = 1 Invoice)

### Schema Prisma
```prisma
model Playbook {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid
  name            String
  description     String?
  triggerType     String   // pre_due, post_due, manual
  triggerDays     Int?     // -7 = 7 días antes, +3 = 3 días después
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  createdByUserId String?  @db.Uuid

  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  messages    PlaybookMessage[]
  collections Collection[]

  @@unique([tenantId, triggerType, isDefault])
}

model PlaybookMessage {
  id                   String  @id @default(uuid()) @db.Uuid
  playbookId           String  @db.Uuid
  sequenceOrder        Int
  channel              String  // email, whatsapp
  temperature          String  // amigable, firme, urgente
  subjectTemplate      String? // solo email
  bodyTemplate         String
  useAiGeneration      Boolean @default(false)
  aiInstructions       String?
  waitDays             Int     @default(0)
  sendOnlyIfNoResponse Boolean @default(true)

  playbook Playbook @relation(fields: [playbookId], references: [id])

  @@unique([playbookId, sequenceOrder])
}

model Collection {
  id                  String    @id @default(uuid()) @db.Uuid
  tenantId            String    @db.Uuid
  invoiceId           String    @unique @db.Uuid
  companyId           String    @db.Uuid
  primaryContactId    String    @db.Uuid
  playbookId          String    @db.Uuid
  currentMessageIndex Int       @default(0)
  status              String    @default("active")
  messagesSentCount   Int       @default(0)
  lastMessageSentAt   DateTime?
  customerResponded   Boolean   @default(false)
  lastResponseAt      DateTime?
  startedAt           DateTime  @default(now())
  nextActionAt        DateTime?
  completedAt         DateTime?

  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  invoice        Invoice  @relation(fields: [invoiceId], references: [id])
  company        Company  @relation(fields: [companyId], references: [id])
  primaryContact Contact  @relation(fields: [primaryContactId], references: [id])
  playbook       Playbook @relation(fields: [playbookId], references: [id])
}
```

### Estados de Collection
| Estado | Descripción |
|--------|-------------|
| `active` | En proceso, worker la procesa |
| `paused` | Pausada manualmente |
| `awaiting_response` | Esperando respuesta del cliente |
| `pending_review` | Respuesta recibida, pendiente de revisión |
| `completed` | Finalizada exitosamente (estado terminal) |
| `escalated` | Escalada a nivel superior |

### State Machine de Collection (Transiciones Permitidas)
> Definido por Party Mode Session 2025-12-03

| From | To | Trigger | Actor |
|------|----|---------|-------|
| `active` | `paused` | Pausar cobranza | User |
| `active` | `awaiting_response` | Mensaje enviado con `sendOnlyIfNoResponse=true` | Worker |
| `active` | `completed` | Usuario marca como pagada/resuelta | User |
| `active` | `escalated` | Todos los mensajes enviados sin respuesta | Worker |
| `paused` | `active` | Reanudar cobranza | User |
| `paused` | `completed` | Cancelar/resolver mientras pausada | User |
| `awaiting_response` | `active` | Continuar (timeout o decisión) | Worker/User |
| `awaiting_response` | `pending_review` | Respuesta recibida (webhook N8N) | System |
| `pending_review` | `active` | Usuario decide continuar cobranza | User |
| `pending_review` | `completed` | Usuario acepta resolución | User |
| `escalated` | `completed` | Usuario resuelve manualmente | User |

**Regla crítica:** Solo `completed` es estado terminal. Todos los demás pueden transicionar.

### Configuración del Worker
> Clarificado por Party Mode Session 2025-12-03

```typescript
const workerConfig = {
  schedule: '*/5 * * * *',  // Cada 5 minutos
  batchSize: 100,           // Collections por ejecución
  timeout: 300000,          // 5 minutos max

  // Redis Lock (Upstash) - Previene race conditions (R-001)
  lock: {
    provider: 'upstash',
    key: 'collection-worker-lock',
    ttlSeconds: 45,         // Auto-release después de 45 seg
  },

  // Rate Limits - SCOPE CLARIFICADO
  rateLimits: {
    // Máximo 5 collections ACTIVAS simultáneas POR TENANT
    maxActiveCollectionsPerTenant: 5,

    // Mínimo 4 horas entre mensajes AL MISMO CONTACTO (primaryContactId)
    minHoursBetweenMessagesToSameContact: 4,

    // Máximo 10 mensajes por día POR TENANT (todas las collections sumadas)
    maxMessagesPerDayPerTenant: 10
  }
};
```

### Servicio de Mensajería (IMessageService)
> Decisión arquitectónica: Patrón Ports & Adapters

```typescript
// src/lib/services/messaging/types.ts
interface IMessageService {
  send(params: {
    channel: 'email' | 'whatsapp';
    to: string;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Epic 3: MockMessageService (logs to console/DB, no envía realmente)
// Epic 4: SendGridService + TwilioService (implementaciones reales)
```

---

## Stories

### Story 3.1: Schema de Playbooks y Mensajes

**Como** desarrollador,
**Quiero** el schema de Playbooks y PlaybookMessages,
**Para que** pueda almacenar templates de workflows.

#### Criterios de Aceptación

**Scenario: Migraciones crean tablas**
```gherkin
Given ejecuto prisma migrate dev
When las migraciones completan
Then existen tablas:
  | Tabla | Columnas Clave |
  | playbooks | id, tenant_id, name, trigger_type, trigger_days, is_default |
  | playbook_messages | id, playbook_id, sequence_order, channel, temperature |
```

**Scenario: RLS aplicado**
```gherkin
Given RLS está habilitado
When usuario de tenant A consulta playbooks
Then solo ve playbooks de tenant A
```

**Scenario: Constraint de default único**
```gherkin
Given existe playbook default para trigger_type = 'post_due'
When intento crear otro default para 'post_due'
Then veo error de constraint violation
```

**Scenario: Sequence order único por playbook**
```gherkin
Given playbook tiene mensaje con sequence_order = 1
When intento crear otro mensaje con sequence_order = 1
Then veo error de constraint violation
```

#### Notas Técnicas
- **Migraciones:** Ya definido en Architecture schema.prisma
- **Índices:**
  - `(tenant_id)` en playbooks
  - `(playbook_id, sequence_order)` en playbook_messages
- **RLS policies:** Aplicar después de migración

#### Prerequisitos
- Epic 1 completada

---

### Story 3.2: Builder de Playbooks

**Como** Miguel,
**Quiero** crear playbooks con secuencias de mensajes,
**Para que** el sistema sepa qué mensajes enviar y cuándo.

#### Criterios de Aceptación

**Scenario: Crear playbook básico**
```gherkin
Given estoy en /playbooks/new
When lleno el formulario:
  | Campo | Valor |
  | name | Cobranza Estándar |
  | description | Secuencia de 3 mensajes |
  | triggerType | post_due |
  | triggerDays | 3 |
Then puedo guardar el playbook
```

**Scenario: Agregar mensajes a secuencia**
```gherkin
Given estoy editando un playbook
When hago click en "Agregar Mensaje"
Then veo formulario con:
  | Campo | Tipo | Opciones |
  | channel | select | Email, WhatsApp |
  | temperature | select | Amigable, Firme, Urgente |
  | subjectTemplate | text | solo si email |
  | bodyTemplate | textarea | con variables |
  | waitDays | number | días antes del siguiente |
  | sendOnlyIfNoResponse | checkbox | - |
```

**Scenario: Variables disponibles en templates**
```gherkin
Given estoy editando bodyTemplate
When veo la ayuda de variables
Then las variables disponibles son:
  | Variable | Descripción |
  | {{company_name}} | Nombre de empresa |
  | {{contact_first_name}} | Nombre del contacto |
  | {{invoice_number}} | Número de factura |
  | {{amount}} | Monto formateado |
  | {{currency}} | Moneda |
  | {{due_date}} | Fecha de vencimiento |
  | {{days_overdue}} | Días de retraso |
```

**Scenario: Preview de mensaje**
```gherkin
Given he escrito un template con variables
When hago click en "Preview"
Then veo el mensaje con variables reemplazadas
And usa datos de ejemplo
```

**Scenario: Reordenar mensajes**
```gherkin
Given playbook tiene 3 mensajes
When arrastro mensaje 3 a posición 1
Then sequence_order se actualiza automáticamente
And todos los mensajes tienen orden correcto
```

**Scenario: Validación mínima**
```gherkin
Given intento guardar playbook sin mensajes
When hago click en guardar
Then veo error "Debe agregar al menos un mensaje"
```

#### Notas Técnicas
- **Rutas:**
  - `src/app/(dashboard)/playbooks/page.tsx`
  - `src/app/(dashboard)/playbooks/new/page.tsx`
  - `src/app/(dashboard)/playbooks/[id]/edit/page.tsx`
- **API:**
  - `POST /api/playbooks`
  - `PATCH /api/playbooks/[id]`
  - `POST /api/playbooks/[id]/messages`
  - `PATCH /api/playbooks/[id]/messages/reorder`
- **Componentes:**
  - `src/components/forms/playbook-form.tsx`
  - `src/components/forms/playbook-message-form.tsx`
- **Drag & Drop:** Usar `@dnd-kit/core` + `@dnd-kit/sortable`
- **Template replacer:** `src/lib/utils/template-replacer.ts`

#### Prerequisitos
- Story 3.1 completada

---

### Story 3.3: Playbooks Pre-configurados (Seed)

**Como** nuevo tenant,
**Quiero** playbooks pre-configurados disponibles,
**Para que** pueda empezar a usar el sistema inmediatamente.

#### Criterios de Aceptación

**Scenario: Playbooks creados en onboarding**
```gherkin
Given se crea un nuevo tenant
When el proceso de onboarding completa
Then existen 3 playbooks:
```

**Playbook 1: Recordatorio Pre-Vencimiento**
```yaml
name: "Recordatorio Pre-Vencimiento"
triggerType: pre_due
triggerDays: -7
isDefault: true
messages:
  - channel: email
    temperature: amigable
    subject: "Recordatorio: Factura {{invoice_number}} próxima a vencer"
    body: |
      Hola {{contact_first_name}},

      Te recordamos que la factura {{invoice_number}} por {{amount}} {{currency}}
      vence el {{due_date}}.

      Por favor, realiza el pago a tiempo para evitar cargos adicionales.

      Saludos cordiales,
      Equipo de Cobranzas
```

**Playbook 2: Cobranza Post-Vencimiento**
```yaml
name: "Cobranza Post-Vencimiento"
triggerType: post_due
triggerDays: 3
isDefault: true
messages:
  - sequence: 1
    channel: email
    temperature: amigable
    waitDays: 0
    subject: "Factura {{invoice_number}} vencida - Recordatorio de pago"
    body: "Mensaje amigable recordando el pago..."

  - sequence: 2
    channel: whatsapp
    temperature: firme
    waitDays: 3
    sendOnlyIfNoResponse: true
    body: "Hola {{contact_first_name}}, la factura {{invoice_number}} tiene {{days_overdue}} días de retraso..."

  - sequence: 3
    channel: email
    temperature: urgente
    waitDays: 3
    sendOnlyIfNoResponse: true
    subject: "URGENTE: Factura {{invoice_number}} - Acción requerida"
    body: "Mensaje urgente solicitando pago inmediato..."
```

**Playbook 3: Escalamiento**
```yaml
name: "Escalamiento"
triggerType: manual
isDefault: false
messages:
  - channel: email
    temperature: urgente
    subject: "Escalamiento: Factura {{invoice_number}} - {{company_name}}"
    body: "Mensaje formal de escalamiento con CC a contacto de escalación..."
```

**Scenario: Templates en español profesional**
```gherkin
Given los playbooks se crean
Then todos los templates están en español
And el tono es profesional pero no agresivo
```

#### Notas Técnicas
- **Implementación:** Extender seed o crear en webhook de Clerk
- **Definición:** `src/lib/constants/default-playbooks.ts`
- **CC para escalamiento:** Agregar campo `includeEscalationContact` en mensaje

#### Prerequisitos
- Story 3.2 completada

---

### Story 3.4: Schema de Collections

**Como** desarrollador,
**Quiero** el schema de Collections,
**Para que** pueda trackear cobranzas activas.

#### Criterios de Aceptación

**Scenario: Tabla collections existe**
```gherkin
Given ejecuto migraciones
Then tabla collections tiene columnas:
  | Columna | Tipo | Constraint |
  | id | uuid | PK |
  | tenant_id | uuid | FK + RLS |
  | invoice_id | uuid | FK + UNIQUE |
  | company_id | uuid | FK |
  | primary_contact_id | uuid | FK |
  | playbook_id | uuid | FK |
  | current_message_index | int | default 0 |
  | status | varchar | default 'active' |
  | next_action_at | timestamp | nullable |
```

**Scenario: Una collection activa por factura**
```gherkin
Given factura tiene collection con status = 'active'
When intento crear otra collection para misma factura
Then veo error de constraint
```

**Scenario: Múltiples completed permitidas**
```gherkin
Given factura tuvo collection completada
When creo nueva collection
Then se crea sin error
And ambas existen en historial
```

**Scenario: Índices para worker**
```gherkin
Given tabla tiene índices
Then existen índices en:
  | Índice | Columnas |
  | status_next_action | (status, next_action_at) |
  | tenant_status | (tenant_id, status) |
```

#### Notas Técnicas
- **Constraint unique condicional:**
```sql
CREATE UNIQUE INDEX unique_active_collection_per_invoice
ON collections (invoice_id)
WHERE status NOT IN ('completed', 'escalated');
```
- **RLS:** Aplicar policy por tenant_id

#### Prerequisitos
- Story 3.1 completada

---

### Story 3.5: Activar Playbook en Factura

**Como** Miguel,
**Quiero** activar un playbook en una factura,
**Para que** el sistema comience el seguimiento automático.

> **Nota de Arquitectura (2025-12-04):** La UI es factura-céntrica. El usuario activa un playbook desde la vista de factura, no "crea una cobranza" como entidad separada. La tabla Collection es implementación interna.

#### Criterios de Aceptación

**Scenario: Botón visible en factura elegible**
```gherkin
Given factura tiene payment_status IN ('pendiente', 'fecha_confirmada')
And no tiene playbook activo
When veo el detalle de factura
Then veo botón "Activar Playbook"
```

**Scenario: Abrir modal de activación**
```gherkin
Given hago click en "Activar Playbook"
Then veo Dialog con:
  | Campo | Valor |
  | Factura | {{invoice_number}} - {{amount}} |
  | Empresa | {{company_name}} |
  | Contacto | {{primary_contact.name}} (primario) |
  | Playbook | Selector con default pre-seleccionado |
```

**Scenario: Activar playbook**
```gherkin
Given selecciono playbook y confirmo
When hago click en "Activar"
Then se crea registro interno (Collection) con:
  | Campo | Valor |
  | status | active |
  | current_message_index | 0 |
  | started_at | now |
  | next_action_at | now (para enviar inmediatamente) |
And veo mensaje de éxito
And la factura muestra badge "Playbook Activo: [nombre]"
And me quedo en la vista de factura (no navego a otra página)
```

**Scenario: Validación de contacto**
```gherkin
Given empresa no tiene contacto primary
When intento activar playbook
Then veo error "La empresa debe tener un contacto principal"
And enlace para ir a agregar contacto
```

**Scenario: Ya existe playbook activo**
```gherkin
Given factura ya tiene playbook activo
When veo el detalle
Then no veo "Activar Playbook"
And veo sección "Playbook Activo" con controles de Pausar/Completar
```

#### Notas Técnicas
- **API:** `POST /api/invoices/[id]/playbook` (factura-céntrico)
- **Payload:**
```typescript
interface ActivatePlaybookPayload {
  playbookId: string;
}
// invoiceId viene de la URL, company_id, primary_contact_id, tenant_id se derivan
```
- **UI:** Botón y modal dentro de `src/app/(dashboard)/invoices/[invoiceId]/page.tsx`
- **Componente:** `src/app/(dashboard)/invoices/[invoiceId]/components/playbook-controls.tsx`
- **Validaciones server-side:**
  - Invoice pertenece al tenant
  - Invoice no tiene playbook activo
  - Company tiene primary contact
  - Playbook pertenece al tenant y está activo

#### Prerequisitos
- Story 3.4 completada
- Story 2.3 (contacto primary)

---

### Story 3.6: Worker de Procesamiento Automático

**Como** sistema,
**Quiero** un worker que procese collections automáticamente,
**Para que** los mensajes se envíen sin intervención manual.

#### Criterios de Aceptación

**Scenario: Cron ejecuta cada 5 minutos**
```gherkin
Given vercel.json tiene cron configurado
When pasan 5 minutos
Then endpoint /api/cron/collection-worker recibe GET
```

**Scenario: Selección de collections a procesar**
```gherkin
Given hay collections con status = 'active' y next_action_at <= now
When worker ejecuta
Then procesa hasta 100 collections
And las procesa en orden de next_action_at ASC
```

**Scenario: Enviar mensaje de playbook**
```gherkin
Given collection tiene current_message_index = 0
And playbook tiene mensaje en posición 0
When worker procesa la collection
Then:
  1. Obtiene playbook_message[0]
  2. Reemplaza variables en template
  3. Llama servicio de envío (email/whatsapp)
  4. Crea registro en sent_messages
  5. Incrementa messages_sent_count
  6. Actualiza last_message_sent_at
  7. current_message_index = 1
  8. next_action_at = now + wait_days del siguiente
```

**Scenario: Respetar sendOnlyIfNoResponse**
```gherkin
Given collection tiene customer_responded = true
And mensaje siguiente tiene sendOnlyIfNoResponse = true
When worker procesa
Then salta el mensaje
And avanza al siguiente
```

**Scenario: Completar collection sin más mensajes**
```gherkin
Given collection llegó al último mensaje
When worker intenta avanzar
Then status = 'completed'
And completed_at = now
And next_action_at = null
```

**Scenario: Rate limiting por empresa**
```gherkin
Given empresa tiene 5 collections activas
When intento crear sexta collection
Then veo error "Máximo de cobranzas activas alcanzado"
```

**Scenario: Espaciado de mensajes**
```gherkin
Given contacto recibió mensaje hace 2 horas
And minHoursBetweenMessages = 4
When worker procesa collection
Then postpone next_action_at = last_sent + 4 horas
```

**Scenario: Error en envío**
```gherkin
Given servicio de email falla
When worker intenta enviar
Then collection.status = 'paused'
And se registra error en logs
And se crea notificación para admin
```

**Scenario: Performance**
```gherkin
Given hay 100 collections listas para procesar
When worker ejecuta
Then completa en < 30 segundos
```

**Scenario: Distributed Lock (R-001 Mitigation)**
```gherkin
Given the worker is triggered
When another worker instance is already running
Then this instance exits with status "lock_held" without processing
```

**Scenario: Rate Limit - Max Active Per Tenant**
```gherkin
Given tenant "A" has 5 active collections
When worker tries to process a 6th collection for tenant "A"
Then that collection is skipped with reason "max_active_exceeded"
```

**Scenario: Rate Limit - Time Between Messages**
```gherkin
Given contact "X" received a message 2 hours ago
And minHoursBetweenMessagesToSameContact = 4
When worker processes a collection for contact "X"
Then message is skipped with reason "min_hours_not_met"
```

**Scenario: Rate Limit - Daily Limit Per Tenant**
```gherkin
Given tenant "B" has sent 10 messages today
When worker processes any collection for tenant "B"
Then message is skipped with reason "daily_limit_exceeded"
```

**Scenario: Use IMessageService for sending**
```gherkin
Given worker needs to send a message
When it calls the messaging service
Then it uses IMessageService.send() interface
And MockMessageService logs the message without sending
```

#### Notas Técnicas
- **Ruta:** `src/app/api/cron/collection-worker/route.ts`
- **Lógica:** `src/lib/workers/collection-worker.ts`
- **vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/collection-worker",
    "schedule": "*/5 * * * *"
  }]
}
```
- **Pseudocódigo:**
```typescript
async function processCollections() {
  const collections = await getActiveCollections(100);

  for (const collection of collections) {
    try {
      const message = getNextMessage(collection);
      if (!message) {
        await completeCollection(collection);
        continue;
      }

      if (message.sendOnlyIfNoResponse && collection.customerResponded) {
        await skipToNextMessage(collection);
        continue;
      }

      if (!canSendNow(collection)) {
        continue; // Rate limit, esperar
      }

      await sendMessage(collection, message);
      await updateCollectionProgress(collection);
    } catch (error) {
      await pauseWithError(collection, error);
    }
  }
}
```

#### Prerequisitos
- Story 3.5 completada
- Epic 4 (envío de mensajes)

---

### Story 3.7: Control Manual de Playbook Activo

**Como** Miguel,
**Quiero** pausar, reanudar y completar el playbook activo de una factura,
**Para que** pueda manejar casos excepcionales.

> **Nota de Arquitectura (2025-12-04):** Todos los controles están DENTRO de la vista de detalle de factura. No hay página separada de "cobranzas".

#### Criterios de Aceptación

**Scenario: Pausar playbook activo**
```gherkin
Given factura tiene playbook activo (status = 'active')
When hago click en "Pausar Playbook" en la vista de factura
Then status = 'paused'
And badge cambia a "Playbook Pausado"
And worker no la procesa
And veo mensaje de confirmación
```

**Scenario: Reanudar playbook**
```gherkin
Given factura tiene playbook pausado (status = 'paused')
When hago click en "Reanudar" en la vista de factura
Then status = 'active'
And badge cambia a "Playbook Activo: [nombre]"
And next_action_at = now
And worker la procesará en próxima ejecución
```

**Scenario: Completar manualmente**
```gherkin
Given factura tiene playbook activo o pausado
When hago click en "Completar Playbook"
And confirmo en dialog
Then status = 'completed'
And completed_at = now
And badge desaparece
And historial de comunicaciones se mantiene visible
And veo mensaje "Playbook completado"
```

**Scenario: Ver bandeja de comunicaciones**
```gherkin
Given estoy en detalle de factura
When veo el tab "Comunicaciones"
Then veo timeline con:
  | Evento | Timestamp | Detalle |
  | Playbook activado | startedAt | Nombre del playbook |
  | 📤 Mensaje enviado | sent_at | Canal, preview, estado |
  | 📥 Respuesta recibida | received_at | Preview |
  | Playbook pausado | - | Por usuario X |
  | Playbook reanudado | - | Por usuario X |
```

**Scenario: Controles visibles según estado**
```gherkin
Given estoy en detalle de factura
When veo la sección "Playbook Activo"
Then veo botones según estado:
  | Estado Actual | Botones Visibles |
  | active | Pausar, Completar |
  | paused | Reanudar, Completar |
  | sin playbook | Activar Playbook |
  | completed | (solo historial visible) |
```

#### Notas Técnicas
- **API:** `PATCH /api/invoices/[id]/playbook`
  - Body: `{ action: 'pause' | 'resume' | 'complete' }`
- **UI:** Dentro de `src/app/(dashboard)/invoices/[invoiceId]/page.tsx`
- **Componentes:**
  - `src/app/(dashboard)/invoices/[invoiceId]/components/playbook-controls.tsx`
  - `src/app/(dashboard)/invoices/[invoiceId]/components/communications-tab.tsx`
  - `src/app/(dashboard)/invoices/[invoiceId]/components/message-timeline.tsx`

#### Prerequisitos
- Story 3.5 completada

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] Playbook builder funcional con drag & drop
- [ ] 3 playbooks pre-configurados en seed
- [ ] Worker ejecutando cada 5 min en Vercel
- [ ] Rate limiting funcionando
- [ ] Control manual (pausar/reanudar/completar)
- [ ] Timeline de collection visible
- [ ] Tests del worker con mocks de envío

---

**Última actualización:** 2025-12-03
**Estado:** 🔜 Pendiente → Ready for Sprint Planning

---

## Decisiones de Party Mode (2025-12-03)

| Decisión | Resolución | Owner |
|----------|-----------|-------|
| **Gap C1: Envío de Mensajes** | IMessageService + MockMessageService en Epic 3, implementaciones reales en Epic 4 | Winston (Architect) |
| **Gap C2: State Machine** | Transiciones completas documentadas arriba | Bob (SM) |
| **Gap C3: Rate Limiting** | Scope clarificado: por tenant y por contacto | Winston (Architect) |
| **R-001: Race Condition** | Upstash Redis lock con TTL 45 seg | Murat (TEA) |
