---
id: epic-4
title: "Comunicación por Email"
status: pending
priority: high
dependencies: [epic-3]
stories_count: 3
frs_covered: [FR21, FR23, FR24]
---

# Epic 4: Comunicación por Email

## Objetivo
Enviar mensajes de cobranza por email con tracking completo de entrega.

## Valor para el Usuario
Los mensajes llegan a los clientes por email, con visibilidad total del estado de entrega.

## Decisiones Arquitectónicas
- **ADR-004:** Email Provider → Resend
- **ADR-005:** WhatsApp → Postponed a Epic 5

## FRs Cubiertos
- **FR21:** Envío de emails transaccionales
- **FR23:** Historial de mensajes enviados
- **FR24:** Webhooks de delivery status

> **Nota:** FR22 (WhatsApp) movido a Epic 5 por decisión de equipo (ver ADR-005)

## Contexto Técnico

### Integraciones
| Servicio | SDK | Versión | Uso |
|----------|-----|---------|-----|
| Resend | resend | ^4.0.0 | Email transaccional |

### Variables de Entorno
```bash
# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="cobranzas@tudominio.com"
RESEND_FROM_NAME="Cobranzas - TuEmpresa"
```

### Schema: SentMessage
```prisma
model SentMessage {
  id                 String    @id @default(uuid()) @db.Uuid
  tenantId           String    @db.Uuid
  collectionId       String    @db.Uuid
  playbookMessageId  String?   @db.Uuid
  contactId          String    @db.Uuid
  channel            String    // email (whatsapp en Epic 5)
  subject            String?   // solo email
  body               String
  deliveryStatus     String    @default("pending")
  sentAt             DateTime?
  deliveredAt        DateTime?
  wasAiGenerated     Boolean   @default(false)
  temperatureUsed    String?
  externalMessageId  String?   // ID de Resend

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  collection      Collection      @relation(fields: [collectionId], references: [id])
  playbookMessage PlaybookMessage? @relation(fields: [playbookMessageId], references: [id])
  contact         Contact         @relation(fields: [contactId], references: [id])
}
```

### Estados de Delivery
| Estado | Descripción |
|--------|-------------|
| `pending` | Preparado para enviar |
| `sent` | Enviado al proveedor |
| `delivered` | Confirmado entregado |
| `bounced` | Rebotado |
| `failed` | Falló permanentemente |

---

## Stories

### Story 4.1: Envío de Emails Transaccionales

**Como** sistema,
**Quiero** enviar emails de cobranza via Resend,
**Para que** los clientes reciban notificaciones por correo.

#### Criterios de Aceptación

**Scenario: Enviar email exitosamente**
```gherkin
Given el worker necesita enviar un mensaje por email
When llama a sendEmail(to, subject, body)
Then email se envía via Resend API
And retorna external_message_id
```

**Scenario: Crear registro de mensaje enviado**
```gherkin
Given email se envió correctamente
Then se crea registro en sent_messages:
  | Campo | Valor |
  | channel | email |
  | delivery_status | sent |
  | external_message_id | resend_id |
  | sent_at | timestamp |
```

**Scenario: Formatear email HTML**
```gherkin
Given body es texto plano con saltos de línea
When se envía el email
Then el body se convierte a HTML básico
And los saltos de línea son <br>
And hay wrapper con estilos corporativos
```

**Scenario: Manejo de error de envío**
```gherkin
Given Resend API retorna error
When intento enviar
Then delivery_status = 'failed'
And error se registra en logs
And se lanza excepción para que worker maneje
```

**Scenario: Rate limiting**
```gherkin
Given Resend retorna 429 (rate limit)
When intento enviar
Then reintento con backoff exponencial
And máximo 3 reintentos
```

#### Notas Técnicas
- **Servicio:** `src/lib/services/email-service.ts`
- **Implementación:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const html = formatBodyAsHtml(body);

  const { data, error } = await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }

  return data!.id;
}

function formatBodyAsHtml(body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${body.replace(/\n/g, '<br>')}
    </div>
  `;
}
```
- **Logging:** Registrar todos los intentos de envío

#### Prerequisitos
- Story 3.4 (schema collections)

---

### Story 4.2: Historial de Mensajes Enviados

**Como** Miguel,
**Quiero** ver el historial completo de mensajes por cobranza,
**Para que** tenga trazabilidad de toda la comunicación.

#### Criterios de Aceptación

**Scenario: Timeline de mensajes**
```gherkin
Given estoy en detalle de collection
When veo tab "Mensajes"
Then veo timeline con mensajes ordenados por fecha:
  | Columna | Descripción |
  | Fecha/Hora | sent_at formateado |
  | Canal | Icono Email |
  | Subject | Asunto del email |
  | Preview | Primeras 100 caracteres |
  | Estado | Badge con delivery_status |
```

**Scenario: Iconos de canal**
```gherkin
Given mensaje tiene channel = 'email'
Then veo icono Mail de Lucide
```

**Scenario: Badges de estado**
```gherkin
Given delivery_status del mensaje
Then veo badge correspondiente:
  | Status | Badge | Color |
  | pending | Pendiente | gray |
  | sent | Enviado | blue |
  | delivered | Entregado | green |
  | bounced | Rebotado | orange |
  | failed | Fallido | red |
```

**Scenario: Ver contenido completo**
```gherkin
Given hago click en un mensaje del timeline
When se abre Dialog
Then veo:
  | Campo | Valor |
  | Asunto | subject |
  | Contenido | body completo |
  | Enviado a | contact.email |
  | Fecha envío | sent_at |
  | Fecha entrega | delivered_at |
  | ID externo | external_message_id |
```

**Scenario: Mensaje sin entregar**
```gherkin
Given mensaje tiene delivery_status = 'bounced'
When veo el detalle
Then veo indicador visual de problema
And veo nota "El mensaje no pudo ser entregado"
```

#### Notas Técnicas
- **Ruta:** `src/app/(dashboard)/collections/[id]/page.tsx`
- **Componentes:**
  - `src/components/collections/message-timeline.tsx`
  - `src/components/collections/message-detail-dialog.tsx`
- **Query:**
```typescript
const messages = await supabase
  .from('sent_messages')
  .select('*, contact:contacts(first_name, last_name, email, phone)')
  .eq('collection_id', collectionId)
  .order('sent_at', { ascending: true });
```
- **UI:** Timeline vertical con Separator + iconos Lucide

#### Prerequisitos
- Story 4.1 completada

---

### Story 4.3: Webhooks de Delivery Status

**Como** sistema,
**Quiero** recibir webhooks de estado de entrega de Resend,
**Para que** el estado de mensajes esté siempre actualizado.

#### Criterios de Aceptación

**Scenario: Webhook de Resend**
```gherkin
Given Resend envía evento de delivery
When POST llega a /api/webhooks/resend
Then se procesa el evento
And se busca sent_message por external_message_id
And se actualiza delivery_status
```

**Scenario: Eventos de Resend soportados**
```gherkin
Given diferentes eventos de Resend
Then se mapean a delivery_status:
  | Evento Resend | delivery_status |
  | email.delivered | delivered |
  | email.bounced | bounced |
  | email.complained | failed |
  | email.sent | sent |
```

**Scenario: Actualizar timestamps**
```gherkin
Given evento indica entrega exitosa
When se procesa
Then delivered_at = timestamp del evento
And updated_at = now
```

**Scenario: Idempotencia**
```gherkin
Given mismo evento llega 2 veces
When se procesa
Then no hay error
And el resultado es el mismo
```

**Scenario: Validar firma de webhook**
```gherkin
Given webhook no tiene firma válida
When llega a endpoint
Then retorna 401 Unauthorized
And no se procesa
```

**Scenario: Logging de eventos**
```gherkin
Given llega cualquier webhook
When se procesa
Then se registra en logs:
  | Campo | Valor |
  | event_type | tipo de evento |
  | message_id | external_message_id |
  | status | nuevo status |
  | timestamp | cuando llegó |
```

#### Notas Técnicas
- **Ruta:** `src/app/api/webhooks/resend/route.ts`
- **Implementación:**
```typescript
import { Webhook } from 'svix';

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };

  // Verificar firma
  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
  let event: ResendWebhookEvent;

  try {
    event = wh.verify(payload, headers) as ResendWebhookEvent;
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  // Procesar evento
  const messageId = event.data.email_id;
  const status = mapResendEvent(event.type);

  if (status) {
    await supabase
      .from('sent_messages')
      .update({
        delivery_status: status,
        delivered_at: status === 'delivered' ? new Date() : null,
      })
      .eq('external_message_id', messageId);
  }

  return new Response('OK', { status: 200 });
}

function mapResendEvent(eventType: string): string | null {
  const mapping: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.complained': 'failed',
  };
  return mapping[eventType] ?? null;
}
```
- **Dependencia:** `pnpm add svix` (para verificación de webhooks)
- **Configurar webhook en Resend Dashboard:**
  - URL: `https://tu-dominio.com/api/webhooks/resend`
  - Eventos: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`

#### Prerequisitos
- Story 4.1 completada
- Dominio verificado en Resend

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] Emails enviándose correctamente via Resend
- [ ] Timeline de mensajes visible en UI
- [ ] Webhooks recibiendo y actualizando status
- [ ] Logging completo de envíos
- [ ] Manejo de errores robusto
- [ ] Tests de integración con mocks de Resend

---

## Notas de Migración

Este epic originalmente incluía WhatsApp (Story 4.2 original).
Por decisión de equipo (ADR-005), WhatsApp se movió a Epic 5.

Las stories fueron renumeradas:
- 4.1: Envío de Emails (sin cambios)
- 4.2: Historial de Mensajes (antes 4.3)
- 4.3: Webhooks (antes 4.4)

---

**Última actualización:** 2025-12-05
**Estado:** Pendiente
