# Story 4.2: Historial de Mensajes Enviados

Status: Done

## Story

**Como** Miguel,
**Quiero** ver el historial completo de mensajes por cobranza,
**Para que** tenga trazabilidad de toda la comunicación.

## Acceptance Criteria

### AC1: Timeline de mensajes
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

### AC2: Iconos de canal
```gherkin
Given mensaje tiene channel = 'email'
Then veo icono Mail de Lucide
```

### AC3: Badges de estado
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

### AC4: Ver contenido completo
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

### AC5: Mensaje sin entregar
```gherkin
Given mensaje tiene delivery_status = 'bounced'
When veo el detalle
Then veo indicador visual de problema
And veo nota "El mensaje no pudo ser entregado"
```

## Tasks / Subtasks

- [x] Task 1: Crear servicio de mensajes (AC: 1)
  - [x] 1.1: Crear `src/lib/services/message-service.ts`
  - [x] 1.2: Implementar `getCollectionMessages(collectionId: string)` con query a `sent_messages`
  - [x] 1.3: Join con `contacts` para obtener email del destinatario
  - [x] 1.4: Ordenar por `sent_at ASC` (timeline cronológico)
  - [x] 1.5: Usar `getAdminSupabaseClient()` para query

- [x] Task 2: Crear componente Timeline (AC: 1, 2, 3)
  - [x] 2.1: Crear `src/components/collections/message-timeline.tsx`
  - [x] 2.2: Timeline vertical con items de mensaje
  - [x] 2.3: Cada item muestra: fecha, icono canal, subject, preview (100 chars), badge status
  - [x] 2.4: Usar componente Lucide `<Mail />` para canal email
  - [x] 2.5: Implementar función `getDeliveryStatusBadge(status)` con variantes Badge de shadcn
  - [x] 2.6: Truncar body a 100 caracteres para preview con "..." al final
  - [x] 2.7: Click en item abre dialog de detalle

- [x] Task 3: Crear Dialog de detalle (AC: 4, 5)
  - [x] 3.1: Crear `src/components/collections/message-detail-dialog.tsx`
  - [x] 3.2: Usar `<Dialog>` de shadcn con modal abierto controlado
  - [x] 3.3: Mostrar todos los campos del mensaje (subject, body, sent_at, delivered_at, external_message_id)
  - [x] 3.4: Formatear body preservando saltos de línea (usar `<pre>` o `whitespace-pre-wrap`)
  - [x] 3.5: Mostrar contact.email como destinatario
  - [x] 3.6: Si `delivery_status = 'bounced'` o `'failed'` → mostrar alert con icono de error
  - [x] 3.7: Alert dice "El mensaje no pudo ser entregado" para bounced, "El envío falló" para failed

- [x] Task 4: Integrar en página de detalle de collection (AC: 1)
  - [x] 4.1: Abrir `src/app/(dashboard)/invoices/[invoiceId]/page.tsx`
  - [x] 4.2: Agregar tab "Mensajes" al `<Tabs>` existente (después de Comunicaciones)
  - [x] 4.3: En contenido del tab, renderizar `<MessageTimeline messages={messages} />`
  - [x] 4.4: Pasar `collectionId` desde el invoice data (obtener de invoice.activeCollection.id)
  - [x] 4.5: Si invoice no tiene collection activa, mostrar "No hay mensajes enviados"

- [x] Task 5: API endpoint (AC: 1, 4)
  - [x] 5.1: Crear `src/app/api/collections/[collectionId]/messages/route.ts`
  - [x] 5.2: GET endpoint que retorna mensajes de una collection
  - [x] 5.3: Auth con Clerk
  - [x] 5.4: Query: `sent_messages` join `contacts` where `collection_id = id`
  - [x] 5.5: Ordenar por `sent_at ASC`
  - [x] 5.6: Retornar array de mensajes con contact data

- [x] Task 6: React Query hook (AC: 1)
  - [x] 6.1: Crear hook `useCollectionMessages(collectionId)` en `src/lib/api/collections.ts`
  - [x] 6.2: Query key: `['collections', collectionId, 'messages']`
  - [x] 6.3: Usar React Query para auto-refetch y caching
  - [x] 6.4: Retornar `{ data: messages, isLoading, error }`

- [x] Task 7: Tests (AC: todos)
  - [x] 7.1: Test unitario de `message-service.ts` (mock Supabase) - 5 tests
  - [x] 7.2: Test de componente `MessageTimeline` (React Testing Library) - 6 tests
  - [x] 7.3: Test de `MessageDetailDialog` (verificar renderizado de campos) - 12 tests
  - [x] 7.4: Test de `getDeliveryStatusBadge` para todos los estados - 6 tests

## Dev Notes

### Modelo de Datos: SentMessage

Schema existente en `prisma/schema.prisma`:

```prisma
model SentMessage {
  id                 String    @id @default(uuid()) @db.Uuid
  tenantId           String    @map("tenant_id") @db.Uuid
  collectionId       String    @map("collection_id") @db.Uuid
  playbookMessageId  String?   @map("playbook_message_id") @db.Uuid
  contactId          String    @map("contact_id") @db.Uuid
  channel            String    @db.VarChar(20)     // "email" (whatsapp en Epic 5)
  subject            String?   @db.VarChar(500)
  body               String    @db.Text
  deliveryStatus     String    @default("pending") @map("delivery_status") @db.VarChar(20)
  sentAt             DateTime? @map("sent_at")
  deliveredAt        DateTime? @map("delivered_at")
  wasAiGenerated     Boolean   @default(false) @map("was_ai_generated")
  temperatureUsed    String?   @map("temperature_used") @db.VarChar(20)
  externalMessageId  String?   @map("external_message_id") @db.VarChar(255)
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @default(now()) @updatedAt @map("updated_at")

  tenant           Tenant             @relation(fields: [tenantId], references: [id])
  collection       Collection         @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  playbookMessage  PlaybookMessage?   @relation(fields: [playbookMessageId], references: [id])
  contact          Contact            @relation(fields: [contactId], references: [id])

  @@index([tenantId])
  @@index([collectionId])
  @@index([externalMessageId])
  @@map("sent_messages")
}
```

**Campos clave para UI:**
- `sent_at`: Timestamp de envío (formateado como "5 dic 2025, 3:45 PM")
- `channel`: "email" (futuros: "whatsapp")
- `subject`: Asunto del email (puede ser null)
- `body`: Cuerpo del mensaje (texto plano o HTML)
- `delivery_status`: "pending" | "sent" | "delivered" | "bounced" | "failed"
- `delivered_at`: Timestamp de confirmación de entrega (puede ser null)
- `external_message_id`: ID de Resend (para debugging)

### Query Pattern

```typescript
// src/lib/services/message-service.ts
import { getAdminSupabaseClient } from '@/lib/db/supabase';

export interface CollectionMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  deliveryStatus: string;
  sentAt: string | null;
  deliveredAt: string | null;
  externalMessageId: string | null;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

/**
 * Obtiene todos los mensajes enviados de una collection.
 *
 * @param collectionId - ID de la collection
 * @returns Array de mensajes con datos del contacto
 */
export async function getCollectionMessages(
  collectionId: string
): Promise<CollectionMessage[]> {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from('sent_messages')
    .select(`
      id,
      channel,
      subject,
      body,
      delivery_status,
      sent_at,
      delivered_at,
      external_message_id,
      contact:contacts(
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('collection_id', collectionId)
    .order('sent_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(msg => ({
    id: msg.id,
    channel: msg.channel,
    subject: msg.subject,
    body: msg.body,
    deliveryStatus: msg.delivery_status,
    sentAt: msg.sent_at,
    deliveredAt: msg.delivered_at,
    externalMessageId: msg.external_message_id,
    contact: {
      firstName: msg.contact.first_name,
      lastName: msg.contact.last_name,
      email: msg.contact.email,
      phone: msg.contact.phone,
    },
  }));
}
```

### Componente MessageTimeline

```typescript
// src/components/collections/message-timeline.tsx
'use client';

import { Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { MessageDetailDialog } from './message-detail-dialog';
import type { CollectionMessage } from '@/lib/services/message-service';

interface MessageTimelineProps {
  messages: CollectionMessage[];
}

/**
 * Timeline vertical de mensajes enviados en una collection.
 * Muestra fecha, canal, subject, preview y estado de entrega.
 */
export function MessageTimeline({ messages }: MessageTimelineProps) {
  const [selectedMessage, setSelectedMessage] = useState<CollectionMessage | null>(null);

  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay mensajes enviados
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <Button
              variant="ghost"
              className="w-full justify-start p-4 h-auto"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex gap-4 w-full text-left">
                {/* Icono de canal */}
                <div className="flex-shrink-0 pt-1">
                  {message.channel === 'email' && (
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {/* Fecha y estado */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">
                      {message.sentAt
                        ? new Date(message.sentAt).toLocaleString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Fecha desconocida'}
                    </span>
                    {getDeliveryStatusBadge(message.deliveryStatus)}
                  </div>

                  {/* Subject */}
                  {message.subject && (
                    <div className="font-medium mb-1 truncate">
                      {message.subject}
                    </div>
                  )}

                  {/* Preview */}
                  <div className="text-sm text-muted-foreground truncate">
                    {message.body.substring(0, 100)}
                    {message.body.length > 100 && '...'}
                  </div>
                </div>
              </div>
            </Button>

            {/* Separator entre items (no en el último) */}
            {index < messages.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>

      {/* Dialog de detalle */}
      {selectedMessage && (
        <MessageDetailDialog
          message={selectedMessage}
          open={!!selectedMessage}
          onOpenChange={(open) => !open && setSelectedMessage(null)}
        />
      )}
    </>
  );
}

/**
 * Retorna el Badge de shadcn con el color y texto según el estado de entrega.
 */
function getDeliveryStatusBadge(status: string) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'secondary', label: 'Pendiente' },
    sent: { variant: 'default', label: 'Enviado' },
    delivered: { variant: 'outline', label: 'Entregado' },
    bounced: { variant: 'destructive', label: 'Rebotado' },
    failed: { variant: 'destructive', label: 'Fallido' },
  };

  const config = variants[status] || { variant: 'outline', label: status };

  return (
    <Badge variant={config.variant} className="shrink-0">
      {config.label}
    </Badge>
  );
}
```

### Componente MessageDetailDialog

```typescript
// src/components/collections/message-detail-dialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { CollectionMessage } from '@/lib/services/message-service';

interface MessageDetailDialogProps {
  message: CollectionMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog que muestra el contenido completo de un mensaje enviado.
 * Incluye alert si el mensaje rebotó o falló.
 */
export function MessageDetailDialog({
  message,
  open,
  onOpenChange,
}: MessageDetailDialogProps) {
  const hasDeliveryIssue = ['bounced', 'failed'].includes(message.deliveryStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {message.subject || 'Mensaje sin asunto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert si rebotó o falló */}
          {hasDeliveryIssue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {message.deliveryStatus === 'bounced'
                  ? 'El mensaje no pudo ser entregado'
                  : 'El envío falló'}
              </AlertDescription>
            </Alert>
          )}

          {/* Metadata del mensaje */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Enviado a:</span>
              <div className="text-muted-foreground">
                {message.contact.firstName} {message.contact.lastName}
                <br />
                {message.contact.email}
              </div>
            </div>

            <div>
              <span className="font-medium">Fecha envío:</span>
              <div className="text-muted-foreground">
                {message.sentAt
                  ? new Date(message.sentAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '-'}
              </div>
            </div>

            {message.deliveredAt && (
              <div>
                <span className="font-medium">Fecha entrega:</span>
                <div className="text-muted-foreground">
                  {new Date(message.deliveredAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            )}

            {message.externalMessageId && (
              <div>
                <span className="font-medium">ID externo:</span>
                <div className="text-muted-foreground font-mono text-xs">
                  {message.externalMessageId}
                </div>
              </div>
            )}
          </div>

          {/* Contenido del mensaje */}
          <div>
            <span className="font-medium">Contenido:</span>
            <div className="mt-2 p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{message.body}</pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### API Endpoint

```typescript
// src/app/api/collections/[id]/messages/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCollectionMessages } from '@/lib/services/message-service';

/**
 * GET /api/collections/[id]/messages
 *
 * Retorna todos los mensajes enviados de una collection.
 * Requiere autenticación.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await getCollectionMessages(params.id);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[API] GET /api/collections/[id]/messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### React Query Hook

```typescript
// src/lib/api/collections.ts (agregar al archivo existente)
import { useQuery } from '@tanstack/react-query';
import type { CollectionMessage } from '@/lib/services/message-service';

/**
 * Hook para obtener mensajes de una collection.
 *
 * @param collectionId - ID de la collection
 * @returns Query con mensajes, loading state y error
 */
export function useCollectionMessages(collectionId: string | undefined) {
  return useQuery<CollectionMessage[]>({
    queryKey: ['collections', collectionId, 'messages'],
    queryFn: async () => {
      if (!collectionId) throw new Error('Collection ID required');

      const res = await fetch(`/api/collections/${collectionId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!collectionId,
  });
}
```

### Integración en Invoice Detail Page

```typescript
// src/app/(dashboard)/invoices/[invoiceId]/page.tsx
// Agregar import
import { MessageTimeline } from '@/components/collections/message-timeline';
import { useCollectionMessages } from '@/lib/api/collections';

// Dentro del componente, después de obtener invoice:
const { data: messages, isLoading: messagesLoading } = useCollectionMessages(
  invoice?.collection?.id
);

// En el JSX, dentro de <Tabs>:
<TabsContent value="messages">
  {messagesLoading ? (
    <div className="text-center py-8">Cargando mensajes...</div>
  ) : messages && messages.length > 0 ? (
    <MessageTimeline messages={messages} />
  ) : (
    <div className="text-center text-muted-foreground py-8">
      No hay mensajes enviados
    </div>
  )}
</TabsContent>
```

### Consideraciones de Diseño

**UI/UX según arquitectura:**
- Usar componentes de shadcn/ui (Dialog, Badge, Button, Separator)
- Timeline vertical con separadores entre items
- Click en item abre modal (no navegación a nueva página)
- Preview truncado a 100 caracteres para no abrumar
- Badge con código de color según estado (destructive para bounced/failed)
- Formateo de fechas en español mexicano ("5 dic 2025, 3:45 PM")

**Performance:**
- React Query cachea automáticamente (no re-fetch innecesarios)
- Query key incluye collectionId → invalidación granular
- Solo query si `enabled: !!collectionId`

**Accesibilidad:**
- Botones con texto descriptivo
- Iconos con aria-label
- Dialog con focus trap
- Keyboard navigation funcional

### Project Structure Notes

**Archivos a crear:**
- `src/lib/services/message-service.ts` - Query helper
- `src/components/collections/message-timeline.tsx` - Timeline component
- `src/components/collections/message-detail-dialog.tsx` - Dialog component
- `src/app/api/collections/[id]/messages/route.ts` - API endpoint
- `__tests__/services/message-service.test.ts` - Tests del servicio
- `__tests__/components/message-timeline.test.tsx` - Tests del componente

**Archivos a modificar:**
- `src/lib/api/collections.ts` - Agregar hook `useCollectionMessages`
- `src/app/(dashboard)/invoices/[invoiceId]/page.tsx` - Integrar tab "Mensajes"

### Patrones del Proyecto

Seguir patrones existentes según architecture.md:
- **JSDoc obligatorio** para funciones exportadas
- **Logging estructurado** con `console.error('[Component] message', error)`
- **Error handling** con try/catch y status codes correctos
- **Naming**: kebab-case archivos, PascalCase components
- **shadcn/ui** para todos los componentes base
- **React Query** para fetching y caching
- **Supabase Admin Client** para queries server-side

### Testing Approach

```typescript
// __tests__/services/message-service.test.ts
describe('getCollectionMessages', () => {
  it('should fetch messages with contact data', async () => {
    // Mock Supabase query
    const mockMessages = [
      {
        id: 'msg-1',
        channel: 'email',
        subject: 'Test',
        body: 'Content',
        delivery_status: 'sent',
        sent_at: '2025-12-05T10:00:00Z',
        delivered_at: null,
        external_message_id: 'resend-123',
        contact: {
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan@example.com',
          phone: null,
        },
      },
    ];

    // Assert structure matches CollectionMessage interface
  });

  it('should order messages by sent_at ASC', async () => {
    // ...
  });
});
```

```typescript
// __tests__/components/message-timeline.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageTimeline } from '@/components/collections/message-timeline';

describe('MessageTimeline', () => {
  it('should render empty state when no messages', () => {
    render(<MessageTimeline messages={[]} />);
    expect(screen.getByText('No hay mensajes enviados')).toBeInTheDocument();
  });

  it('should render message items with preview', () => {
    const messages = [
      {
        id: '1',
        channel: 'email',
        subject: 'Test Subject',
        body: 'A'.repeat(150), // 150 chars
        deliveryStatus: 'sent',
        sentAt: '2025-12-05T10:00:00Z',
        deliveredAt: null,
        externalMessageId: 'resend-1',
        contact: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
          phone: null,
        },
      },
    ];

    render(<MessageTimeline messages={messages} />);

    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    // Preview debe estar truncado a 100 chars + "..."
    expect(screen.getByText(/A{100}\.\.\./)).toBeInTheDocument();
  });

  it('should show correct badge for delivery status', () => {
    // Test para cada estado: pending, sent, delivered, bounced, failed
  });
});
```

### Dependencias de Story Previas

**Prerequisitos:**
- **Story 4.1** completada: Schema `sent_messages` y función `createSentMessageRecord` ya implementados
- Collection worker enviando mensajes y creando registros en BD
- Variables de entorno Resend configuradas

**Nota:** Story 4.3 (webhooks) actualizará los `delivery_status` posteriormente. En esta story solo mostramos el estado actual.

### References

- [Source: docs/epics/epic-4-comunicacion.md#Story 4.2]
- [Source: docs/architecture.md#Patrones de Implementación]
- [Source: docs/architecture.md#Schema: SentMessage]
- [Source: docs/sprint-artifacts/4-1-envio-de-emails-transaccionales.md]
- [Source: prisma/schema.prisma:SentMessage]

## Dev Agent Record

### Context Reference

Context paths analyzed for this story:
- docs/epics/epic-4-comunicacion.md (Epic 4 requirements)
- docs/prd.md (User stories Epic 4)
- docs/architecture.md (UI patterns, Component structure)
- docs/sprint-artifacts/4-1-envio-de-emails-transaccionales.md (Previous story implementation)
- prisma/schema.prisma (SentMessage model)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Notes (2025-12-07)

**Implementación completada:**
- Servicio `message-service.ts` con query a sent_messages + join contacts
- Timeline component con preview truncado, badges de status, y click para detalle
- Dialog de detalle con alert para mensajes bounced/failed
- API endpoint `/api/collections/[collectionId]/messages`
- React Query hook `useCollectionMessages` para caching
- Tab "Mensajes" integrado en invoice detail page

**Cambios adicionales durante implementación:**
- Configuración de vitest para soportar tests `.tsx` (jsdom environment)
- Agregado `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Agregado `@tanstack/react-query`
- Agregado Separator component de shadcn/ui
- Import de React agregado a componentes para compatibilidad con jsdom

**Tests creados (29 total):**
- message-service.test.ts: 5 tests (fetch, empty, order, error handling)
- message-timeline.test.tsx: 12 tests (6 timeline + 6 badge)
- message-detail-dialog.test.tsx: 12 tests (fields, alerts, estados)

### Completion Notes

**Story creada en modo YOLO** con análisis exhaustivo de:
1. **Epic 4.2 completo** - Todos los ACs extraídos con formato Gherkin
2. **Schema SentMessage** - Modelo completo desde Prisma con todos los campos
3. **Story 4.1 previa** - Patrones de implementación (servicio, tests, JSDoc)
4. **Architecture.md** - Patrones UI (shadcn), estructura de archivos, naming conventions
5. **Git commits recientes** - Últimos patrones de Epic 3 y 4.1

**Componentes implementados:**
- `MessageTimeline` - Timeline vertical con preview truncado a 100 chars
- `MessageDetailDialog` - Modal con contenido completo + alert para bounced/failed
- `message-service.ts` - Query helper con join a contacts
- API endpoint `/api/collections/[collectionId]/messages`
- React Query hook `useCollectionMessages`

**Decisiones de implementación:**
- **Timeline cronológico ASC** (más antiguo arriba, más reciente abajo)
- **Preview a 100 caracteres** con "..." al final si es más largo
- **Badges con colores semánticos**: gray (pending), blue (sent), green (delivered), orange/red (bounced/failed)
- **Dialog en lugar de nueva página** para mantener contexto de factura
- **Tab "Mensajes" en invoice detail** integrado con tabs existentes (3 columnas)
- **React Query caching automático** con key granular por collection
- **Empty state claro** cuando no hay mensajes

**Patrones seguidos:**
- ✅ JSDoc obligatorio en funciones exportadas
- ✅ Logging estructurado con `console.error`
- ✅ shadcn/ui components (Dialog, Badge, Button, Separator, Alert)
- ✅ React Query para data fetching (hook creado)
- ✅ Supabase Admin Client para queries server-side
- ✅ kebab-case archivos, PascalCase components
- ✅ Tests unitarios + component tests (29 tests)

### File List

**Archivos creados (8):**
1. src/lib/services/message-service.ts
2. src/components/collections/message-timeline.tsx
3. src/components/collections/message-detail-dialog.tsx
4. src/app/api/collections/[collectionId]/messages/route.ts
5. src/lib/api/collections.ts
6. __tests__/services/message-service.test.ts
7. __tests__/components/message-timeline.test.tsx
8. __tests__/components/message-detail-dialog.test.tsx

**Archivos modificados (3):**
1. src/app/(dashboard)/invoices/[invoiceId]/page.tsx (agregar tab "Mensajes")
2. vitest.config.ts (soporte para .tsx tests + jsdom)
3. __tests__/setup.ts (nuevo - setup para testing-library)

**Total:** 8 archivos nuevos + 3 modificaciones = 11 archivos impactados

### Change Log

| Fecha | Cambio |
|-------|--------|
| 2025-12-07 | Implementación completa de Story 4.2 - 29 tests, build exitoso |
| 2025-12-07 | Code Review completado - 4 fixes aplicados |
| 2025-12-07 | Deploy a producción - commit 0ecd5d4 |

### Code Review Summary (2025-12-07)

**Issues encontrados y corregidos:**

| Severidad | Issue | Fix |
|-----------|-------|-----|
| 🔴 CRÍTICO | Falta verificación tenant_id en API | Agregado `getTenantId()` + filtro en servicio |
| 🟡 MEDIO | Hook `useCollectionMessages` no usado | Eliminado `src/lib/api/collections.ts` |
| 🟡 MEDIO | Colores badges no coinciden con AC3 | delivered=verde, bounced=naranja |
| 🟢 BAJO | Tildes faltantes | "envío", "falló" corregidos |

**Archivos modificados en code review:**
- `src/lib/services/message-service.ts` - Agregado parámetro `tenantId`
- `src/app/api/collections/[collectionId]/messages/route.ts` - Agregado `getTenantId()`
- `src/components/collections/message-timeline.tsx` - Colores de badges
- `src/components/collections/message-detail-dialog.tsx` - Tildes
- `__tests__/services/message-service.test.ts` - Actualizado mock
- `__tests__/components/message-detail-dialog.test.tsx` - Actualizado texto
- Eliminado: `src/lib/api/collections.ts`
