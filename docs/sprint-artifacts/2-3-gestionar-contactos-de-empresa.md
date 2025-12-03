# Story 2.3: Gestionar Contactos de Empresa

Status: ready-for-dev

## Story

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** agregar contactos a cada empresa con roles específicos,
**Para que** sepa a quién contactar para cobranzas.

## Acceptance Criteria

### **Scenario 1: Agregar contacto a empresa**
```gherkin
Given estoy en detalle de empresa, tab "Contactos"
When hago click en "Agregar Contacto"
Then veo Dialog con formulario:
  | Campo | Tipo | Requerido |
  | firstName | text | sí |
  | lastName | text | sí |
  | email | email | sí |
  | phone | tel | no |
  | position | text | no |
  | isPrimaryContact | checkbox | no |
  | isEscalationContact | checkbox | no |
```

### **Scenario 2: Marcar como primary remueve anterior**
```gherkin
Given empresa tiene contacto A como primary
When creo contacto B y lo marco como primary
Then contacto B es primary
And contacto A ya no es primary
And operación es atómica (transacción)
```

### **Scenario 3: Debe existir un primary**
```gherkin
Given empresa tiene solo 1 contacto marcado como primary
When intento desmarcar isPrimaryContact
Then veo error "Debe haber un contacto principal"
And el cambio no se guarda
```

### **Scenario 4: Escalation contact es opcional pero único**
```gherkin
Given empresa tiene contacto A como escalation
When marco contacto B como escalation
Then contacto B es escalation
And contacto A ya no es escalation
```

## Tasks / Subtasks

### Epic 2 Preparation (Prerequisites)

- [ ] **Task 0.1**: Schema Prisma para Contact (AC: Schema)
  - [ ] Agregar model Contact a prisma/schema.prisma
  - [ ] Relación con Company (onDelete: Cascade)
  - [ ] Índices: `@@index([tenantId])`, `@@index([companyId])`
  - [ ] Generar migration: `pnpm prisma migrate dev --name add-contact-model`

- [ ] **Task 0.2**: RLS Policies para Contact (AC: Security)
  - [ ] Crear migration manual SQL para RLS policies
  - [ ] ENABLE + FORCE ROW LEVEL SECURITY
  - [ ] Policies: SELECT, INSERT, UPDATE, DELETE con tenant_id check
  - [ ] Tests de aislamiento RLS

- [ ] **Task 0.3**: SQL Function para swap_primary_contact (AC: 2)
  - [ ] Crear función `swap_primary_contact(p_company_id UUID, p_new_primary_id UUID)`
  - [ ] Transacción atómica: desmarcar anterior + marcar nuevo
  - [ ] Función `swap_escalation_contact` similar para escalation
  - [ ] Tests de atomicidad

- [ ] **Task 0.4**: Zod Schema para Contact (AC: Validation)
  - [ ] Crear `src/lib/validations/contact-schema.ts`
  - [ ] Validaciones: email format, firstName/lastName requeridos
  - [ ] Agregar tests de validación

### Main Implementation

- [ ] **Task 1**: API POST /api/contacts - Crear contacto (AC: 1, 2, 4)
  - [ ] Crear `src/app/api/contacts/route.ts`
  - [ ] POST handler con validación Zod
  - [ ] Si isPrimaryContact=true → llamar swap_primary_contact RPC
  - [ ] Si isEscalationContact=true → llamar swap_escalation_contact RPC
  - [ ] Validar que companyId pertenece al tenant (RLS)
  - [ ] Return 201 con contacto creado

- [ ] **Task 2**: Contact Service - Business Logic (AC: 1, 2, 3, 4)
  - [ ] Crear `src/lib/services/contact-service.ts`
  - [ ] `createContact(data, tenantId)` con JSDoc OBLIGATORIO
  - [ ] `getContactsByCompany(companyId, tenantId)`
  - [ ] `setPrimaryContact(companyId, contactId, tenantId)` → RPC call
  - [ ] `setEscalationContact(companyId, contactId, tenantId)` → RPC call
  - [ ] Validación de negocio: debe existir un primary siempre

- [ ] **Task 3**: Contact Form Dialog Component (AC: 1)
  - [ ] Crear `src/components/forms/contact-form.tsx`
  - [ ] Dialog modal (shadcn/ui Dialog)
  - [ ] react-hook-form + Zod validation
  - [ ] Campos según AC1
  - [ ] Checkboxes: isPrimaryContact, isEscalationContact
  - [ ] Warning si marca ambos: "Solo puede ser primary O escalation"
  - [ ] onSuccess: refresh contacts list

- [ ] **Task 4**: Tab Contactos en Company Detail (AC: 1)
  - [ ] Actualizar `src/app/(dashboard)/companies/[companyId]/page.tsx`
  - [ ] Tab "Contactos" con lista de contactos
  - [ ] Botón "Agregar Contacto" → abre Dialog
  - [ ] Lista muestra: Nombre completo, Email, Phone, Badges (Primary/Escalation)
  - [ ] Columna Acciones: Editar, Desactivar

- [ ] **Task 5**: Contacts List Component (AC: 1)
  - [ ] Crear `src/components/contacts/contacts-list.tsx`
  - [ ] Renderizar lista de contactos de la empresa
  - [ ] Badge "Primary" si isPrimaryContact
  - [ ] Badge "Escalation" si isEscalationContact
  - [ ] Botón "Editar" por contacto
  - [ ] Empty state si no hay contactos

- [ ] **Task 6**: API GET /api/contacts?companyId=[id] - Lista (AC: 1)
  - [ ] Implementar GET handler en `src/app/api/contacts/route.ts`
  - [ ] Query param: companyId (required)
  - [ ] Filtrar por tenant_id (RLS)
  - [ ] Ordenar: primary first, escalation second, rest alphabetical
  - [ ] Return lista de contactos

### Advanced Features

- [ ] **Task 7**: Editar contacto con cambio de roles (AC: 2, 3, 4)
  - [ ] Reutilizar ContactForm en modo "edit"
  - [ ] Pre-llenar datos actuales
  - [ ] Si cambia isPrimaryContact → validar swap
  - [ ] Si intenta desmarcar único primary → error
  - [ ] PATCH /api/contacts/[id]

- [ ] **Task 8**: API PATCH /api/contacts/[id] - Update (AC: 2, 3, 4)
  - [ ] Crear `src/app/api/contacts/[id]/route.ts`
  - [ ] PATCH handler con validación
  - [ ] Si isPrimaryContact cambió a true → swap RPC
  - [ ] Si isPrimaryContact cambió a false → validar que no es único
  - [ ] Si isEscalationContact cambió → swap RPC
  - [ ] Return updated contact

- [ ] **Task 9**: Validación "Debe existir un primary" (AC: 3)
  - [ ] En service: `validatePrimaryContactExists(companyId)`
  - [ ] Antes de desactivar o desmarcar: verificar count de primary
  - [ ] Error si intenta dejar empresa sin primary
  - [ ] UI: deshabilitar checkbox si es único primary

- [ ] **Task 10**: Badge visual para roles (AC: 1)
  - [ ] Badge "Contacto Principal" (green) si isPrimaryContact
  - [ ] Badge "Escalamiento" (orange) si isEscalationContact
  - [ ] Tooltip explicando el rol

## Dev Notes

### Architecture Compliance

**Stack Tecnológico:**
- Patterns de RLS del Epic 1 (must follow)
- Dialog de shadcn/ui para formulario modal
- Supabase RPC functions para transacciones atómicas
- React Query para data fetching

**Patrones Establecidos:**
- Story 2.1: Company CRUD patterns
- Story 2.2: DataTable, Tabs, Soft delete
- Epic 1 Retrospective: RLS lessons, atomicity

**Complejidad Técnica:**
- **Transacciones atómicas** para swap de primary/escalation
- **Validación de negocio** (1 primary obligatorio)
- **SQL functions** necesarias (no se puede hacer solo con queries)

### Database Schema

```prisma
model Contact {
  id                  String   @id @default(uuid()) @db.Uuid
  tenantId            String   @map("tenant_id") @db.Uuid
  companyId           String   @map("company_id") @db.Uuid
  firstName           String   @map("first_name") @db.VarChar(100)
  lastName            String   @map("last_name") @db.VarChar(100)
  email               String   @db.VarChar(255)
  phone               String?  @db.VarChar(50)
  position            String?  @db.VarChar(100)
  isPrimaryContact    Boolean  @default(false) @map("is_primary_contact")
  isEscalationContact Boolean  @default(false) @map("is_escalation_contact")
  isActive            Boolean  @default(true) @map("is_active")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @default(now()) @updatedAt @map("updated_at")

  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  company       Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  collections   Collection[]
  sentMessages  SentMessage[]

  @@index([tenantId])
  @@index([companyId])
  @@map("contacts")
}
```

**RLS Policies:**
```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "tenant_isolation_select" ON contacts
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy INSERT
CREATE POLICY "tenant_isolation_insert" ON contacts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy UPDATE
CREATE POLICY "tenant_isolation_update" ON contacts
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy DELETE
CREATE POLICY "tenant_isolation_delete" ON contacts
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### SQL Functions for Atomic Swaps

**Critical: Estas funciones son OBLIGATORIAS para garantizar atomicidad**

```sql
-- Función para cambiar primary contact atómicamente
CREATE OR REPLACE FUNCTION swap_primary_contact(
  p_company_id UUID,
  p_new_primary_id UUID
) RETURNS void AS $$
BEGIN
  -- Desmarcar todos los primary contacts de esta empresa
  UPDATE contacts
  SET is_primary_contact = false, updated_at = NOW()
  WHERE company_id = p_company_id
    AND is_primary_contact = true
    AND tenant_id = current_setting('app.current_tenant_id')::uuid;

  -- Marcar el nuevo como primary
  UPDATE contacts
  SET is_primary_contact = true, updated_at = NOW()
  WHERE id = p_new_primary_id
    AND company_id = p_company_id
    AND tenant_id = current_setting('app.current_tenant_id')::uuid;

  -- Verificar que existe al menos un primary
  IF NOT EXISTS (
    SELECT 1 FROM contacts
    WHERE company_id = p_company_id
      AND is_primary_contact = true
      AND tenant_id = current_setting('app.current_tenant_id')::uuid
  ) THEN
    RAISE EXCEPTION 'Must have at least one primary contact';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para cambiar escalation contact atómicamente
CREATE OR REPLACE FUNCTION swap_escalation_contact(
  p_company_id UUID,
  p_new_escalation_id UUID
) RETURNS void AS $$
BEGIN
  -- Desmarcar todos los escalation contacts de esta empresa
  UPDATE contacts
  SET is_escalation_contact = false, updated_at = NOW()
  WHERE company_id = p_company_id
    AND is_escalation_contact = true
    AND tenant_id = current_setting('app.current_tenant_id')::uuid;

  -- Marcar el nuevo como escalation
  UPDATE contacts
  SET is_escalation_contact = true, updated_at = NOW()
  WHERE id = p_new_escalation_id
    AND company_id = p_company_id
    AND tenant_id = current_setting('app.current_tenant_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar que empresa tiene primary contact
CREATE OR REPLACE FUNCTION validate_primary_contact_exists(
  p_company_id UUID
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM contacts
    WHERE company_id = p_company_id
      AND is_primary_contact = true
      AND is_active = true
      AND tenant_id = current_setting('app.current_tenant_id')::uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DB Trigger para garantizar un solo primary contact por empresa (Implementation Readiness H1)
CREATE OR REPLACE FUNCTION check_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary_contact = true THEN
    IF EXISTS (
      SELECT 1 FROM contacts
      WHERE company_id = NEW.company_id
        AND is_primary_contact = true
        AND id != NEW.id
        AND is_active = true
        AND tenant_id = current_setting('app.current_tenant_id')::uuid
    ) THEN
      RAISE EXCEPTION 'Company already has a primary contact';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_primary_contact
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION check_single_primary_contact();
```

**⚠️ CRÍTICO - SECURITY DEFINER:**
Estas funciones usan `SECURITY DEFINER` porque necesitan hacer UPDATE en múltiples filas en una transacción. Sin embargo, validamos `tenant_id` explícitamente en cada query para mantener aislamiento multi-tenant.

### Validation Schema

```typescript
// src/lib/validations/contact-schema.ts

import { z } from 'zod';

/**
 * Schema de validación para crear/editar un contacto.
 *
 * @remarks
 * - email debe ser válido
 * - firstName y lastName son requeridos
 * - phone es opcional
 * - isPrimaryContact y isEscalationContact no pueden ser ambos true
 */
export const contactSchema = z.object({
  companyId: z.string().uuid("Company ID inválido"),
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  position: z.string().max(100).optional().or(z.literal("")),
  isPrimaryContact: z.boolean().default(false),
  isEscalationContact: z.boolean().default(false),
}).refine(
  (data) => !(data.isPrimaryContact && data.isEscalationContact),
  {
    message: "Un contacto no puede ser Primary y Escalation al mismo tiempo",
    path: ["isPrimaryContact"],
  }
);

export type ContactFormData = z.infer<typeof contactSchema>;
```

### Service Implementation

```typescript
// src/lib/services/contact-service.ts

import { createClient } from '@/lib/db/supabase';
import { ConflictError, ValidationError } from '@/lib/errors/app-errors';
import type { ContactFormData } from '@/lib/validations/contact-schema';

/**
 * Crea un nuevo contacto para una empresa.
 *
 * @param data - Datos del contacto validados
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto creado
 * @throws {ValidationError} Si hay problemas de validación de negocio
 *
 * @example
 * ```ts
 * const contact = await createContact(data, tenantId);
 * ```
 */
export async function createContact(data: ContactFormData, tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // Validar que company pertenece al tenant
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', data.companyId)
    .single();

  if (!company) {
    throw new ValidationError('Company not found or does not belong to tenant');
  }

  // Crear contacto
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      tenant_id: tenantId,
      company_id: data.companyId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      position: data.position || null,
      is_primary_contact: data.isPrimaryContact,
      is_escalation_contact: data.isEscalationContact,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  // Si es primary, hacer swap atómico
  if (data.isPrimaryContact) {
    await supabase.rpc('swap_primary_contact', {
      p_company_id: data.companyId,
      p_new_primary_id: contact.id
    });
  }

  // Si es escalation, hacer swap atómico
  if (data.isEscalationContact) {
    await supabase.rpc('swap_escalation_contact', {
      p_company_id: data.companyId,
      p_new_escalation_id: contact.id
    });
  }

  return contact;
}

/**
 * Obtiene todos los contactos de una empresa.
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con lista de contactos ordenados (primary first)
 */
export async function getContactsByCompany(companyId: string, tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('is_primary_contact', { ascending: false })
    .order('is_escalation_contact', { ascending: false })
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  return data;
}

/**
 * Actualiza un contacto existente.
 *
 * @param contactId - ID del contacto
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto actualizado
 * @throws {ValidationError} Si intenta desmarcar único primary
 */
export async function updateContact(
  contactId: string,
  data: Partial<ContactFormData>,
  tenantId: string
) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // Get current contact
  const { data: current } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!current) {
    throw new NotFoundError('Contact', contactId);
  }

  // Validar: si es el único primary y se intenta desmarcar
  if (current.is_primary_contact && data.isPrimaryContact === false) {
    const { data: primaryCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact' })
      .eq('company_id', current.company_id)
      .eq('is_primary_contact', true)
      .eq('is_active', true);

    if (primaryCount && primaryCount.length === 1) {
      throw new ValidationError('Debe haber un contacto principal');
    }
  }

  // Update basic fields
  const { data: updated, error } = await supabase
    .from('contacts')
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      position: data.position || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  // Si cambió isPrimaryContact a true, hacer swap
  if (data.isPrimaryContact && !current.is_primary_contact) {
    await supabase.rpc('swap_primary_contact', {
      p_company_id: current.company_id,
      p_new_primary_id: contactId
    });
  }

  // Si cambió isEscalationContact, hacer swap
  if (data.isEscalationContact !== undefined && data.isEscalationContact !== current.is_escalation_contact) {
    if (data.isEscalationContact) {
      await supabase.rpc('swap_escalation_contact', {
        p_company_id: current.company_id,
        p_new_escalation_id: contactId
      });
    } else {
      // Desmarcar escalation
      await supabase
        .from('contacts')
        .update({ is_escalation_contact: false })
        .eq('id', contactId);
    }
  }

  return updated;
}

/**
 * Desactiva un contacto (soft delete).
 *
 * @param contactId - ID del contacto
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto desactivado
 * @throws {ValidationError} Si es el único primary contact
 */
export async function deactivateContact(contactId: string, tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // Validar que no sea el único primary
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!contact) {
    throw new NotFoundError('Contact', contactId);
  }

  if (contact.is_primary_contact) {
    const { data: primaryCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact' })
      .eq('company_id', contact.company_id)
      .eq('is_primary_contact', true)
      .eq('is_active', true);

    if (primaryCount && primaryCount.length === 1) {
      throw new ValidationError('Asigne otro contacto principal primero');
    }
  }

  const { data: deactivated, error } = await supabase
    .from('contacts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to deactivate contact: ${error.message}`);
  }

  return deactivated;
}
```

### Contact Form Component

```typescript
// src/components/forms/contact-form.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/validations/contact-schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

/**
 * Props del formulario de contacto.
 */
interface ContactFormProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialData?: Partial<ContactFormData>;
  contactId?: string;
}

/**
 * Formulario para crear o editar un contacto de empresa.
 *
 * @component
 * @param props - Las propiedades del componente
 *
 * @example
 * ```tsx
 * <ContactForm
 *   companyId={companyId}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={refetch}
 * />
 * ```
 */
export function ContactForm({
  companyId,
  open,
  onOpenChange,
  onSuccess,
  mode = 'create',
  initialData,
  contactId
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      companyId,
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      position: initialData?.position || '',
      isPrimaryContact: initialData?.isPrimaryContact || false,
      isEscalationContact: initialData?.isEscalationContact || false,
    },
  });

  const isPrimaryWatch = form.watch('isPrimaryContact');
  const isEscalationWatch = form.watch('isEscalationContact');

  async function onSubmit(data: ContactFormData) {
    setIsLoading(true);
    setApiError(null);

    try {
      const url = mode === 'create' ? '/api/contacts' : `/api/contacts/${contactId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar contacto');
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Agregar Contacto' : 'Editar Contacto'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contacto@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+52 555 1234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto</FormLabel>
                  <FormControl>
                    <Input placeholder="CFO, Contador, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2 border-t">
              <FormField
                control={form.control}
                name="isPrimaryContact"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isEscalationWatch}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Contacto Principal (para cobranzas)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isEscalationContact"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPrimaryWatch}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Contacto de Escalamiento
                    </FormLabel>
                  </FormItem>
                )}
              />

              {(isPrimaryWatch && isEscalationWatch) && (
                <p className="text-sm text-orange-600">
                  ⚠️ Un contacto no puede ser Primary y Escalation simultáneamente
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : mode === 'create' ? 'Agregar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Contacts List Component

```typescript
// src/components/contacts/contacts-list.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ContactForm } from '@/components/forms/contact-form';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  isPrimaryContact: boolean;
  isEscalationContact: boolean;
}

interface ContactsListProps {
  contacts: Contact[];
  companyId: string;
  onRefresh: () => void;
}

/**
 * Lista de contactos de una empresa con badges de roles.
 *
 * @component
 */
export function ContactsList({ contacts, companyId, onRefresh }: ContactsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay contactos registrados</p>
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
          Contactos ({contacts.length})
        </h3>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          Agregar Contacto
        </Button>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </h4>
                  {contact.isPrimaryContact && (
                    <Badge variant="success">Contacto Principal</Badge>
                  )}
                  {contact.isEscalationContact && (
                    <Badge variant="warning">Escalamiento</Badge>
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
              </div>
            </div>
          </div>
        ))}
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

### File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── companies/
│   │       └── [companyId]/
│   │           └── page.tsx           # Update: Tab Contactos (Task 4)
│   └── api/
│       └── contacts/
│           ├── route.ts                # POST, GET (Task 1, 6)
│           └── [id]/
│               └── route.ts            # GET, PATCH, DELETE (Task 8)
│
├── components/
│   ├── contacts/
│   │   └── contacts-list.tsx           # Lista (Task 5)
│   └── forms/
│       └── contact-form.tsx            # Dialog form (Task 3)
│
├── lib/
│   ├── services/
│   │   └── contact-service.ts          # Business logic (Task 2)
│   └── validations/
│       └── contact-schema.ts           # Zod schema (Task 0.4)
│
└── prisma/
    ├── schema.prisma                   # Contact model (Task 0.1)
    └── migrations/
        └── XXXXXX_add_contact_model/
            └── migration.sql           # Generated + RLS + Functions (Task 0.2, 0.3)
```

### Testing Requirements

**Atomicity Tests (CRÍTICO):**
```typescript
describe('Contact Primary Swap Atomicity', () => {
  it('should swap primary contact atomically', async () => {
    const company = await createCompany({ name: 'Test', taxId: 'RFC-1' }, testTenantId);

    // Create contact A as primary
    const contactA = await createContact({
      companyId: company.id,
      firstName: 'Contact',
      lastName: 'A',
      email: 'a@test.com',
      isPrimaryContact: true
    }, testTenantId);

    expect(contactA.is_primary_contact).toBe(true);

    // Create contact B as primary (should swap)
    const contactB = await createContact({
      companyId: company.id,
      firstName: 'Contact',
      lastName: 'B',
      email: 'b@test.com',
      isPrimaryContact: true
    }, testTenantId);

    // Verify A is no longer primary, B is primary
    const updatedA = await getContactById(contactA.id, testTenantId);
    expect(updatedA.is_primary_contact).toBe(false);
    expect(contactB.is_primary_contact).toBe(true);

    // Verify only 1 primary exists
    const contacts = await getContactsByCompany(company.id, testTenantId);
    const primaryCount = contacts.filter(c => c.is_primary_contact).length;
    expect(primaryCount).toBe(1);
  });
});
```

**Validation Tests:**
```typescript
describe('Contact Validation Rules', () => {
  it('should prevent deactivating only primary contact', async () => {
    const company = await createCompany({ name: 'Test', taxId: 'RFC-1' }, testTenantId);
    const contact = await createContact({
      companyId: company.id,
      firstName: 'Only',
      lastName: 'Primary',
      email: 'only@test.com',
      isPrimaryContact: true
    }, testTenantId);

    await expect(
      deactivateContact(contact.id, testTenantId)
    ).rejects.toThrow('Asigne otro contacto principal primero');
  });

  it('should allow both primary and escalation on different contacts', async () => {
    const company = await createCompany({ name: 'Test', taxId: 'RFC-1' }, testTenantId);

    const primary = await createContact({
      companyId: company.id,
      firstName: 'Primary',
      lastName: 'Contact',
      email: 'primary@test.com',
      isPrimaryContact: true
    }, testTenantId);

    const escalation = await createContact({
      companyId: company.id,
      firstName: 'Escalation',
      lastName: 'Contact',
      email: 'escalation@test.com',
      isEscalationContact: true
    }, testTenantId);

    expect(primary.is_primary_contact).toBe(true);
    expect(escalation.is_escalation_contact).toBe(true);
  });
});
```

### Performance Targets

- **Lista de contactos:** <200ms (10 contactos)
- **Crear contacto:** <300ms
- **Swap primary contact:** <200ms (transacción atómica)
- **Update contacto:** <300ms

### Security Checklist

- [ ] ✅ RLS policies en tabla contacts
- [ ] ✅ SQL functions validan tenant_id explícitamente
- [ ] ✅ SECURITY DEFINER justificado (transacción atómica)
- [ ] ⚠️ SQL functions NO usan service role key (usan current_setting)
- [ ] ✅ Validación de pertenencia de company antes de crear contacto
- [ ] ✅ Tests de aislamiento RLS

### Dependencies

**Story 2.1 MUST be completed:**
- ✅ Company model existe
- ✅ RLS policies configuradas
- ✅ Tenant context establecido

**Story 2.2 provides:**
- ✅ Company detail page con tabs
- ✅ Tab "Contactos" placeholder

**No new external dependencies**

### References

- **[Source: docs/epics/epic-2-crm.md#Story-2.3]** - User story
- **[Source: docs/architecture.md#Database-Schema]** - Contact model
- **[Source: Epic 1 Retrospective]** - SECURITY DEFINER lessons
- **[Source: Story 2.2]** - Tabs pattern established

---

## Dev Agent Record

### Context Reference

Story contexted with:
- Epic 2 specification (Story 2.3)
- Stories 2.1, 2.2 (patterns established)
- Architecture document (SQL functions, atomicity)
- Epic 1 Retrospective (SECURITY DEFINER warnings)

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Prerequisites:** Stories 2.1, 2.2 MUST be completed

**Critical Technical Challenges:**
- **Atomic swaps** require SQL functions (cannot be done with simple queries)
- **SECURITY DEFINER** usage justified but requires explicit tenant_id validation
- **Business validation:** 1 primary contact mandatory
- **Race conditions** prevented by RPC transactions

**Estimated Effort:** 10-12 hours

**Key Success Factors:**
- SQL functions tested for atomicity
- Primary contact validation working correctly
- Dialog UX intuitive (checkboxes mutually exclusive)
- Tests verify transactional integrity

### File List

Files to create/modify:
- `prisma/schema.prisma` - Add Contact model
- `prisma/migrations/XXXXXX_add_contact_model/migration.sql` - Schema + RLS + Functions
- `src/lib/validations/contact-schema.ts` - NEW
- `src/lib/services/contact-service.ts` - NEW
- `src/components/forms/contact-form.tsx` - NEW
- `src/components/contacts/contacts-list.tsx` - NEW
- `src/app/api/contacts/route.ts` - NEW
- `src/app/api/contacts/[id]/route.ts` - NEW
- `src/app/(dashboard)/companies/[companyId]/page.tsx` - UPDATE (Tab Contactos)
- `tests/services/contact-service.test.ts` - NEW (atomicity tests)
- `tests/api/contacts.test.ts` - NEW

---

**Generated:** 2025-12-02
**Epic:** 2 - CRM y Gestión de Clientes
**Priority:** High (contact management critical)
**Next Story:** 2-4-editar-y-desactivar-contactos (extends 2-3)
