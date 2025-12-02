---
id: epic-4
title: "Comunicación Multicanal"
status: pending
priority: high
dependencies: [epic-3]
stories_count: 4
frs_covered: [FR21, FR22, FR23, FR24]
---

# Epic 4: Comunicación Multicanal 📧

## Objetivo
Enviar mensajes por email y WhatsApp con tracking completo de entrega.

## Valor para el Usuario
Los mensajes llegan a los clientes por el canal más efectivo, con visibilidad total del estado de entrega.

## FRs Cubiertos
- **FR21:** Envío de emails transaccionales
- **FR22:** Envío de WhatsApp
- **FR23:** Historial de mensajes enviados
- **FR24:** Webhooks de delivery status

## Contexto Técnico

### Integraciones
| Servicio | SDK | Versión | Uso |
|----------|-----|---------|-----|
| SendGrid | @sendgrid/mail | 8.1.3 | Email transaccional |
| Twilio | twilio | 5.2.2 | WhatsApp Business API |

### Variables de Entorno
```bash
# SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="cobranzas@tudominio.com"
SENDGRID_FROM_NAME="Cobranzas - TuEmpresa"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="+14155238886"  # Sandbox
```

### Schema: SentMessage
```prisma
model SentMessage {
  id                 String    @id @default(uuid()) @db.Uuid
  tenantId           String    @db.Uuid
  collectionId       String    @db.Uuid
  playbookMessageId  String?   @db.Uuid
  contactId          String    @db.Uuid
  channel            String    // email, whatsapp
  subject            String?   // solo email
  body               String
  deliveryStatus     String    @default("pending")
  sentAt             DateTime?
  deliveredAt        DateTime?
  wasAiGenerated     Boolean   @default(false)
  temperatureUsed    String?
  externalMessageId  String?   // ID de SendGrid/Twilio

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
**Quiero** enviar emails de cobranza,
**Para que** los clientes reciban notificaciones por correo.

#### Criterios de Aceptación

**Scenario: Enviar email exitosamente**
```gherkin
Given el worker necesita enviar un mensaje por email
When llama a sendEmail(to, subject, body)
Then email se envía via SendGrid API
And retorna external_message_id
```

**Scenario: Crear registro de mensaje enviado**
```gherkin
Given email se envió correctamente
Then se crea registro en sent_messages:
  | Campo | Valor |
  | channel | email |
  | delivery_status | sent |
  | external_message_id | sg_message_id |
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
Given SendGrid API retorna error
When intento enviar
Then delivery_status = 'failed'
And error se registra en logs
And se lanza excepción para que worker maneje
```

**Scenario: Rate limiting de SendGrid**
```gherkin
Given SendGrid retorna 429 (rate limit)
When intento enviar
Then reintento con backoff exponencial
And máximo 3 reintentos
```

#### Notas Técnicas
- **Servicio:** `src/lib/services/message-service.ts`
- **Implementación:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const html = formatBodyAsHtml(body);

  const [response] = await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: process.env.SENDGRID_FROM_NAME!,
    },
    subject,
    html,
  });

  return response.headers['x-message-id'];
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

### Story 4.2: Envío de WhatsApp

**Como** sistema,
**Quiero** enviar mensajes de WhatsApp,
**Para que** los clientes reciban notificaciones en su canal preferido.

#### Criterios de Aceptación

**Scenario: Enviar WhatsApp exitosamente**
```gherkin
Given el worker necesita enviar por WhatsApp
When llama a sendWhatsApp(to, body)
Then mensaje se envía via Twilio API
And retorna message_sid
```

**Scenario: Validar formato de número**
```gherkin
Given número es "5512345678"
When se procesa para envío
Then se formatea como "+525512345678"
And incluye código de país México
```

**Scenario: Número inválido**
```gherkin
Given número tiene formato incorrecto
When intento enviar
Then veo error "Número de teléfono inválido"
And no se intenta envío
And delivery_status = 'failed'
```

**Scenario: Sandbox para desarrollo**
```gherkin
Given estoy en ambiente de desarrollo
When envío WhatsApp
Then usa número sandbox de Twilio
And solo funciona con números que hicieron opt-in
```

**Scenario: Registro de mensaje enviado**
```gherkin
Given WhatsApp se envió correctamente
Then se crea registro en sent_messages:
  | Campo | Valor |
  | channel | whatsapp |
  | delivery_status | sent |
  | external_message_id | twilio_sid |
```

#### Notas Técnicas
- **Implementación:**
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsApp(
  to: string,
  body: string
): Promise<string> {
  const formattedTo = formatPhoneNumber(to);

  const message = await client.messages.create({
    body,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${formattedTo}`,
  });

  return message.sid;
}

function formatPhoneNumber(phone: string): string {
  // Remover caracteres no numéricos
  const digits = phone.replace(/\D/g, '');

  // Si no tiene código de país, asumir México
  if (digits.length === 10) {
    return `+52${digits}`;
  }

  // Si ya tiene código de país
  if (!digits.startsWith('+')) {
    return `+${digits}`;
  }

  return digits;
}
```
- **Sandbox:** Documentar proceso de opt-in para testing

#### Prerequisitos
- Story 4.1 completada

---

### Story 4.3: Historial de Mensajes Enviados

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
  | Canal | Icono Email/WhatsApp |
  | Subject | Solo si email |
  | Preview | Primeras 100 caracteres |
  | Estado | Badge con delivery_status |
```

**Scenario: Iconos de canal**
```gherkin
Given mensaje tiene channel = 'email'
Then veo icono Mail de Lucide
Given mensaje tiene channel = 'whatsapp'
Then veo icono MessageCircle de Lucide
```

**Scenario: Badges de estado**
```gherkin
Given delivery_status del mensaje
Then veo badge correspondiente:
  | Status | Badge | Color |
  | pending | ⏳ Pendiente | gray |
  | sent | ✈️ Enviado | blue |
  | delivered | ✅ Entregado | green |
  | bounced | ↩️ Rebotado | orange |
  | failed | ❌ Fallido | red |
```

**Scenario: Ver contenido completo**
```gherkin
Given hago click en un mensaje del timeline
When se abre Dialog
Then veo:
  | Campo | Valor |
  | Asunto | subject (si email) |
  | Contenido | body completo |
  | Enviado a | contact.email o phone |
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
- Story 4.1 y 4.2 completadas

---

### Story 4.4: Webhooks de Delivery Status

**Como** sistema,
**Quiero** recibir webhooks de estado de entrega,
**Para que** el estado de mensajes esté siempre actualizado.

#### Criterios de Aceptación

**Scenario: Webhook de SendGrid**
```gherkin
Given SendGrid envía evento de delivery
When POST llega a /api/webhooks/sendgrid
Then se procesa el evento
And se busca sent_message por external_message_id
And se actualiza delivery_status
```

**Scenario: Eventos de SendGrid soportados**
```gherkin
Given diferentes eventos de SendGrid
Then se mapean a delivery_status:
  | Evento SendGrid | delivery_status |
  | delivered | delivered |
  | bounce | bounced |
  | dropped | failed |
  | deferred | sent (sin cambio) |
```

**Scenario: Webhook de Twilio**
```gherkin
Given Twilio envía status callback
When POST llega a /api/webhooks/twilio
Then se procesa el evento
And se actualiza según MessageStatus:
  | Status Twilio | delivery_status |
  | delivered | delivered |
  | read | delivered |
  | failed | failed |
  | undelivered | bounced |
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
- **Rutas:**
  - `src/app/api/webhooks/sendgrid/route.ts`
  - `src/app/api/webhooks/twilio/route.ts`
- **SendGrid webhook:**
```typescript
export async function POST(request: Request) {
  const events = await request.json();

  for (const event of events) {
    const messageId = event.sg_message_id;
    const eventType = event.event;

    const status = mapSendGridEvent(eventType);
    if (!status) continue;

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
```
- **Twilio webhook:**
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const messageSid = formData.get('MessageSid') as string;
  const messageStatus = formData.get('MessageStatus') as string;

  // Validar firma
  const signature = request.headers.get('X-Twilio-Signature');
  if (!validateTwilioSignature(signature, formData)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const status = mapTwilioStatus(messageStatus);

  await supabase
    .from('sent_messages')
    .update({
      delivery_status: status,
      delivered_at: status === 'delivered' ? new Date() : null,
    })
    .eq('external_message_id', messageSid);

  return new Response('OK', { status: 200 });
}
```
- **Configurar webhooks:**
  - SendGrid: Settings > Mail Settings > Event Notification
  - Twilio: Configure webhook URL en número de WhatsApp

#### Prerequisitos
- Story 4.1 y 4.2 completadas

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] Emails enviándose correctamente via SendGrid
- [ ] WhatsApp enviándose via Twilio (sandbox)
- [ ] Timeline de mensajes visible en UI
- [ ] Webhooks recibiendo y actualizando status
- [ ] Logging completo de envíos
- [ ] Manejo de errores robusto
- [ ] Tests de integración con mocks de APIs

---

**Última actualización:** 2025-12-01
**Estado:** 🔜 Pendiente
