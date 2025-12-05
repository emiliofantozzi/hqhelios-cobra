# Story 3.5: Activar Playbook en Factura

Status: ready-for-dev

## Story

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** activar un playbook de cobranza en una factura pendiente,
**Para que** el sistema comience a gestionar automáticamente el seguimiento de cobro.

## Acceptance Criteria

### **Scenario 1: Botón "Activar Playbook" visible en detalle de factura**
```gherkin
Given estoy en la página de detalle de una factura
And la factura tiene payment_status = 'pendiente' o 'fecha_confirmada'
And la factura NO tiene un playbook activo
When veo la sección de acciones
Then veo botón "Activar Playbook" habilitado
And el botón tiene icono de Play
```

### **Scenario 2: Modal de selección de playbook**
```gherkin
Given hago clic en "Activar Playbook"
When se abre el modal
Then veo selector con playbooks activos del tenant
And veo información del contacto primario de la empresa
And veo checkbox de confirmación "Confirmo que el contacto es correcto"
And veo botón "Activar" deshabilitado hasta confirmar
```

### **Scenario 3: Activación exitosa crea Collection**
```gherkin
Given seleccioné un playbook
And confirmé el contacto primario
When hago clic en "Activar"
Then se crea registro en tabla collections con:
  | Campo | Valor |
  | tenant_id | del JWT |
  | invoice_id | factura actual |
  | company_id | empresa de la factura |
  | primary_contact_id | contacto primario de la empresa |
  | playbook_id | playbook seleccionado |
  | status | 'active' |
  | current_message_index | 0 |
  | started_at | now() |
  | next_action_at | now() (primer mensaje inmediato) |
And veo toast de éxito "Playbook activado correctamente"
And el modal se cierra
And la factura muestra badge "Playbook Activo: [nombre]"
```

### **Scenario 4: Validación - Solo facturas pendientes o fecha_confirmada**
```gherkin
Given la factura tiene payment_status = 'pagada' o 'escalada' o 'suspendida' o 'cancelada'
When veo la página de detalle
Then NO veo botón "Activar Playbook"
Or el botón está deshabilitado con tooltip explicativo
```

### **Scenario 5: Validación - No duplicar collection activa**
```gherkin
Given la factura ya tiene una collection con status != 'completed' y != 'escalated'
When intento activar otro playbook
Then veo error "Esta factura ya tiene un playbook activo"
And el botón "Activar Playbook" no está visible o está deshabilitado
```

### **Scenario 6: Validación - Empresa debe tener contacto primario**
```gherkin
Given la empresa de la factura no tiene contacto primario definido
When intento activar playbook
Then veo error "La empresa no tiene contacto primario definido"
And link para ir a configurar contacto
```

### **Scenario 7: Badge de playbook activo en factura**
```gherkin
Given la factura tiene collection con status = 'active', 'paused', 'awaiting_response', o 'pending_review'
When veo la página de detalle de factura
Then veo badge junto al número de factura con "Playbook: [nombre]"
And el badge tiene color según estado:
  | Estado | Color |
  | active | verde |
  | paused | amarillo |
  | awaiting_response | azul |
  | pending_review | naranja |
```

### **Scenario 8: Calcular next_action_at inicial**
```gherkin
Given activo un playbook
When se crea la collection
Then next_action_at se calcula según el primer mensaje del playbook:
  - Si wait_days = 0 → next_action_at = now()
  - Si wait_days > 0 → next_action_at = now() + wait_days días
And el worker podrá procesar cuando next_action_at <= now()
```

## Tasks / Subtasks

### Task 1: Crear Collection Service (AC: 3, 5, 8)
- [ ] **Task 1.1**: Crear `src/lib/services/collection-service.ts`
  - [ ] Función `createCollection(tenantId, invoiceId, playbookId, userId)`
  - [ ] Verificar que factura existe y pertenece al tenant
  - [ ] Verificar que factura tiene status válido (pendiente, fecha_confirmada)
  - [ ] Verificar que NO existe collection activa para la factura
  - [ ] Obtener company_id de la factura
  - [ ] Obtener primary_contact_id de la empresa
  - [ ] Obtener primer mensaje del playbook para calcular next_action_at
  - [ ] Crear registro en collections
  - [ ] Retornar collection creada

- [ ] **Task 1.2**: Función `getActiveCollectionForInvoice(tenantId, invoiceId)`
  - [ ] Query con filtro: status NOT IN ('completed', 'escalated')
  - [ ] Incluir playbook name para mostrar en badge
  - [ ] Retornar null si no hay collection activa

- [ ] **Task 1.3**: Función `getPlaybooksForActivation(tenantId)`
  - [ ] Solo playbooks activos (is_active = true)
  - [ ] Incluir conteo de mensajes
  - [ ] Para selector de UI

### Task 2: Validation Schema y API Endpoint (AC: 3, 4, 5, 6)
- [ ] **Task 2.1**: Crear `src/lib/validations/collection-schema.ts`
  - [ ] Schema Zod: `activatePlaybookSchema = z.object({ playbookId: z.string().uuid() })`
  - [ ] Export type `ActivatePlaybookInput`

- [ ] **Task 2.2**: Crear `src/app/api/invoices/[invoiceId]/activate-playbook/route.ts`
  - [ ] Method: POST
  - [ ] Validar body con `activatePlaybookSchema.safeParse(body)`
  - [ ] Validar JWT y extraer tenantId
  - [ ] Llamar createCollection del service
  - [ ] Manejar errores con códigos específicos:
    - INVOICE_NOT_FOUND → 404
    - INVALID_STATUS → 422
    - COLLECTION_EXISTS → 409
    - NO_PRIMARY_CONTACT → 422
    - PLAYBOOK_NOT_FOUND → 404
  - [ ] Retornar collection creada con playbook name

### Task 3: API Endpoint para obtener collection activa (AC: 7)
- [ ] **Task 3.1**: Extender `src/app/api/invoices/[invoiceId]/route.ts` GET
  - [ ] Agregar activeCollection al response de getInvoiceById
  - [ ] Incluir: collection.id, collection.status, playbook.name
  - [ ] O crear endpoint separado `/api/invoices/[invoiceId]/collection`

### Task 4: Componente UI - ActivatePlaybookButton (AC: 1, 4, 5)
- [ ] **Task 4.1**: Crear `src/components/invoices/activate-playbook-button.tsx`
  - [ ] Botón con icono Play
  - [ ] Props: invoiceId, currentStatus, hasActiveCollection
  - [ ] Disabled si status no válido o ya tiene collection
  - [ ] Tooltip explicativo cuando está disabled
  - [ ] OnClick abre modal

### Task 5: Componente UI - ActivatePlaybookModal (AC: 2, 3, 6)
- [ ] **Task 5.1**: Crear `src/components/invoices/activate-playbook-modal.tsx`
  - [ ] Fetch playbooks activos al abrir (`/api/playbooks?active=true`)
  - [ ] Fetch contacto primario (`/api/companies/[id]/contacts?primary=true`)
  - [ ] Skeleton loading mientras carga data
  - [ ] Selector de playbook (RadioGroup)
  - [ ] Mostrar descripción y conteo de mensajes del playbook
  - [ ] Mostrar info del contacto primario (nombre, email, teléfono)
  - [ ] Checkbox de confirmación del contacto
  - [ ] Botón "Activar" disabled hasta: playbook seleccionado + confirmado
  - [ ] Toast con `useToast` hook (de `@/hooks/use-toast`)
  - [ ] Cerrar modal y router.refresh() al éxito

- [ ] **Task 5.2**: Manejar caso sin contacto primario
  - [ ] Mostrar Alert con mensaje de error
  - [ ] Link a `/companies/[companyId]` para configurar contacto

### Task 6: Componente UI - PlaybookStatusBadge (AC: 7)
- [ ] **Task 6.1**: Crear `src/components/invoices/playbook-status-badge.tsx`
  - [ ] Props: collectionStatus, playbookName
  - [ ] Colores por estado:
    - active → green (bg-green-100 text-green-800)
    - paused → yellow (bg-yellow-100 text-yellow-800)
    - awaiting_response → blue (bg-blue-100 text-blue-800)
    - pending_review → orange (bg-orange-100 text-orange-800)
  - [ ] Icono según estado
  - [ ] Texto: "Playbook: {nombre}"

### Task 7: Integrar en Invoice Detail Page (AC: 1, 7)
- [ ] **Task 7.1**: Modificar `src/app/(dashboard)/invoices/[invoiceId]/page.tsx`
  - [ ] Agregar PlaybookStatusBadge junto al InvoiceStatusBadge si hay collection activa
  - [ ] Agregar ActivatePlaybookButton en área de acciones
  - [ ] Condicionar visibilidad según estado y collection existente

### Task 8: Tests (AC: 3, 5, 6)
- [ ] **Task 8.1**: Test de createCollection service
  - [ ] Crear collection exitosamente
  - [ ] Verificar todos los campos se guardan correctamente
  - [ ] Verificar next_action_at se calcula correctamente

- [ ] **Task 8.2**: Test de validaciones
  - [ ] Rechazar si factura tiene status inválido
  - [ ] Rechazar si ya existe collection activa (constraint violation)
  - [ ] Rechazar si empresa no tiene contacto primario

- [ ] **Task 8.3**: Test de RLS
  - [ ] Tenant A no puede activar playbook en factura de Tenant B

## Dev Notes

### Security Checklist (CRITICAL - Verify First)
- [ ] RLS respetado via Supabase Client con tenant_id
- [ ] tenant_id extraído de Clerk metadata (NO del body)
- [ ] Validación de ownership: factura pertenece al tenant
- [ ] Validación de ownership: playbook pertenece al tenant
- [ ] Partial unique index en collections previene duplicados
- [ ] No exponer datos de otros tenants en responses

### Architecture Compliance

**Stack Tecnológico:**
- Supabase Client para queries (respeta RLS)
- shadcn/ui para componentes de modal y selector
- Zod para validación de inputs

**Patrones del proyecto:**
1. Services en `src/lib/services/` para lógica de negocio
2. API routes en `src/app/api/` para endpoints
3. Componentes UI en `src/components/invoices/`
4. Toast notifications con `useToast` hook de `@/hooks/use-toast`
5. Reusar funciones de contact-service.ts para contactos

### Collection Status Values
```typescript
type CollectionStatus =
  | 'active'           // En proceso, worker la procesa
  | 'paused'           // Pausada manualmente
  | 'awaiting_response' // Esperando respuesta del cliente
  | 'pending_review'   // Respuesta recibida, pendiente revisión
  | 'completed'        // Finalizada exitosamente
  | 'escalated';       // Escalada a nivel superior
```

### Invoice Status válidos para activar playbook
```typescript
const VALID_STATUSES_FOR_ACTIVATION = ['pendiente', 'fecha_confirmada'];
```

### Validation Schema (Zod)
```typescript
// src/lib/validations/collection-schema.ts
import { z } from 'zod';

export const activatePlaybookSchema = z.object({
  playbookId: z.string().uuid('ID de playbook inválido'),
});

export type ActivatePlaybookInput = z.infer<typeof activatePlaybookSchema>;
```

### Service Pattern - createCollection
```typescript
// src/lib/services/collection-service.ts

interface CreateCollectionResult {
  success: boolean;
  collection?: {
    id: string;
    status: string;
    playbook: {
      id: string;
      name: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function createCollection(
  tenantId: string,
  invoiceId: string,
  playbookId: string,
  userId: string
): Promise<CreateCollectionResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Verificar factura existe y tiene status válido
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, company_id, payment_status')
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .single();

  if (!invoice) {
    return { success: false, error: { code: 'INVOICE_NOT_FOUND', message: '...' } };
  }

  if (!['pendiente', 'fecha_confirmada'].includes(invoice.payment_status)) {
    return { success: false, error: { code: 'INVALID_STATUS', message: '...' } };
  }

  // 2. Verificar no existe collection activa
  const { data: existingCollection } = await supabase
    .from('collections')
    .select('id')
    .eq('invoice_id', invoiceId)
    .not('status', 'in', '("completed","escalated")')
    .maybeSingle();

  if (existingCollection) {
    return { success: false, error: { code: 'COLLECTION_EXISTS', message: '...' } };
  }

  // 3. Obtener contacto primario
  const { data: primaryContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('company_id', invoice.company_id)
    .eq('is_primary_contact', true)
    .single();

  if (!primaryContact) {
    return { success: false, error: { code: 'NO_PRIMARY_CONTACT', message: '...' } };
  }

  // 4. Obtener playbook y primer mensaje (incluir sequence_order para sort)
  const { data: playbook } = await supabase
    .from('playbooks')
    .select(`
      id, name,
      playbook_messages(sequence_order, wait_days)
    `)
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .eq('is_active', true)
    .single();

  if (!playbook) {
    return { success: false, error: { code: 'PLAYBOOK_NOT_FOUND', message: '...' } };
  }

  // 5. Calcular next_action_at basado en primer mensaje
  const sortedMessages = (playbook.playbook_messages || [])
    .sort((a, b) => a.sequence_order - b.sequence_order);
  const waitDays = sortedMessages[0]?.wait_days || 0;

  const nextActionAt = new Date();
  nextActionAt.setDate(nextActionAt.getDate() + waitDays);

  // 6. Crear collection
  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      company_id: invoice.company_id,
      primary_contact_id: primaryContact.id,
      playbook_id: playbookId,
      status: 'active',
      current_message_index: 0,
      started_at: new Date().toISOString(),
      next_action_at: nextActionAt.toISOString(),
    })
    .select('id, status')
    .single();

  if (error) {
    // Partial unique index violation
    if (error.code === '23505') {
      return { success: false, error: { code: 'COLLECTION_EXISTS', message: '...' } };
    }
    throw error;
  }

  return {
    success: true,
    collection: {
      id: collection.id,
      status: collection.status,
      playbook: { id: playbook.id, name: playbook.name },
    },
  };
}
```

### API Route Pattern
```typescript
// src/app/api/invoices/[invoiceId]/activate-playbook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { createCollection } from '@/lib/services/collection-service';
import { activatePlaybookSchema } from '@/lib/validations/collection-schema';

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const tenantId = await getTenantId();
  const { invoiceId } = await context.params;

  // Validate body with Zod
  const body = await request.json();
  const parseResult = activatePlaybookSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'ID de playbook inválido', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createCollection(tenantId, invoiceId, parseResult.data.playbookId, userId);

  if (!result.success) {
    const statusMap: Record<string, number> = {
      INVOICE_NOT_FOUND: 404,
      PLAYBOOK_NOT_FOUND: 404,
      INVALID_STATUS: 422,
      NO_PRIMARY_CONTACT: 422,
      COLLECTION_EXISTS: 409,
    };
    return NextResponse.json(result.error, {
      status: statusMap[result.error?.code || ''] || 400
    });
  }

  return NextResponse.json(result.collection, { status: 201 });
}
```

### UI Component Pattern - Modal
```tsx
// src/components/invoices/activate-playbook-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  message_count: number;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  companyId: string;
}

export function ActivatePlaybookModal({ open, onOpenChange, invoiceId, companyId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open) {
      setIsFetching(true);
      Promise.all([
        fetch('/api/playbooks?active=true').then(r => r.json()),
        fetch(`/api/companies/${companyId}/contacts?primary=true`).then(r => r.json()),
      ]).then(([playbooksData, contactData]) => {
        setPlaybooks(playbooksData);
        setPrimaryContact(contactData);
        setIsFetching(false);
      });
    } else {
      // Reset state on close
      setSelectedPlaybook(null);
      setConfirmed(false);
    }
  }, [open, companyId]);

  const handleActivate = async () => {
    if (!selectedPlaybook) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/activate-playbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId: selectedPlaybook }),
      });
      if (!res.ok) {
        const error = await res.json();
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Éxito', description: 'Playbook activado correctamente' });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: 'Error', description: 'Error al activar playbook', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const canActivate = selectedPlaybook && confirmed && primaryContact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activar Playbook de Cobranza</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !primaryContact ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La empresa no tiene contacto primario.{' '}
              <a href={`/companies/${companyId}`} className="underline">Configurar contacto</a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Playbook Selector */}
            <div>
              <Label className="mb-2 block">Seleccionar Playbook</Label>
              <RadioGroup value={selectedPlaybook || ''} onValueChange={setSelectedPlaybook}>
                {playbooks.map((pb) => (
                  <div key={pb.id} className="flex items-start space-x-2 p-2 rounded border">
                    <RadioGroupItem value={pb.id} id={pb.id} />
                    <Label htmlFor={pb.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{pb.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pb.description} • {pb.message_count} mensajes
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Contact Info */}
            <div className="bg-muted p-3 rounded">
              <Label className="text-sm font-medium">Contacto Principal</Label>
              <p className="text-sm">{primaryContact.first_name} {primaryContact.last_name}</p>
              <p className="text-sm text-muted-foreground">{primaryContact.email}</p>
              {primaryContact.phone && <p className="text-sm text-muted-foreground">{primaryContact.phone}</p>}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
              <Label htmlFor="confirm" className="text-sm">
                Confirmo que el contacto es correcto
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleActivate} disabled={!canActivate || isLoading}>
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? 'Activando...' : 'Activar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Extensión de Invoice API Response
```typescript
// Agregar al response de GET /api/invoices/[invoiceId]

interface InvoiceWithCollection extends Invoice {
  activeCollection?: {
    id: string;
    status: string;
    playbook: {
      id: string;
      name: string;
    };
  } | null;
}
```

### File Structure
```
src/
├── lib/
│   ├── services/
│   │   └── collection-service.ts       # NUEVO
│   └── validations/
│       └── collection-schema.ts        # NUEVO (Zod schema)
├── app/
│   └── api/
│       └── invoices/
│           └── [invoiceId]/
│               ├── route.ts            # MODIFICAR (agregar activeCollection)
│               └── activate-playbook/
│                   └── route.ts        # NUEVO
├── components/
│   └── invoices/
│       ├── activate-playbook-button.tsx  # NUEVO
│       ├── activate-playbook-modal.tsx   # NUEVO
│       └── playbook-status-badge.tsx     # NUEVO
└── app/
    └── (dashboard)/
        └── invoices/
            └── [invoiceId]/
                └── page.tsx            # MODIFICAR

__tests__/
└── services/
    └── collection-service.test.ts      # NUEVO
```

### Testing Requirements

**Tests de Service:**
```typescript
// __tests__/services/collection-service.test.ts

describe('createCollection', () => {
  it('should create collection successfully', async () => {
    // Setup: factura pendiente, empresa con contacto primario, playbook activo
    // Execute: createCollection
    // Assert: collection creada con todos los campos correctos
  });

  it('should reject invalid invoice status', async () => {
    // Setup: factura con status = 'pagada'
    // Execute: createCollection
    // Assert: error INVALID_STATUS
  });

  it('should reject duplicate active collection', async () => {
    // Setup: factura con collection activa existente
    // Execute: createCollection
    // Assert: error COLLECTION_EXISTS (por partial unique index)
  });

  it('should reject if no primary contact', async () => {
    // Setup: empresa sin contacto primario
    // Execute: createCollection
    // Assert: error NO_PRIMARY_CONTACT
  });

  it('should calculate next_action_at correctly', async () => {
    // Setup: playbook con primer mensaje wait_days = 3
    // Execute: createCollection
    // Assert: next_action_at = now + 3 días
  });
});
```

### Dependencies

**Prerequisitos:**
- Story 3.1 completada (Playbooks con mensajes)
- Story 3.4 completada (Schema de Collections con RLS)
- Epic 2 completado (Invoices, Companies, Contacts)

**Esta story bloquea:**
- Story 3.6: Worker de Procesamiento Automático
- Story 3.7: Control Manual de Playbook Activo

### References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.5]** - Epic definition
- **[Source: docs/prd.md#Historia-3.2.2]** - PRD acceptance criteria
- **[Source: docs/sprint-artifacts/3-4-schema-de-collections.md]** - Collection schema reference
- **[Source: src/lib/services/invoice-service.ts]** - Pattern de services
- **[Source: src/lib/services/playbook-service.ts]** - Pattern de playbook service

---

## Dev Agent Record

### Context Reference

Story drafted using BMad Method with comprehensive analysis of:
- Epic 3 complete specification - Story 3.5 requirements
- PRD Historia 3.2.2 - UI and flow requirements
- Story 3.4 completed - Collection schema available
- Existing services pattern (invoice-service.ts, playbook-service.ts)
- Existing UI patterns (invoice detail page, invoice actions)

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** draft
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** critical (enables automated collection workflow)

**Critical Path:**
1. Create collection-service.ts (Task 1)
2. Create API endpoint (Task 2)
3. Extend invoice API (Task 3)
4. Create UI components (Tasks 4-6)
5. Integrate in invoice page (Task 7)
6. Write tests (Task 8)

**Dependencies:**
- Story 3.1 (Playbook schema) - DONE
- Story 3.4 (Collection schema) - DONE
- Epic 2 (Invoice, Company, Contact schemas) - DONE

**Blocks:**
- Story 3.6 (Worker de Procesamiento)
- Story 3.7 (Control Manual de Playbook)

**Estimated Effort:** 4-6 horas

**Key Success Factors:**
- Modal UX intuitivo
- Validaciones claras con mensajes útiles
- Badge visible e informativo
- Partial unique index previene duplicados

---

**Generated:** 2025-12-04
**Workflow:** create-story (YOLO mode) + validate-create-story
**Epic:** 3 - Motor de Cobranzas Automatizado
**Validation:** Passed with 9 improvements applied (see validation-report-3-5-2025-12-04.md)
