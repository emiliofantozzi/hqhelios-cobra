# Story 4.3: Webhooks de Delivery Status

Status: Done

## Story

**Como** sistema,
**Quiero** recibir webhooks de estado de entrega de Resend,
**Para que** el estado de mensajes esté siempre actualizado.

## Acceptance Criteria

### AC1: Webhook de Resend
```gherkin
Given Resend envía evento de delivery
When POST llega a /api/webhooks/resend
Then se procesa el evento
And se busca sent_message por external_message_id
And se actualiza delivery_status
```

### AC2: Eventos de Resend soportados
```gherkin
Given diferentes eventos de Resend
Then se mapean a delivery_status:
  | Evento Resend | delivery_status |
  | email.sent | sent |
  | email.delivered | delivered |
  | email.bounced | bounced |
  | email.complained | failed |
```

### AC3: Actualizar timestamps
```gherkin
Given evento indica entrega exitosa
When se procesa
Then delivered_at = timestamp del evento
And updated_at = now
```

### AC4: Idempotencia
```gherkin
Given mismo evento llega 2 veces
When se procesa
Then no hay error
And el resultado es el mismo
```

### AC5: Validar firma de webhook
```gherkin
Given webhook no tiene firma válida
When llega a endpoint
Then retorna 401 Unauthorized
And no se procesa
```

### AC6: Logging de eventos
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

## Tasks / Subtasks

- [x] Task 1: Crear schema de validación Zod (AC: 1, 2)
  - [x] 1.1: Crear `src/lib/validations/resend-webhook-schema.ts`
  - [x] 1.2: Definir `ResendWebhookEvent` type con data.email_id
  - [x] 1.3: Schema Zod para validar estructura del payload

- [x] Task 2: Crear endpoint webhook (AC: 1, 5, 6)
  - [x] 2.1: Crear `src/app/api/webhooks/resend/route.ts`
  - [x] 2.2: POST handler que recibe payload
  - [x] 2.3: Extraer headers svix (svix-id, svix-timestamp, svix-signature)
  - [x] 2.4: Verificar firma con svix Webhook class
  - [x] 2.5: Retornar 401 si firma inválida
  - [x] 2.6: Logging estructurado JSON de cada evento

- [x] Task 3: Mapear eventos y actualizar BD (AC: 2, 3, 4)
  - [x] 3.1: Implementar función `mapResendEvent(eventType)` → delivery_status | null
  - [x] 3.2: Query UPDATE sent_messages WHERE external_message_id = ?
  - [x] 3.3: Si status = 'delivered' → set delivered_at = evento timestamp
  - [x] 3.4: Si mensaje no existe → log warning, retornar 200 OK (idempotencia)

- [x] Task 4: Tests (AC: todos)
  - [x] 4.1: Test de firma válida → procesa evento
  - [x] 4.2: Test de firma inválida → 401
  - [x] 4.3: Test de mapeo de todos los eventos
  - [x] 4.4: Test de idempotencia (mismo evento 2 veces)
  - [x] 4.5: Test de mensaje no encontrado → 200 OK

- [x] Task 5: Actualizar status
  - [x] 5.1: Actualizar sprint-status.yaml → 4-3-webhooks-de-delivery-status: done

## Dev Notes

### Headers de Resend Webhook

Resend envía webhooks con headers svix para verificación:
- `svix-id`: ID único del webhook
- `svix-timestamp`: Timestamp de envío
- `svix-signature`: Firma HMAC para verificación

### Payload de Resend

```typescript
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained';
  created_at: string; // ISO timestamp
  data: {
    email_id: string;  // Este es el external_message_id que guardamos
    from: string;
    to: string[];
    subject: string;
    // ... otros campos
  };
}
```

### Variables de Entorno

Ya configuradas según Story 4.1:
```bash
RESEND_WEBHOOK_SECRET=whsec_...
```

Configurar en Resend Dashboard:
- URL: `https://tu-dominio.com/api/webhooks/resend`
- Eventos: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`

### Project Structure Notes

**Archivos creados:**
- `src/app/api/webhooks/resend/route.ts` (endpoint principal)
- `src/lib/validations/resend-webhook-schema.ts` (schema Zod)
- `__tests__/api/webhooks-resend.test.ts` (tests)

**Archivos de referencia (no modificar):**
- `src/lib/db/supabase.ts` - getAdminSupabaseClient
- `src/lib/services/sent-message-service.ts` - referencia de patrones

### Patrones del Proyecto

Seguir patrones de Story 4.1 y 4.2:
- **JSDoc obligatorio** para funciones exportadas
- **Logging estructurado JSON** con level, component, message, timestamp
- **svix** ya instalado (package.json tiene svix ^1.81.0)
- **Zod** para validación de payloads
- **getAdminSupabaseClient()** para queries sin RLS (webhook no tiene auth)

### Decisiones de Implementación

1. **Retornar 200 OK siempre** después de firma válida (evitar retries innecesarios)
2. **Log warning** si mensaje no existe (puede ser race condition o test)
3. **No usar RLS** - webhook no tiene auth, usa getAdminSupabaseClient
4. **Idempotencia natural** - UPDATE con mismo valor no causa error
5. **Validar firma ANTES** de cualquier procesamiento

### References

- [Source: docs/epics/epic-4-comunicacion.md#Story 4.3]
- [Source: docs/architecture.md#Patrones de Implementación]
- [Source: docs/sprint-artifacts/4-1-envio-de-emails-transaccionales.md]
- [Source: docs/sprint-artifacts/4-2-historial-de-mensajes-enviados.md]
- [Source: https://resend.com/docs/webhooks]

## Dev Agent Record

### Context Reference

Context paths analyzed for this story:
- docs/epics/epic-4-comunicacion.md (Epic 4 requirements)
- docs/architecture.md (Patterns, logging, error handling)
- docs/sprint-artifacts/4-1-envio-de-emails-transaccionales.md (Previous story patterns)
- docs/sprint-artifacts/4-2-historial-de-mensajes-enviados.md (UI that displays delivery_status)
- prisma/schema.prisma (SentMessage model with external_message_id)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Build: ✅ Passed
- Tests: 16/16 passed (__tests__/api/webhooks-resend.test.ts)
- Lint: N/A (ESLint no configurado)

### Completion Notes List
- AC1 ✅: POST /api/webhooks/resend procesa eventos y busca por external_message_id
- AC2 ✅: Mapeo completo: email.sent→sent, email.delivered→delivered, email.bounced→bounced, email.complained→failed
- AC3 ✅: delivered_at se actualiza con created_at del evento cuando status='delivered'
- AC4 ✅: Idempotencia natural - mismo evento 2 veces no causa error, retorna 200 OK
- AC5 ✅: Validación de firma svix, retorna 401 si inválida
- AC6 ✅: Logging estructurado JSON con level, component, message, timestamp

### Implementation Notes
- Endpoint no usa RLS (webhook no tiene auth) - usa getAdminSupabaseClient
- Retorna 200 OK siempre después de firma válida (evita retries innecesarios)
- Mensaje no encontrado = warning log pero 200 OK (race condition posible)
- svix ^1.81.0 ya instalado desde Story 4.1

### File List
**Archivos creados:**
- src/app/api/webhooks/resend/route.ts (endpoint principal - 120 líneas)
- src/lib/validations/resend-webhook-schema.ts (schema Zod - 30 líneas)
- __tests__/api/webhooks-resend.test.ts (14 tests - 220 líneas)

**Archivos modificados:**
- docs/sprint-artifacts/sprint-status.yaml (4.3 done, epic-4 done)

**Total:** 3 archivos nuevos + 1 modificación

### Change Log
| Fecha | Cambio |
|-------|--------|
| 2025-12-08 | Implementación completa - 14 tests, build exitoso |
| 2025-12-08 | Code Review fixes: H1-Zod validation, H2-400 status, M1-schema tests, M2-UPDATE count, L1-cleanup |
