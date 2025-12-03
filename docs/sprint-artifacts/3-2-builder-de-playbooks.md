# Story 3.2: Builder de Playbooks

Status: completed

## Story

**Como** Miguel (usuario administrador),
**Quiero** crear playbooks con secuencias de mensajes configurables,
**Para que** el sistema sepa qué mensajes enviar y cuándo durante el proceso de cobranza.

## Acceptance Criteria

### **Scenario 1: Crear playbook básico**
```gherkin
Given estoy en /playbooks/new
When lleno el formulario con:
  | Campo       | Valor               |
  | name        | Cobranza Estándar   |
  | description | Secuencia de 3 mensajes |
  | triggerType | post_due            |
  | triggerDays | 3                   |
And hago click en "Guardar"
Then el playbook se crea exitosamente
And soy redirigido a /playbooks/[id]/edit
And veo mensaje de éxito "Playbook creado"
```

### **Scenario 2: Agregar mensajes a la secuencia**
```gherkin
Given estoy editando un playbook existente
When hago click en "Agregar Mensaje"
Then veo el formulario de mensaje con:
  | Campo               | Tipo      | Opciones/Validación           |
  | channel             | select    | Email, WhatsApp               |
  | temperature         | select    | Amigable, Firme, Urgente      |
  | subjectTemplate     | text      | Solo visible si channel=email |
  | bodyTemplate        | textarea  | Requerido, min 10 caracteres  |
  | waitDays            | number    | Min 0, default 0              |
  | sendOnlyIfNoResponse| checkbox  | Default true                  |
And puedo guardar el mensaje
And se asigna automáticamente el siguiente sequence_order
```

### **Scenario 3: Variables disponibles en templates**
```gherkin
Given estoy editando bodyTemplate o subjectTemplate
When veo el panel de ayuda de variables
Then las variables disponibles son:
  | Variable              | Descripción                  |
  | {{company_name}}      | Nombre de empresa            |
  | {{contact_first_name}}| Nombre del contacto          |
  | {{invoice_number}}    | Número de factura            |
  | {{amount}}            | Monto formateado             |
  | {{currency}}          | Moneda (USD, MXN, etc.)      |
  | {{due_date}}          | Fecha de vencimiento         |
  | {{days_overdue}}      | Días de retraso              |
And puedo hacer click en una variable para insertarla
```

### **Scenario 4: Preview de mensaje**
```gherkin
Given he escrito un template con variables como:
  """
  Hola {{contact_first_name}},
  La factura {{invoice_number}} por {{amount}} {{currency}} está vencida.
  """
When hago click en "Preview"
Then veo el mensaje con variables reemplazadas usando datos de ejemplo:
  """
  Hola Juan,
  La factura FAC-001 por $1,500.00 USD está vencida.
  """
And puedo cerrar el preview modal
```

### **Scenario 5: Reordenar mensajes con drag & drop**
```gherkin
Given playbook tiene 3 mensajes en orden 1, 2, 3
When arrastro el mensaje 3 a la posición 1
Then sequence_order se actualiza automáticamente:
  | Mensaje original | Nuevo orden |
  | Mensaje 3        | 1           |
  | Mensaje 1        | 2           |
  | Mensaje 2        | 3           |
And los cambios se guardan al soltar
```

### **Scenario 6: Validación de playbook mínimo**
```gherkin
Given intento guardar un playbook sin mensajes
When hago click en guardar
Then veo error "Debe agregar al menos un mensaje al playbook"
And el playbook no se guarda
```

### **Scenario 7: Lista de playbooks**
```gherkin
Given navego a /playbooks
Then veo la lista de playbooks del tenant con:
  | Columna       | Descripción                    |
  | Nombre        | Nombre del playbook            |
  | Tipo          | pre_due, post_due, manual      |
  | Días          | triggerDays (ej: "+3 días")    |
  | Mensajes      | Cantidad de mensajes           |
  | Default       | Badge si isDefault=true        |
  | Estado        | Activo/Inactivo                |
  | Acciones      | Editar, Duplicar, Desactivar   |
```

### **Scenario 8: Editar mensaje existente**
```gherkin
Given playbook tiene un mensaje existente
When hago click en el icono de editar del mensaje
Then veo el formulario con los valores actuales
And puedo modificar cualquier campo
And al guardar los cambios se persisten
```

### **Scenario 9: Eliminar mensaje**
```gherkin
Given playbook tiene 3 mensajes
When hago click en eliminar el mensaje 2
And confirmo la acción en el dialog
Then el mensaje se elimina
And sequence_order se reajusta automáticamente (1, 2)
And veo mensaje "Mensaje eliminado"
```

## Tasks / Subtasks

### Task 1: Crear schemas de validación Zod (AC: 1, 2)
- [x] **Task 1.1**: Crear `src/lib/validations/playbook-schema.ts`
  - [x] `createPlaybookSchema` - validación para crear playbook
  - [x] `updatePlaybookSchema` - validación para actualizar playbook
  - [x] `createPlaybookMessageSchema` - validación para mensaje
  - [x] `updatePlaybookMessageSchema` - validación para actualizar mensaje
  - [x] `reorderMessagesSchema` - validación para reordenar

### Task 2: Crear API routes para Playbooks (AC: 1, 7)
- [x] **Task 2.1**: Crear `src/app/api/playbooks/route.ts`
  - [x] GET - listar playbooks del tenant con conteo de mensajes
  - [x] POST - crear nuevo playbook (sin mensajes inicialmente)

- [x] **Task 2.2**: Crear `src/app/api/playbooks/[id]/route.ts`
  - [x] GET - obtener playbook con sus mensajes
  - [x] PATCH - actualizar playbook (name, description, trigger, isActive)
  - [x] DELETE - eliminar playbook (cascade elimina mensajes)
  - [x] POST - duplicar playbook con todos sus mensajes

### Task 3: Crear API routes para PlaybookMessages (AC: 2, 5, 8, 9)
- [x] **Task 3.1**: Crear `src/app/api/playbooks/[id]/messages/route.ts`
  - [x] GET - listar mensajes del playbook ordenados por sequence_order
  - [x] POST - crear nuevo mensaje (auto-calcular sequence_order)

- [x] **Task 3.2**: Crear `src/app/api/playbooks/[id]/messages/[messageId]/route.ts`
  - [x] GET - obtener mensaje individual
  - [x] PATCH - actualizar mensaje
  - [x] DELETE - eliminar mensaje y reordenar restantes

- [x] **Task 3.3**: Crear `src/app/api/playbooks/[id]/messages/reorder/route.ts`
  - [x] PATCH - recibir array de {id, sequenceOrder} y actualizar todos

### Task 4: Crear página de lista de Playbooks (AC: 7)
- [x] **Task 4.1**: Crear `src/app/(dashboard)/playbooks/page.tsx`
  - [x] Tabla con columnas: Nombre, Tipo, Días, Mensajes, Default, Estado, Acciones
  - [x] Botón "Nuevo Playbook" que navega a /playbooks/new
  - [x] Checkbox para mostrar/ocultar playbooks inactivos

- [x] **Task 4.2**: Crear `src/components/tables/playbooks-table.tsx`
  - [x] Usar DataTable pattern existente (TanStack Table)
  - [x] Badge para isDefault
  - [x] Badge de estado (Activo/Inactivo)
  - [x] Dropdown de acciones: Editar, Duplicar, Desactivar

### Task 5: Crear formulario de Playbook (AC: 1)
- [x] **Task 5.1**: Crear `src/components/forms/playbook-form.tsx`
  - [x] Campos: name, description, triggerType, triggerDays, isDefault
  - [x] triggerDays solo visible si triggerType !== 'manual'
  - [x] Checkbox isDefault con warning si ya existe otro default
  - [x] Validación con Zod schema
  - [x] Modo create y edit

### Task 6: Crear página de nuevo Playbook (AC: 1)
- [x] **Task 6.1**: Crear `src/app/(dashboard)/playbooks/new/page.tsx`
  - [x] Renderizar PlaybookForm en modo create
  - [x] Redirect a /playbooks/[id]/edit después de crear

### Task 7: Crear página de edición de Playbook (AC: 2, 3, 4, 5, 8, 9)
- [x] **Task 7.1**: Crear `src/app/(dashboard)/playbooks/[id]/edit/page.tsx`
  - [x] Sección superior: datos del playbook (editable)
  - [x] Sección inferior: lista de mensajes con drag & drop
  - [x] Botón "Agregar Mensaje" abre modal
  - [x] Panel de variables disponibles en formulario de mensaje

### Task 8: Crear componente de mensaje con drag & drop (AC: 5)
- [x] **Task 8.1**: Instalar dependencias de @dnd-kit
  - [x] @dnd-kit/core y @dnd-kit/sortable ya instalados
  - [x] `pnpm add @dnd-kit/utilities`

- [x] **Task 8.2**: Crear `src/components/playbooks/message-list.tsx`
  - [x] DndContext con SortableContext
  - [x] Lista de SortableMessageCard
  - [x] Llamar API de reorder al soltar con optimistic UI

- [x] **Task 8.3**: Crear `src/components/playbooks/sortable-message-card.tsx`
  - [x] useSortable hook de @dnd-kit
  - [x] Handle de drag visible (GripVertical icon)
  - [x] Mostrar: sequence_order, channel, temperature, preview de body
  - [x] Botones: Preview, Editar, Eliminar

### Task 9: Crear formulario de mensaje (AC: 2, 3)
- [x] **Task 9.1**: Crear `src/components/forms/playbook-message-form.tsx`
  - [x] Select para channel (Email, WhatsApp)
  - [x] Select para temperature (Amigable, Firme, Urgente)
  - [x] subjectTemplate (condicional: solo si channel=email)
  - [x] bodyTemplate (textarea grande)
  - [x] waitDays (number input)
  - [x] sendOnlyIfNoResponse (checkbox)
  - [x] Panel de variables clickeables integrado

- [x] **Task 9.2**: Crear `src/components/playbooks/variable-helper.tsx`
  - [x] Lista de variables disponibles
  - [x] Click para insertar en cursor del textarea
  - [x] Tooltip con descripción de cada variable

### Task 10: Crear componente de Preview (AC: 4)
- [x] **Task 10.1**: Crear `src/components/playbooks/message-preview.tsx`
  - [x] Modal que muestra mensaje con variables reemplazadas
  - [x] Datos de ejemplo hardcodeados (EXAMPLE_DATA)
  - [x] Formato email (subject + body) vs WhatsApp (solo body con estilo burbuja)

- [x] **Task 10.2**: Crear `src/lib/utils/template-replacer.ts`
  - [x] Función `replaceTemplateVariables(template, data)`
  - [x] Función `extractTemplateVariables(template)`
  - [x] Manejar variables no encontradas (dejar {{var}})

### Task 11: Crear hooks de React Query (AC: todos)
- [x] **Task 11.1**: Crear services en lugar de hooks (patrón del proyecto)
  - [x] `src/lib/services/playbook-service.ts` - CRUD playbooks
  - [x] `src/lib/services/playbook-message-service.ts` - CRUD mensajes
  - [x] Funciones: getPlaybooks, getPlaybookById, createPlaybook, updatePlaybook, deactivatePlaybook, duplicatePlaybook
  - [x] Funciones: getPlaybookMessages, createPlaybookMessage, updatePlaybookMessage, deletePlaybookMessage, reorderPlaybookMessages

### Task 12: Actualizar navegación (AC: 7)
- [x] **Task 12.1**: Agregar "Playbooks" al sidebar en `src/app/(dashboard)/layout.tsx`
  - [x] Link a /playbooks agregado en navegación

## Dev Notes

### Architecture Compliance

**Stack Tecnológico (Ya establecido en Epic 1-2):**
- Next.js 14.2.13 (App Router)
- React 18.3.1, TypeScript 5.4.5
- Prisma 5.18.0 + @supabase/supabase-js 2.45.0
- Clerk 4.29.9 para auth
- React Hook Form 7.52.2 + Zod 3.23.8
- TanStack Query 5.51.23
- shadcn/ui components

**Nueva Dependencia:**
- `@dnd-kit/core` ^6.0.0
- `@dnd-kit/sortable` ^7.0.0
- `@dnd-kit/utilities` ^3.0.0

**Patrones Críticos (Repetir de Epic 2):**
1. **RLS OBLIGATORIO**: Queries via Supabase Client, NO Prisma directo
2. **Validación Zod**: En frontend (react-hook-form) y backend (API routes)
3. **React Query**: Para cache y mutations con invalidación
4. **JSDoc OBLIGATORIO**: Documentar todas las funciones públicas

### Database Schema (Ya creado en Story 3.1)

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

  @@index([tenantId])
  @@map("playbooks")
}

model PlaybookMessage {
  id                   String   @id @default(uuid()) @db.Uuid
  playbookId           String   @map("playbook_id") @db.Uuid
  sequenceOrder        Int      @map("sequence_order")
  channel              String   @db.VarChar(20) // email, whatsapp
  temperature          String   @db.VarChar(20) // amigable, firme, urgente
  subjectTemplate      String?  @map("subject_template") @db.Text
  bodyTemplate         String   @map("body_template") @db.Text
  useAiGeneration      Boolean  @default(false) @map("use_ai_generation")
  aiInstructions       String?  @map("ai_instructions") @db.Text
  waitDays             Int      @default(0) @map("wait_days")
  sendOnlyIfNoResponse Boolean  @default(true) @map("send_only_if_no_response")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @default(now()) @updatedAt @map("updated_at")

  playbook Playbook @relation(fields: [playbookId], references: [id], onDelete: Cascade)

  @@unique([playbookId, sequenceOrder])
  @@index([playbookId])
  @@map("playbook_messages")
}
```

### Zod Schemas

```typescript
// src/lib/validations/playbook-schema.ts

import { z } from 'zod';

export const TRIGGER_TYPES = ['pre_due', 'post_due', 'manual'] as const;
export const CHANNELS = ['email', 'whatsapp'] as const;
export const TEMPERATURES = ['amigable', 'firme', 'urgente'] as const;

export const createPlaybookSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(1000).optional(),
  triggerType: z.enum(TRIGGER_TYPES, {
    errorMap: () => ({ message: 'Selecciona un tipo de trigger válido' })
  }),
  triggerDays: z.number().int().nullable().optional(),
  isDefault: z.boolean().default(false),
}).refine((data) => {
  // triggerDays requerido si no es manual
  if (data.triggerType !== 'manual' && data.triggerDays === null) {
    return false;
  }
  return true;
}, {
  message: 'Días de trigger es requerido para playbooks pre_due y post_due',
  path: ['triggerDays'],
});

export const updatePlaybookSchema = createPlaybookSchema.partial();

export const createPlaybookMessageSchema = z.object({
  channel: z.enum(CHANNELS),
  temperature: z.enum(TEMPERATURES),
  subjectTemplate: z.string().max(500).optional().nullable(),
  bodyTemplate: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  waitDays: z.number().int().min(0).default(0),
  sendOnlyIfNoResponse: z.boolean().default(true),
  useAiGeneration: z.boolean().default(false),
  aiInstructions: z.string().optional().nullable(),
}).refine((data) => {
  // subjectTemplate requerido para email
  if (data.channel === 'email' && !data.subjectTemplate) {
    return false;
  }
  return true;
}, {
  message: 'El asunto es requerido para mensajes de email',
  path: ['subjectTemplate'],
});

export const reorderMessagesSchema = z.object({
  messages: z.array(z.object({
    id: z.string().uuid(),
    sequenceOrder: z.number().int().positive(),
  })),
});

export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;
export type CreatePlaybookMessageInput = z.infer<typeof createPlaybookMessageSchema>;
export type ReorderMessagesInput = z.infer<typeof reorderMessagesSchema>;
```

### Template Variables

```typescript
// src/lib/constants/template-variables.ts

export const TEMPLATE_VARIABLES = [
  { key: 'company_name', label: 'Nombre de empresa', example: 'Acme Corp' },
  { key: 'contact_first_name', label: 'Nombre del contacto', example: 'Juan' },
  { key: 'invoice_number', label: 'Número de factura', example: 'FAC-001' },
  { key: 'amount', label: 'Monto formateado', example: '$1,500.00' },
  { key: 'currency', label: 'Moneda', example: 'USD' },
  { key: 'due_date', label: 'Fecha de vencimiento', example: '15/01/2025' },
  { key: 'days_overdue', label: 'Días de retraso', example: '7' },
] as const;

export const EXAMPLE_DATA = {
  company_name: 'Acme Corp',
  contact_first_name: 'Juan',
  invoice_number: 'FAC-001',
  amount: '$1,500.00',
  currency: 'USD',
  due_date: '15/01/2025',
  days_overdue: '7',
};
```

### Template Replacer Utility

```typescript
// src/lib/utils/template-replacer.ts

/**
 * Reemplaza variables en un template con los valores proporcionados.
 * Variables no encontradas se dejan como {{variable}}.
 *
 * @param template - Template con variables {{variable}}
 * @param data - Objeto con key-value de variables
 * @returns Template con variables reemplazadas
 *
 * @example
 * ```ts
 * replaceTemplateVariables('Hola {{name}}', { name: 'Juan' }) // 'Hola Juan'
 * ```
 */
export function replaceTemplateVariables(
  template: string,
  data: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() ?? match;
  });
}
```

### API Route Pattern (seguir patrón de Epic 2)

```typescript
// src/app/api/playbooks/route.ts (ejemplo)

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createPlaybookSchema } from '@/lib/validations/playbook-schema';
import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Lista todos los playbooks del tenant actual.
 *
 * @route GET /api/playbooks
 * @auth Requiere autenticación con Clerk
 * @returns Lista de playbooks con conteo de mensajes
 */
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('playbooks')
    .select(`
      *,
      messages:playbook_messages(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * Crea un nuevo playbook.
 *
 * @route POST /api/playbooks
 * @auth Requiere autenticación con Clerk
 * @throws {400} Si los datos son inválidos
 */
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const result = createPlaybookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: result.error.errors
    }, { status: 400 });
  }

  const supabase = await getSupabaseClient();

  // Obtener tenant_id del usuario actual
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('clerk_user_id', userId)
    .single();

  const { data, error } = await supabase
    .from('playbooks')
    .insert({
      ...result.data,
      tenant_id: userData?.tenant_id,
      created_by_user_id: userData?.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

### Drag & Drop Implementation (@dnd-kit)

```typescript
// src/components/playbooks/message-list.tsx (ejemplo estructura)

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function MessageList({ messages, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = messages.findIndex((m) => m.id === active.id);
      const newIndex = messages.findIndex((m) => m.id === over?.id);

      const reordered = arrayMove(messages, oldIndex, newIndex);
      // Actualizar sequence_order y llamar API
      onReorder(reordered.map((m, i) => ({ id: m.id, sequenceOrder: i + 1 })));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={messages.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        {messages.map((message) => (
          <SortableMessageCard key={message.id} message={message} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── playbooks/
│   │       ├── page.tsx                    # Lista de playbooks
│   │       ├── new/
│   │       │   └── page.tsx                # Crear playbook
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx            # Editar playbook + mensajes
│   └── api/
│       └── playbooks/
│           ├── route.ts                    # GET (list), POST (create)
│           └── [id]/
│               ├── route.ts                # GET, PATCH, DELETE
│               └── messages/
│                   ├── route.ts            # GET (list), POST (create)
│                   ├── [messageId]/
│                   │   └── route.ts        # GET, PATCH, DELETE
│                   └── reorder/
│                       └── route.ts        # PATCH (reorder)
├── components/
│   ├── forms/
│   │   ├── playbook-form.tsx               # Formulario playbook
│   │   └── playbook-message-form.tsx       # Formulario mensaje
│   ├── tables/
│   │   └── playbooks-table.tsx             # Tabla de playbooks
│   └── playbooks/
│       ├── message-list.tsx                # Lista con drag & drop
│       ├── sortable-message-card.tsx       # Card draggable
│       ├── message-preview.tsx             # Modal de preview
│       └── variable-helper.tsx             # Panel de variables
├── lib/
│   ├── api/
│   │   ├── playbooks.ts                    # React Query hooks
│   │   └── playbook-messages.ts            # React Query hooks
│   ├── validations/
│   │   └── playbook-schema.ts              # Zod schemas
│   ├── constants/
│   │   └── template-variables.ts           # Variables disponibles
│   └── utils/
│       └── template-replacer.ts            # Utilidad de reemplazo
└── config/
    └── navigation.ts                       # Agregar Playbooks
```

### UI Components a Usar (shadcn/ui existentes)

- `Button` - acciones
- `Input` - campos de texto
- `Textarea` - bodyTemplate
- `Select` - channel, temperature, triggerType
- `Checkbox` - isDefault, sendOnlyIfNoResponse
- `Dialog` - modales de mensaje y preview
- `Card` - message cards
- `Badge` - estados, isDefault
- `DropdownMenu` - acciones de tabla
- `Table` - lista de playbooks
- `Form` - react-hook-form wrapper
- `Label` - etiquetas de campos
- `Tooltip` - ayuda de variables

### Validaciones de Negocio

1. **Solo 1 default por triggerType por tenant**: Verificar antes de guardar
2. **triggerDays requerido si no es manual**: Validación en Zod
3. **subject requerido para email**: Validación en Zod
4. **Mínimo 1 mensaje para publicar**: Validar en UI antes de activar
5. **sequence_order único por playbook**: Constraint en DB

### Testing Requirements

**Tests de Componentes:** ⚠️ POSTERGADO
> **Decisión de Code Review (2025-12-03):** Tests de componentes UI postergados para mantener
> simplicidad y velocidad de entrega. Se crearon tests de integración de DB (constraints y RLS)
> que cubren la lógica crítica de negocio. Tests de UI se pueden agregar en un PR futuro.

```typescript
// src/components/forms/playbook-form.test.tsx (POSTERGADO)
describe('PlaybookForm', () => {
  it('should show triggerDays when triggerType is not manual');
  it('should hide triggerDays when triggerType is manual');
  it('should validate required fields');
  it('should submit valid data');
});
```

**Tests de Integración (DB) - IMPLEMENTADOS:**
```typescript
// src/lib/services/playbook-constraints.test.ts ✅
describe('Playbook Database Constraints', () => {
  it('should allow only one default playbook per trigger_type per tenant');
  it('should enforce unique sequence_order per playbook');
});

// src/lib/services/playbook-rls.test.ts ✅
describe('Playbook RLS Isolation', () => {
  it('should only return playbooks from the requesting tenant context');
  it('should cascade delete messages when playbook is deleted');
});
```

**Tests de API:**
```typescript
// src/app/api/playbooks/route.test.ts
describe('POST /api/playbooks', () => {
  it('should create playbook with valid data');
  it('should return 400 for invalid data');
  it('should enforce RLS (tenant isolation)');
});
```

**Tests E2E:**
```typescript
// tests/e2e/playbooks.spec.ts
describe('Playbook Builder', () => {
  it('should create a new playbook');
  it('should add messages to playbook');
  it('should reorder messages with drag and drop');
  it('should preview message with replaced variables');
});
```

### References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.2]** - Criterios de aceptación originales
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Schema-Prisma]** - Schema de Playbook y PlaybookMessage
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Notas-Técnicas]** - Rutas y componentes especificados
- **[Source: docs/architecture.md#Patrones-de-Implementación]** - Naming conventions, JSDoc standards
- **[Source: docs/architecture.md#Stack-Tecnológico]** - Versiones exactas de dependencias
- **[Source: docs/sprint-artifacts/3-1-schema-de-playbooks-y-mensajes.md]** - Schema ya creado, RLS aplicado

---

## Dev Agent Record

### Context Reference

Story contexted using BMad Method Ultimate Context Engine with comprehensive analysis of:
- Epic 3 complete specification (837 lines) - Motor de Cobranzas
- Story 3.1 completada - Schema ya creado con RLS
- Architecture document (1924 lines) - Stack completo y patrones
- Existing form patterns - company-form.tsx, contact-form.tsx, invoice-form.tsx
- Sprint status - Epic 3 contexted, Story 3.1 done

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** high (depends on 3.1, blocks 3.3)

**Key Implementation Notes:**
1. **Drag & Drop**: Usar @dnd-kit (no react-beautiful-dnd - deprecated)
2. **RLS**: Todas las queries via Supabase Client, NO Prisma directo
3. **Validación**: Zod en frontend y backend
4. **Variables**: Panel clickeable para insertar en cursor
5. **Preview**: Modal con datos de ejemplo hardcodeados

**Dependencies:**
- Story 3.1 COMPLETADA (schema existe)
- @dnd-kit/core, @dnd-kit/sortable (instalar)

**Blocks:**
- Story 3.3 (Playbooks Pre-configurados) - necesita builder funcional

**Estimated Effort:** 8 puntos (~8-10 horas)

**Critical Path:**
1. Zod schemas (Task 1)
2. API routes (Task 2, 3)
3. Lista de playbooks (Task 4)
4. Formulario playbook (Task 5, 6)
5. Página edición con mensajes (Task 7)
6. Drag & drop (Task 8)
7. Formulario mensaje (Task 9)
8. Preview (Task 10)
9. React Query hooks (Task 11)
10. Navegación (Task 12)

### File List

Files created:
- `src/lib/validations/playbook-schema.ts` ✅
- `src/lib/constants/template-variables.ts` ✅
- `src/lib/utils/template-replacer.ts` ✅
- `src/lib/services/playbook-service.ts` ✅ (implementado como service, no api hook)
- `src/lib/services/playbook-message-service.ts` ✅ (implementado como service, no api hook)
- `src/app/api/playbooks/route.ts` ✅
- `src/app/api/playbooks/[id]/route.ts` ✅
- `src/app/api/playbooks/[id]/messages/route.ts` ✅
- `src/app/api/playbooks/[id]/messages/[messageId]/route.ts` ✅
- `src/app/api/playbooks/[id]/messages/reorder/route.ts` ✅
- `src/app/(dashboard)/playbooks/page.tsx` ✅
- `src/app/(dashboard)/playbooks/new/page.tsx` ✅
- `src/app/(dashboard)/playbooks/[id]/edit/page.tsx` ✅
- `src/components/forms/playbook-form.tsx` ✅
- `src/components/forms/playbook-message-form.tsx` ✅
- `src/components/tables/playbooks-table.tsx` ✅
- `src/components/playbooks/message-list.tsx` ✅
- `src/components/playbooks/sortable-message-card.tsx` ✅
- `src/components/playbooks/message-preview.tsx` ✅
- `src/components/playbooks/variable-helper.tsx` ✅
- `src/components/ui/tooltip.tsx` ✅ (shadcn component para variable helper)

Files modified:
- `src/app/(dashboard)/layout.tsx` - agregado link Playbooks al sidebar ✅
- `package.json` - agregado @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities ✅

---

**Generated:** 2025-12-03
**Epic:** 3 - Motor de Cobranzas Automatizado
**Depends on:** Story 3.1 (done)
**Next Story:** 3-3-playbooks-pre-configurados-seed
