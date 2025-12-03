# Story 2.4: Editar y Desactivar Contactos

Status: ready-for-dev

## Story

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** editar contactos y cambiar roles,
**Para que** la información esté siempre correcta.

## Acceptance Criteria

### **Scenario 1: Editar contacto**
```gherkin
Given estoy viendo contactos de una empresa
When hago click en "Editar" de un contacto
Then veo Dialog con datos pre-llenados
And puedo modificar cualquier campo
```

### **Scenario 2: Desactivar contacto no-primary**
```gherkin
Given contacto no es primary ni escalation
When hago click en "Desactivar"
Then contact.is_active = false
And ya no aparece en lista por defecto
```

### **Scenario 3: No puedo desactivar único primary**
```gherkin
Given contacto es el único primary de la empresa
When intento desactivar
Then veo error "Asigne otro contacto principal primero"
```

## Tasks / Subtasks

### Main Implementation

- [ ] **Task 1**: Extender ContactForm para modo "edit" (AC: 1)
  - [ ] Modificar `src/components/forms/contact-form.tsx`
  - [ ] Ya soporta props: mode, initialData, contactId (del Story 2.3)
  - [ ] Verificar pre-llenado de datos funciona correctamente
  - [ ] Switch entre POST y PATCH según mode
  - [ ] Validar que swaps de primary/escalation funcionan en edit

- [ ] **Task 2**: API PATCH /api/contacts/[id] - Update completo (AC: 1)
  - [ ] Implementar en `src/app/api/contacts/[id]/route.ts`
  - [ ] PATCH handler con validación Zod
  - [ ] Soportar actualización de campos básicos
  - [ ] Soportar cambio de isPrimaryContact → llamar swap RPC
  - [ ] Soportar cambio de isEscalationContact → llamar swap RPC
  - [ ] Validar no desmarcar único primary
  - [ ] Return 404 si contacto no existe o no pertenece al tenant

- [ ] **Task 3**: Service - updateContact() completo (AC: 1, 3)
  - [ ] Ya existe en `src/lib/services/contact-service.ts` (del Story 2.3)
  - [ ] Verificar implementación completa:
    - Actualizar campos básicos (nombre, email, etc.)
    - Validar único primary antes de desmarcar
    - Swap primary si cambia a true
    - Swap escalation si cambia
  - [ ] Tests de todos los casos edge

- [ ] **Task 4**: Botón "Editar" en ContactsList (AC: 1)
  - [ ] Ya existe en `src/components/contacts/contacts-list.tsx` (del Story 2.3)
  - [ ] Verificar onClick abre Dialog con datos pre-llenados
  - [ ] Estado: editingContact con datos del contacto
  - [ ] Al cerrar Dialog, limpiar editingContact

- [ ] **Task 5**: Botón "Desactivar" con validación (AC: 2, 3)
  - [ ] Agregar botón "Desactivar" en ContactsList para cada contacto
  - [ ] AlertDialog de confirmación (shadcn/ui)
  - [ ] Mensaje: "¿Desactivar [Nombre Completo]?"
  - [ ] Si es primary único: deshabilitar botón + tooltip explicativo
  - [ ] Al confirmar: PATCH /api/contacts/[id] con { is_active: false }
  - [ ] Toast de error si falla (único primary)
  - [ ] Toast de éxito si funciona

- [ ] **Task 6**: API DELETE /api/contacts/[id] - Soft Delete (AC: 2, 3)
  - [ ] Implementar DELETE handler (o usar PATCH con is_active)
  - [ ] Validar que no sea único primary contact
  - [ ] Error 400 si es único primary: "Asigne otro contacto principal primero"
  - [ ] Update is_active = false (soft delete)
  - [ ] RLS automático valida tenant
  - [ ] Return 404 si no existe

- [ ] **Task 7**: Service - deactivateContact() con validación (AC: 2, 3)
  - [ ] Ya existe en `src/lib/services/contact-service.ts` (del Story 2.3)
  - [ ] Verificar implementación:
    - Verificar que contacto existe
    - Si es primary, contar primaries activos
    - Si es único primary → throw ValidationError
    - Si no, hacer soft delete (is_active = false)
  - [ ] Tests de validación

- [ ] **Task 8**: UI - Deshabilitar "Desactivar" si único primary (AC: 3)
  - [ ] En ContactsList, calcular si es único primary
  - [ ] Lógica: isPrimaryContact && primaryCount === 1
  - [ ] Si es único: botón disabled + tooltip
  - [ ] Tooltip: "Debe asignar otro contacto principal primero"
  - [ ] Badge visual indicando "Único Primary"

- [ ] **Task 9**: Filtro "Mostrar contactos inactivos" (AC: 2)
  - [ ] Agregar checkbox en Tab Contactos
  - [ ] State: showInactive (default false)
  - [ ] Fetch con query param: ?includeInactive=true
  - [ ] Badge "Inactivo" en contactos desactivados
  - [ ] Botón "Reactivar" para contactos inactivos

- [ ] **Task 10**: Tests de validación completos (AC: 1, 2, 3)
  - [ ] Test: Editar contacto actualiza campos
  - [ ] Test: Cambiar primary funciona atómicamente
  - [ ] Test: No puede desmarcar único primary
  - [ ] Test: Desactivar contacto no-primary funciona
  - [ ] Test: No puede desactivar único primary
  - [ ] Test: Soft delete preserva RLS

## Dev Notes

### Architecture Compliance

**Stack Tecnológico:**
- Continúa patterns de Story 2.3
- ContactForm ya existe en modo create/edit
- Service functions ya existen (updateContact, deactivateContact)
- Solo necesita integración UI y validaciones visuales

**Patrones Establecidos:**
- Story 2.3: ContactForm, Service layer, API routes
- Story 2.2: Soft delete pattern con AlertDialog
- Story 2.1: Badge system, validation patterns

**Complejidad Técnica:**
- **Baja-Media** (la mayoría del código ya existe en Story 2.3)
- Principalmente UI improvements y validaciones visuales
- Tests de edge cases

### Service Layer (Ya Implementado en Story 2.3)

**updateContact() - Verificar implementación:**
```typescript
// src/lib/services/contact-service.ts (ya existe)

export async function updateContact(
  contactId: string,
  data: Partial<ContactFormData>,
  tenantId: string
) {
  // 1. Get current contact
  // 2. Validar no desmarcar único primary
  // 3. Update basic fields
  // 4. Si isPrimaryContact cambió → swap RPC
  // 5. Si isEscalationContact cambió → swap RPC
  // 6. Return updated contact
}
```

**deactivateContact() - Verificar implementación:**
```typescript
// src/lib/services/contact-service.ts (ya existe)

export async function deactivateContact(contactId: string, tenantId: string) {
  // 1. Get contact
  // 2. Si es primary, contar primaries activos
  // 3. Si es único primary → throw ValidationError
  // 4. Soft delete (is_active = false)
  // 5. Return deactivated contact
}
```

### API Routes (Parcialmente Implementado en Story 2.3)

**PATCH /api/contacts/[id] - Extender:**
```typescript
// src/app/api/contacts/[id]/route.ts

/**
 * API endpoint para actualizar un contacto.
 *
 * @route PATCH /api/contacts/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantId(userId);
    const body = await request.json();

    // Validar input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    // Update contact
    const contact = await updateContact(params.id, result.data, tenantId);
    return NextResponse.json(contact);

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API endpoint para desactivar un contacto (soft delete).
 *
 * @route DELETE /api/contacts/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await getTenantId(userId);

    // Deactivate contact
    const contact = await deactivateContact(params.id, tenantId);
    return NextResponse.json(contact);

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      // Único primary contact
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error deactivating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### UI Enhancements - ContactsList Component

**Agregar deactivación y validación:**
```typescript
// src/components/contacts/contacts-list.tsx (update)

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useState } from 'react';
import { ContactForm } from '@/components/forms/contact-form';
import { useToast } from '@/components/ui/use-toast';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  isPrimaryContact: boolean;
  isEscalationContact: boolean;
  isActive: boolean;
}

interface ContactsListProps {
  contacts: Contact[];
  companyId: string;
  onRefresh: () => void;
  showInactive?: boolean;
}

export function ContactsList({ contacts, companyId, onRefresh, showInactive = false }: ContactsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  // Count active primary contacts
  const activePrimaryCount = contacts.filter(
    c => c.isPrimaryContact && c.isActive
  ).length;

  async function handleDeactivate(contact: Contact) {
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Contacto desactivado',
        description: `${contact.firstName} ${contact.lastName} ha sido desactivado.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo desactivar el contacto',
        variant: 'destructive',
      });
    }
  }

  const displayContacts = showInactive
    ? contacts
    : contacts.filter(c => c.isActive);

  if (displayContacts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          {showInactive ? 'No hay contactos' : 'No hay contactos activos'}
        </p>
        <Button onClick={() => setIsFormOpen(true)}>
          Agregar Primer Contacto
        </Button>
        <ContactForm
          companyId={companyId}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Contactos ({displayContacts.length})
        </h3>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          Agregar Contacto
        </Button>
      </div>

      <div className="grid gap-4">
        {displayContacts.map((contact) => {
          const isOnlyPrimary = contact.isPrimaryContact && activePrimaryCount === 1;

          return (
            <div
              key={contact.id}
              className={`border rounded-lg p-4 transition ${
                contact.isActive ? 'hover:bg-gray-50' : 'bg-gray-100 opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </h4>
                    {contact.isPrimaryContact && (
                      <Badge variant="success">
                        Contacto Principal
                        {isOnlyPrimary && ' (Único)'}
                      </Badge>
                    )}
                    {contact.isEscalationContact && (
                      <Badge variant="warning">Escalamiento</Badge>
                    )}
                    {!contact.isActive && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                  )}
                  {contact.position && (
                    <p className="text-sm text-gray-500">{contact.position}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {contact.isActive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingContact(contact);
                          setIsFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isOnlyPrimary}
                                >
                                  Desactivar
                                </Button>
                              </AlertDialogTrigger>
                            </span>
                          </TooltipTrigger>
                          {isOnlyPrimary && (
                            <TooltipContent>
                              Debe asignar otro contacto principal primero
                            </TooltipContent>
                          )}
                        </Tooltip>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Desactivar {contact.firstName} {contact.lastName}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              El contacto ya no aparecerá en la lista por defecto.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeactivate(contact)}>
                              Desactivar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ContactForm
        companyId={companyId}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSuccess={() => {
          onRefresh();
          setEditingContact(null);
        }}
        mode={editingContact ? 'edit' : 'create'}
        initialData={editingContact || undefined}
        contactId={editingContact?.id}
      />
    </div>
  );
}
```

### Tab Contactos - Add Inactive Filter

**Update Company Detail Page:**
```typescript
// src/app/(dashboard)/companies/[companyId]/page.tsx (update Tab Contactos)

<TabsContent value="contacts">
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Checkbox
        checked={showInactiveContacts}
        onCheckedChange={(checked) => setShowInactiveContacts(checked as boolean)}
        id="show-inactive-contacts"
      />
      <label htmlFor="show-inactive-contacts" className="text-sm">
        Mostrar contactos inactivos
      </label>
    </div>

    <ContactsList
      contacts={contacts || []}
      companyId={companyId}
      onRefresh={refetchContacts}
      showInactive={showInactiveContacts}
    />
  </div>
</TabsContent>
```

### Testing Requirements

**Update Tests:**
```typescript
describe('PATCH /api/contacts/[id]', () => {
  it('should update contact basic fields', async () => {
    const contact = await createContact({
      companyId: company.id,
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: 'New',
        lastName: 'Name',
        email: 'new@test.com',
      }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.first_name).toBe('New');
    expect(updated.email).toBe('new@test.com');
  });

  it('should swap primary when editing', async () => {
    const contactA = await createContact({
      companyId: company.id,
      firstName: 'A',
      lastName: 'Primary',
      email: 'a@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const contactB = await createContact({
      companyId: company.id,
      firstName: 'B',
      lastName: 'NotPrimary',
      email: 'b@test.com',
      isPrimaryContact: false
    }, testTenantId);

    // Make B primary via edit
    const res = await fetch(`/api/contacts/${contactB.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPrimaryContact: true }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(200);

    // Verify swap
    const updatedA = await getContactById(contactA.id, testTenantId);
    const updatedB = await getContactById(contactB.id, testTenantId);

    expect(updatedA.is_primary_contact).toBe(false);
    expect(updatedB.is_primary_contact).toBe(true);
  });

  it('should not allow unmarking only primary', async () => {
    const contact = await createContact({
      companyId: company.id,
      firstName: 'Only',
      lastName: 'Primary',
      email: 'only@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPrimaryContact: false }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.error).toContain('contacto principal');
  });
});

describe('DELETE /api/contacts/[id]', () => {
  it('should deactivate non-primary contact', async () => {
    const primary = await createContact({
      companyId: company.id,
      firstName: 'Primary',
      lastName: 'Contact',
      email: 'primary@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const regular = await createContact({
      companyId: company.id,
      firstName: 'Regular',
      lastName: 'Contact',
      email: 'regular@test.com',
    }, testTenantId);

    const res = await fetch(`/api/contacts/${regular.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(200);
    const deactivated = await res.json();
    expect(deactivated.is_active).toBe(false);
  });

  it('should not deactivate only primary contact', async () => {
    const contact = await createContact({
      companyId: company.id,
      firstName: 'Only',
      lastName: 'Primary',
      email: 'only@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.error).toContain('Asigne otro contacto principal primero');
  });
});
```

### File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── companies/
│   │       └── [companyId]/
│   │           └── page.tsx           # UPDATE: Add showInactive state
│   └── api/
│       └── contacts/
│           └── [id]/
│               └── route.ts            # UPDATE: Add DELETE handler
│
├── components/
│   ├── contacts/
│   │   └── contacts-list.tsx           # UPDATE: Add deactivate + validation
│   └── forms/
│       └── contact-form.tsx            # Already supports edit mode (Story 2.3)
│
└── lib/
    └── services/
        └── contact-service.ts          # Already has updateContact, deactivateContact (Story 2.3)
```

### Performance Targets

- **Update contact:** <300ms
- **Deactivate contact:** <200ms
- **UI validation (count primary):** <50ms (client-side)

### Security Checklist

- [ ] ✅ RLS policies activas (heredadas de Story 2.3)
- [ ] ✅ PATCH valida tenant ownership
- [ ] ✅ DELETE valida tenant ownership
- [ ] ✅ Validación de único primary en service layer
- [ ] ✅ Soft delete preserva RLS

### Dependencies

**Story 2.3 MUST be completed:**
- ✅ Contact model, RLS policies
- ✅ ContactForm component (ya soporta edit mode)
- ✅ updateContact() service (ya implementado)
- ✅ deactivateContact() service (ya implementado)
- ✅ API routes structure

**Story 2.2 provides:**
- ✅ Soft delete pattern con AlertDialog

**No new dependencies**

### References

- **[Source: docs/epics/epic-2-crm.md#Story-2.4]** - User story
- **[Source: Story 2.3]** - ContactForm, Service layer (reutilización)
- **[Source: Story 2.2]** - Soft delete pattern
- **[Source: Architecture.md]** - Validation patterns

---

## Dev Agent Record

### Context Reference

Story contexted with:
- Epic 2 specification (Story 2.4)
- Story 2.3 (reutiliza ContactForm, services)
- Story 2.2 (soft delete pattern)
- Architecture document (validation, error handling)

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Prerequisites:** Story 2.3 MUST be completed

**Complexity:** BAJA-MEDIA
- La mayoría del código ya existe en Story 2.3
- Principalmente UI improvements y validaciones visuales
- Tests de edge cases importantes

**Reutilización de Código:**
- ContactForm ya soporta modo edit (Story 2.3)
- updateContact() ya existe (Story 2.3)
- deactivateContact() ya existe (Story 2.3)
- Solo necesita integración UI + DELETE handler

**Estimated Effort:** 4-6 hours

**Key Success Factors:**
- Validación visual (deshabilitar botón si único primary)
- Error handling claro (toast messages)
- Tests de edge cases (no desactivar único primary)
- AlertDialog smooth UX

### File List

Files to create/modify:
- `src/components/contacts/contacts-list.tsx` - UPDATE (add deactivate + validation UI)
- `src/app/(dashboard)/companies/[companyId]/page.tsx` - UPDATE (add showInactive state)
- `src/app/api/contacts/[id]/route.ts` - UPDATE (add DELETE handler)
- `tests/api/contacts-[id].test.ts` - UPDATE (add DELETE tests)

**No new files needed** - Story 2.3 ya creó toda la estructura base

---

**Generated:** 2025-12-02
**Epic:** 2 - CRM y Gestión de Clientes
**Priority:** Medium (extends 2.3, not blocking)
**Next Story:** 2-5-crear-facturas-manualmente (new module: Invoices)
