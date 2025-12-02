---
id: epic-5
title: "Loop de Respuestas e IA"
status: pending
priority: high
dependencies: [epic-4]
stories_count: 7
frs_covered: [FR25, FR26, FR27, FR28, FR29, FR30, FR31]
---

# Epic 5: Loop de Respuestas e IA 🤖

## Objetivo
Capturar respuestas de clientes, interpretarlas con IA y permitir supervisión humana eficiente.

## Valor para el Usuario
Miguel procesa respuestas de clientes con 1 click gracias a sugerencias inteligentes de IA, manteniendo control total sobre las decisiones.

## FRs Cubiertos
- **FR25:** Captura de respuestas email (N8N)
- **FR26:** Captura de respuestas WhatsApp (N8N)
- **FR27:** Endpoint webhook customer-response
- **FR28:** Bandeja de respuestas pendientes
- **FR29:** Aprobar sugerencia de IA
- **FR30:** Acción manual override
- **FR31:** Panel de contexto completo

## Contexto Técnico

### ADRs Aplicables
- **ADR #2:** Arquitectura híbrida - IA sugiere, humano aprueba
- **ADR #4:** N8N como orquestador de webhooks e IA

### Integraciones
| Servicio | Uso |
|----------|-----|
| N8N | Orquestación de webhooks, llamadas a OpenAI |
| OpenAI GPT-4 | Interpretación de respuestas de clientes |

### Variables de Entorno
```bash
# N8N
N8N_WEBHOOK_URL="https://n8n.tudominio.com/webhook/..."
N8N_WEBHOOK_SECRET="secreto_para_hmac"

# OpenAI (usado por N8N)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo"
```

### Schema: CustomerResponse
```prisma
model CustomerResponse {
  id                  String    @id @default(uuid()) @db.Uuid
  tenantId            String    @db.Uuid
  collectionId        String    @db.Uuid
  sentMessageId       String?   @db.Uuid
  channel             String    // email, whatsapp
  rawContent          String    // texto original
  aiInterpretation    Json?     // respuesta de OpenAI
  adminActionTaken    String?   // approved_ai, manual_override
  adminNotes          String?
  processedByUserId   String?   @db.Uuid
  processedAt         DateTime?
  status              String    @default("pending_review")
  receivedAt          DateTime  @default(now())
  externalMessageId   String?

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  collection  Collection   @relation(fields: [collectionId], references: [id])
  sentMessage SentMessage? @relation(fields: [sentMessageId], references: [id])
  processedBy User?        @relation(fields: [processedByUserId], references: [id])
}
```

### Estructura de AI Interpretation
```typescript
interface AiInterpretation {
  intent: 'confirmar_pago' | 'solicitar_extension' | 'ya_pago' | 'disputa' | 'otro';
  suggested_action: 'marcar_fecha_confirmada' | 'marcar_pagada' | 'escalar' | 'revisar_manual';
  extracted_data: {
    payment_date?: string;      // ISO date si aplica
    payment_reference?: string; // Si menciona referencia
    notes?: string;             // Contexto adicional
  };
  confidence: number;           // 0.0 - 1.0
  reasoning: string;            // Explicación para el admin
}
```

---

## Stories

### Story 5.1: Captura de Respuestas Email (N8N)

**Como** sistema,
**Quiero** capturar respuestas de email via N8N,
**Para que** las respuestas de clientes lleguen al sistema automáticamente.

#### Criterios de Aceptación

**Scenario: N8N recibe email de respuesta**
```gherkin
Given cliente responde a email de cobranza
When email llega al inbox configurado
Then N8N workflow se activa
And parsea: from_email, subject, body, in_reply_to
```

**Scenario: N8N llama a OpenAI**
```gherkin
Given N8N parseó el email
When ejecuta nodo de OpenAI
Then envía prompt con contexto:
  | Campo | Descripción |
  | email_body | Contenido del email |
  | subject | Asunto |
  | context | "Respuesta a cobranza de factura" |
```

**Scenario: OpenAI retorna interpretación**
```gherkin
Given OpenAI procesa el mensaje
Then retorna JSON estructurado:
  {
    "intent": "confirmar_pago",
    "suggested_action": "marcar_fecha_confirmada",
    "extracted_data": {
      "payment_date": "2024-01-15"
    },
    "confidence": 0.85,
    "reasoning": "El cliente menciona que pagará el día 15"
  }
```

**Scenario: N8N envía webhook a nuestra app**
```gherkin
Given OpenAI retornó interpretación
When N8N ejecuta webhook HTTP
Then POST a /api/webhooks/customer-response con:
  | Campo | Valor |
  | tenant_id | ID del tenant |
  | collection_id | ID de la collection |
  | channel | email |
  | raw_content | body del email |
  | ai_interpretation | JSON de OpenAI |
  | external_message_id | ID del email |
And incluye firma HMAC en header
```

**Scenario: Mapeo de collection**
```gherkin
Given email es respuesta (tiene in_reply_to)
When N8N procesa
Then busca sent_message por external_message_id del email original
And obtiene collection_id de ahí
```

#### Notas Técnicas
- **N8N Workflow:**
  1. Trigger: Email received (via webhook de SendGrid)
  2. Parse email content
  3. Lookup collection by external_message_id
  4. Call OpenAI with prompt
  5. HTTP POST to our webhook
- **Prompt de OpenAI:** Definir en `src/lib/constants/ai-prompts.ts`
```typescript
export const RESPONSE_INTERPRETATION_PROMPT = `
Eres un asistente de cobranzas. Analiza la siguiente respuesta de un cliente
a un mensaje de cobranza y extrae la información relevante.

Respuesta del cliente:
{email_body}

Responde SOLO con JSON válido en este formato exacto:
{
  "intent": "confirmar_pago|solicitar_extension|ya_pago|disputa|otro",
  "suggested_action": "marcar_fecha_confirmada|marcar_pagada|escalar|revisar_manual",
  "extracted_data": {
    "payment_date": "YYYY-MM-DD si se menciona fecha",
    "payment_reference": "referencia si se menciona",
    "notes": "cualquier contexto relevante"
  },
  "confidence": 0.0-1.0,
  "reasoning": "explicación breve de tu análisis"
}
`;
```
- **Backup N8N workflow:** Exportar como JSON y versionar en repo

#### Prerequisitos
- Epic 4 completada

---

### Story 5.2: Captura de Respuestas WhatsApp (N8N)

**Como** sistema,
**Quiero** capturar respuestas de WhatsApp via N8N,
**Para que** mensajes por WhatsApp se procesen igual que email.

#### Criterios de Aceptación

**Scenario: N8N recibe mensaje de WhatsApp**
```gherkin
Given cliente responde por WhatsApp
When Twilio envía webhook a N8N
Then N8N workflow se activa
And parsea: from_phone, body, timestamp
```

**Scenario: Lookup de contact por teléfono**
```gherkin
Given N8N tiene from_phone
When busca en nuestra API
Then encuentra contact por phone (normalizado)
And obtiene collection activa para ese contact
```

**Scenario: No hay collection activa**
```gherkin
Given contact no tiene collection activa
When N8N procesa
Then registra el mensaje pero no crea response
And log indica "mensaje sin collection activa"
```

**Scenario: Procesar con OpenAI y enviar webhook**
```gherkin
Given encontró collection activa
When procesa con OpenAI
Then envía webhook igual que email
And channel = 'whatsapp'
```

#### Notas Técnicas
- **Normalización de teléfono:**
```typescript
function normalizePhone(phone: string): string {
  // Remover 'whatsapp:' prefix de Twilio
  // Normalizar a formato +52XXXXXXXXXX
}
```
- **API de lookup:** Crear endpoint interno para N8N
  - `GET /api/internal/lookup-contact?phone=+521234567890`
  - Retorna: contact_id, collection_id (si existe activa)
- **Seguridad:** Endpoint interno protegido con API key

#### Prerequisitos
- Story 5.1 completada

---

### Story 5.3: Endpoint de Customer Response

**Como** sistema,
**Quiero** endpoint que reciba respuestas desde N8N,
**Para que** se registren en nuestra base de datos.

#### Criterios de Aceptación

**Scenario: Recibir webhook válido**
```gherkin
Given N8N envía POST a /api/webhooks/customer-response
And firma HMAC es válida
When se procesa
Then se crea registro en customer_responses:
  | Campo | Valor |
  | tenant_id | del payload |
  | collection_id | del payload |
  | channel | email o whatsapp |
  | raw_content | texto original |
  | ai_interpretation | JSON de OpenAI |
  | status | pending_review |
  | received_at | now |
```

**Scenario: Actualizar collection**
```gherkin
Given se creó customer_response
When se actualizan relaciones
Then collection se actualiza:
  | Campo | Valor |
  | customer_responded | true |
  | status | pending_review |
  | last_response_at | now |
And playbook se pausa (no enviar siguiente mensaje)
```

**Scenario: Firma inválida**
```gherkin
Given webhook llega sin firma válida
When se valida
Then retorna 401 Unauthorized
And no se crea registro
And se registra intento en logs
```

**Scenario: Collection no encontrada**
```gherkin
Given collection_id no existe o no pertenece al tenant
When se procesa
Then retorna 404 Not Found
And log registra el error
```

**Scenario: Payload inválido**
```gherkin
Given payload no tiene campos requeridos
When se valida
Then retorna 400 Bad Request
And mensaje indica campos faltantes
```

#### Notas Técnicas
- **Ruta:** `src/app/api/webhooks/customer-response/route.ts`
- **Validación HMAC:**
```typescript
import crypto from 'crypto';

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```
- **Schema de validación:** `src/lib/validations/webhook-schemas.ts`
```typescript
export const customerResponseWebhookSchema = z.object({
  tenant_id: z.string().uuid(),
  collection_id: z.string().uuid(),
  channel: z.enum(['email', 'whatsapp']),
  raw_content: z.string().min(1),
  ai_interpretation: z.object({
    intent: z.string(),
    suggested_action: z.string(),
    extracted_data: z.record(z.any()).optional(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  }),
  external_message_id: z.string().optional(),
});
```

#### Prerequisitos
- Story 5.1 completada

---

### Story 5.4: Bandeja de Respuestas Pendientes

**Como** Miguel,
**Quiero** ver una bandeja de respuestas pendientes de revisión,
**Para que** pueda procesar las respuestas eficientemente.

#### Criterios de Aceptación

**Scenario: Lista de respuestas pendientes**
```gherkin
Given estoy en /responses
When la página carga
Then veo lista de cards con status = 'pending_review'
And ordenadas por received_at ASC (más antiguas primero)
```

**Scenario: Contenido de cada card**
```gherkin
Given hay respuesta pendiente
Then la card muestra:
  | Campo | Valor |
  | Empresa | company.name |
  | Factura | invoice.invoice_number - amount |
  | Contacto | contact.first_name + last_name |
  | Preview | Primeras 100 chars de raw_content |
  | Intent Badge | ai_interpretation.intent |
  | Acción Sugerida | ai_interpretation.suggested_action |
  | Confianza | ai_interpretation.confidence como % |
  | Tiempo | received_at como "hace X minutos" |
```

**Scenario: Badges de intent**
```gherkin
Given respuesta tiene intent
Then badge tiene color correspondiente:
  | Intent | Color |
  | confirmar_pago | green |
  | ya_pago | blue |
  | solicitar_extension | yellow |
  | disputa | red |
  | otro | gray |
```

**Scenario: Acciones rápidas en card**
```gherkin
Given veo una card de respuesta
Then veo botones:
  | Botón | Acción |
  | Aprobar | Ejecuta sugerencia de IA |
  | Manual | Abre dialog de acción manual |
  | Contexto | Abre Sheet lateral |
```

**Scenario: Contador en navegación**
```gherkin
Given hay 5 respuestas pendientes
When veo el sidebar
Then "Respuestas" muestra badge con "5"
```

**Scenario: Lista vacía**
```gherkin
Given no hay respuestas pendientes
When veo /responses
Then veo mensaje "No hay respuestas pendientes"
And icono de inbox vacío
```

#### Notas Técnicas
- **Ruta:** `src/app/(dashboard)/responses/page.tsx`
- **Componentes:**
  - `src/components/responses/response-card.tsx`
  - `src/components/responses/intent-badge.tsx`
- **Query:**
```typescript
const responses = await supabase
  .from('customer_responses')
  .select(`
    *,
    collection:collections(
      invoice:invoices(invoice_number, amount, currency),
      company:companies(name),
      primary_contact:contacts(first_name, last_name)
    )
  `)
  .eq('status', 'pending_review')
  .order('received_at', { ascending: true });
```
- **UI:** Cards con shadcn/ui Card, Badge

#### Prerequisitos
- Story 5.3 completada

---

### Story 5.5: Aprobar Sugerencia de IA

**Como** Miguel,
**Quiero** aprobar la sugerencia de IA con 1 click,
**Para que** pueda procesar respuestas rápidamente.

#### Criterios de Aceptación

**Scenario: Aprobar "marcar_fecha_confirmada"**
```gherkin
Given respuesta tiene suggested_action = 'marcar_fecha_confirmada'
And extracted_data.payment_date = '2024-01-15'
When hago click en "Aprobar"
Then:
  - Invoice.confirmed_payment_date = '2024-01-15'
  - Invoice.payment_status = 'fecha_confirmada'
  - Collection.status = 'awaiting_response'
  - CustomerResponse.status = 'processed'
  - CustomerResponse.admin_action_taken = 'approved_ai_suggestion'
  - CustomerResponse.processed_by_user_id = mi ID
  - CustomerResponse.processed_at = now
```

**Scenario: Aprobar "marcar_pagada"**
```gherkin
Given suggested_action = 'marcar_pagada'
When hago click en "Aprobar"
Then veo Dialog solicitando payment_reference
When ingreso referencia y confirmo
Then:
  - Invoice.payment_status = 'pagada'
  - Invoice.paid_date = hoy
  - Invoice.payment_reference = lo que ingresé
  - Collection.status = 'completed'
  - Collection.completed_at = now
```

**Scenario: Aprobar "escalar"**
```gherkin
Given suggested_action = 'escalar'
When hago click en "Aprobar"
Then:
  - Invoice.payment_status = 'escalada'
  - Collection.status = 'escalated'
```

**Scenario: Aprobar "revisar_manual"**
```gherkin
Given suggested_action = 'revisar_manual'
When hago click en "Aprobar"
Then:
  - CustomerResponse.status = 'processed'
  - CustomerResponse.admin_action_taken = 'approved_ai_suggestion'
  - No hay cambios en Invoice ni Collection
```

**Scenario: Card desaparece de bandeja**
```gherkin
Given aprobé una respuesta
When la operación completa
Then la card desaparece de la lista
And veo toast de confirmación
```

#### Notas Técnicas
- **API:** `POST /api/customer-responses/[id]/process`
- **Payload:**
```typescript
interface ProcessResponsePayload {
  action: 'approve' | 'manual';
  // Para approve, usa suggested_action del ai_interpretation
  // Para manual, incluye campos específicos
}
```
- **Transacción:** Actualizar response + invoice + collection en transacción
- **Componente:** Modificar `response-card.tsx` para llamar API

#### Prerequisitos
- Story 5.4 completada

---

### Story 5.6: Acción Manual Override

**Como** Miguel,
**Quiero** procesar respuestas manualmente cuando la IA no acierta,
**Para que** pueda manejar casos que la IA no entiende.

#### Criterios de Aceptación

**Scenario: Abrir dialog de acción manual**
```gherkin
Given estoy viendo una respuesta
When hago click en "Manual"
Then veo Dialog con opciones:
  | Opción | Descripción |
  | Marcar Fecha Confirmada | DatePicker para fecha |
  | Marcar como Pagada | Input para referencia |
  | Escalar | Confirmar escalamiento |
  | Solo Marcar Procesada | Sin cambios en factura |
  | Reanudar Playbook | Continuar enviando mensajes |
```

**Scenario: Marcar fecha confirmada manualmente**
```gherkin
Given selecciono "Marcar Fecha Confirmada"
And elijo fecha en DatePicker
And opcionalmente agrego notas
When confirmo
Then:
  - Invoice.confirmed_payment_date = fecha seleccionada
  - Invoice.payment_status = 'fecha_confirmada'
  - CustomerResponse.admin_action_taken = 'manual_override'
  - CustomerResponse.admin_notes = mis notas
```

**Scenario: Marcar pagada manualmente**
```gherkin
Given selecciono "Marcar como Pagada"
And ingreso payment_reference
And opcionalmente selecciono paid_date (default hoy)
When confirmo
Then:
  - Invoice.payment_status = 'pagada'
  - Invoice.paid_date = fecha
  - Invoice.payment_reference = referencia
  - Collection.status = 'completed'
```

**Scenario: Reanudar playbook**
```gherkin
Given selecciono "Reanudar Playbook"
When confirmo
Then:
  - Collection.status = 'active'
  - Collection.customer_responded = false (reset)
  - Collection.next_action_at = now
  - CustomerResponse.admin_action_taken = 'manual_override'
  - Worker continuará con siguiente mensaje
```

**Scenario: Campo de notas siempre visible**
```gherkin
Given estoy en dialog manual
Then siempre veo textarea para admin_notes
And es opcional pero recomendado
```

#### Notas Técnicas
- **Componente:** `src/components/responses/manual-action-dialog.tsx`
- **API:** Mismo endpoint que approve, con action = 'manual'
- **Payload extendido:**
```typescript
interface ManualActionPayload {
  action: 'manual';
  manualAction: 'fecha_confirmada' | 'pagada' | 'escalar' | 'solo_procesar' | 'reanudar';
  data?: {
    confirmed_payment_date?: string;
    paid_date?: string;
    payment_reference?: string;
  };
  admin_notes?: string;
}
```

#### Prerequisitos
- Story 5.5 completada

---

### Story 5.7: Panel de Contexto Completo

**Como** Miguel,
**Quiero** ver todo el contexto antes de procesar una respuesta,
**Para que** tome la mejor decisión.

#### Criterios de Aceptación

**Scenario: Abrir panel de contexto**
```gherkin
Given estoy en bandeja de respuestas
When hago click en "Contexto" o en la card
Then se abre Sheet lateral derecho
```

**Scenario: Tab "Factura"**
```gherkin
Given estoy en panel de contexto
When veo tab "Factura"
Then veo:
  | Campo | Valor |
  | Número | invoice.invoice_number |
  | Monto | invoice.amount + currency |
  | Vencimiento | invoice.due_date |
  | Estado | invoice.payment_status (badge) |
  | Días vencida | calculado |
  | Empresa | company.name |
```

**Scenario: Tab "Historial"**
```gherkin
Given veo tab "Historial"
Then veo timeline con:
  - Mensajes enviados (con preview)
  - Respuestas anteriores (si hay)
  - Cambios de estado de collection
And ordenado cronológicamente
```

**Scenario: Tab "Respuesta Actual"**
```gherkin
Given veo tab "Respuesta Actual"
Then veo:
  | Campo | Valor |
  | Contenido | raw_content completo |
  | Canal | email/whatsapp con icono |
  | Recibido | received_at |
  | Intent | badge con ai_interpretation.intent |
  | Acción Sugerida | ai_interpretation.suggested_action |
  | Confianza | ai_interpretation.confidence como % |
  | Razonamiento | ai_interpretation.reasoning |
  | Datos Extraídos | ai_interpretation.extracted_data |
```

**Scenario: Acciones desde panel**
```gherkin
Given estoy en panel de contexto
Then veo botones en footer:
  | Botón | Acción |
  | Aprobar Sugerencia | Igual que en card |
  | Acción Manual | Abre dialog manual |
```

**Scenario: Datos extraídos formateados**
```gherkin
Given ai_interpretation.extracted_data tiene valores
When veo la sección
Then muestra como lista:
  - Fecha de pago: 15 de enero 2024
  - Referencia: TRF-12345
  - Notas: "Mencionó que depositará por transferencia"
```

#### Notas Técnicas
- **Componente:** `src/components/responses/context-sheet.tsx`
- **UI:** Sheet de shadcn/ui con Tabs
- **Queries:**
  - Invoice completa
  - Company y contacts
  - sent_messages de la collection
  - customer_responses anteriores
- **Timeline:** Reusar componente de collection timeline

#### Prerequisitos
- Story 5.4 completada

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] N8N workflows configurados y exportados
- [ ] Webhook recibiendo y procesando respuestas
- [ ] Bandeja de respuestas funcional
- [ ] Aprobar con 1 click funcionando
- [ ] Override manual con todas las opciones
- [ ] Panel de contexto completo
- [ ] Tests de integración con mocks de N8N/OpenAI
- [ ] Documentación de playbook manual cuando N8N está down

---

**Última actualización:** 2025-12-01
**Estado:** 🔜 Pendiente
