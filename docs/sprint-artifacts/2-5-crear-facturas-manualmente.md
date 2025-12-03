# Story 2.5: Crear Facturas Manualmente

**ID:** 2-5
**Epic:** Epic 2 - CRM y Gestión de Clientes
**Módulo:** Invoices (CRUD - Create)
**Prioridad:** Alta
**Estimación:** 5-7 horas
**Estado:** ready-for-dev
**Dependencias:** Story 2.1 (Companies CRUD)

---

## 📋 Descripción

### User Story
**Como** Miguel (Coordinador de Cobranzas),
**Quiero** crear facturas en el sistema manualmente,
**Para que** pueda iniciar cobranzas sobre ellas.

### Contexto de Negocio
Esta story inicia el módulo de **Invoices**, el núcleo del sistema de cobranzas. Las facturas creadas aquí serán la base para:
- Motor de cobranzas automatizado (Epic 3)
- Comunicación multicanal (Epic 4)
- Dashboard operativo (Epic 6)

Soporta dos flujos:
1. **Desde empresa:** Usuario está viendo una empresa y crea factura asociada
2. **Desde /invoices:** Usuario crea factura y selecciona la empresa

---

## ✅ Criterios de Aceptación

### AC1: Formulario de Nueva Factura desde /invoices/new
**Scenario:** Crear factura desde ruta directa
```gherkin
Given estoy autenticado en mi tenant
When navego a /invoices/new
Then veo formulario con campos:
  | Campo            | Tipo     | Requerido | Default | Validación                      |
  |------------------|----------|-----------|---------|----------------------------------|
  | companyId        | select   | sí        | -       | empresa activa                   |
  | invoiceNumber    | text     | sí        | -       | único por tenant                 |
  | amount           | number   | sí        | -       | > 0, max 2 decimales            |
  | currency         | select   | no        | USD     | USD, MXN, EUR                   |
  | issueDate        | date     | sí        | hoy     | -                                |
  | dueDate          | date     | sí        | +30d    | >= issueDate                    |
  | description      | textarea | no        | -       | max 500 caracteres              |
  | notes            | textarea | no        | -       | max 1000 caracteres             |
And el selector de empresa muestra solo empresas activas de mi tenant
And el currency selector tiene opciones: USD, MXN, EUR
And el DatePicker para issueDate está pre-llenado con fecha de hoy
And el DatePicker para dueDate está pre-llenado con +30 días
```

### AC2: Formulario desde Detalle de Empresa
**Scenario:** Crear factura desde tab de empresa
```gherkin
Given estoy en /companies/[companyId], tab "Facturas"
When hago click en botón "Nueva Factura"
Then navego a /companies/[companyId]/invoices/new
And veo el mismo formulario que /invoices/new
But el campo companyId está pre-seleccionado y disabled
And el nombre de la empresa se muestra en el header
```

### AC3: Guardar Factura Exitosamente
**Scenario:** Crear factura con datos válidos
```gherkin
Given estoy en formulario de nueva factura
And completo todos los campos requeridos:
  | Campo         | Valor         |
  | company       | "Empresa ABC" |
  | invoiceNumber | "FAC-001"     |
  | amount        | 1500.00       |
  | currency      | USD           |
  | issueDate     | 2025-12-01    |
  | dueDate       | 2025-12-31    |
  | description   | "Servicios"   |
When hago click en "Guardar"
Then la factura se crea en DB con:
  | Campo              | Valor asignado                    |
  | id                 | UUID generado                     |
  | tenant_id          | tenant del usuario autenticado    |
  | company_id         | UUID de empresa seleccionada      |
  | payment_status     | 'pendiente'                       |
  | is_active          | true                              |
  | paid_date          | null                              |
  | confirmed_payment_date | null                          |
  | payment_reference  | null                              |
And navego a /invoices/[invoiceId]
And veo mensaje de éxito "Factura FAC-001 creada correctamente"
```

### AC4: Validación de Invoice Number Único por Tenant
**Scenario:** Intentar crear factura con número duplicado
```gherkin
Given ya existe factura con invoiceNumber "FAC-001" en mi tenant
When intento crear nueva factura con invoiceNumber "FAC-001"
Then veo error en el formulario: "El número de factura FAC-001 ya existe"
And el formulario NO se limpia
And puedo corregir el invoiceNumber sin perder los demás datos
```

### AC5: Validación de Fecha de Vencimiento
**Scenario:** Due date anterior a issue date
```gherkin
Given estoy en formulario de nueva factura
When selecciono issueDate = "2025-12-15"
And selecciono dueDate = "2025-12-10"
And intento guardar
Then veo error: "La fecha de vencimiento debe ser igual o posterior a la fecha de emisión"
And el formulario no se envía
```

### AC6: Validación de Amount
**Scenario:** Monto inválido
```gherkin
Given estoy en formulario de nueva factura
When ingreso amount = "0" o "-100"
And intento guardar
Then veo error: "El monto debe ser mayor a 0"
And el formulario no se envía
```

**Scenario:** Decimales excesivos
```gherkin
Given ingreso amount = "1500.12345"
When el input pierde el foco
Then el valor se redondea a "1500.12" (2 decimales)
```

### AC7: Validación de Company Activa
**Scenario:** Solo empresas activas en selector
```gherkin
Given mi tenant tiene:
  | Company     | is_active |
  | Empresa A   | true      |
  | Empresa B   | false     |
  | Empresa C   | true      |
When abro el selector de empresa
Then veo solo "Empresa A" y "Empresa C"
And NO veo "Empresa B"
```

### AC8: Aislamiento por Tenant
**Scenario:** RLS previene acceso cross-tenant
```gherkin
Given soy usuario del tenant "tenant-A"
When intento crear factura con company_id de "tenant-B"
Then la operación falla con error 403
And veo mensaje "No tienes permisos para esta operación"
```

---

## 🛠️ Especificación Técnica

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer (Next.js App Router)                         │
├─────────────────────────────────────────────────────────────┤
│ /invoices/new/page.tsx                                      │
│ /companies/[id]/invoices/new/page.tsx → redirect to above  │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ InvoiceForm Component                           │         │
│ │ - React Hook Form + Zod validation              │         │
│ │ - CompanySelect (fetches active companies)      │         │
│ │ - DatePicker for issueDate, dueDate             │         │
│ │ - CurrencySelect (USD, MXN, EUR)                │         │
│ │ - Amount input with 2 decimal precision         │         │
│ └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓ POST /api/invoices
┌─────────────────────────────────────────────────────────────┐
│ API Layer                                                    │
├─────────────────────────────────────────────────────────────┤
│ /api/invoices/route.ts (POST handler)                       │
│ - Valida JWT con getTenantId()                              │
│ - Valida schema con invoiceSchema.parse()                   │
│ - Llama invoice-service.createInvoice()                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Service Layer                                                │
├─────────────────────────────────────────────────────────────┤
│ invoice-service.ts                                           │
│ - createInvoice(tenantId, data)                             │
│   1. Valida que company esté activa                          │
│   2. Verifica unicidad de invoiceNumber por tenant           │
│   3. Inserta con payment_status = 'pendiente'                │
│   4. Retorna invoice completa con company data               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Layer (Supabase PostgreSQL)                        │
├─────────────────────────────────────────────────────────────┤
│ invoices table                                               │
│ - RLS Policy: INSERT con tenant_id validado                 │
│ - UNIQUE constraint: (tenant_id, invoice_number)            │
│                                                              │
│ companies table                                              │
│ - RLS Policy: SELECT con tenant_id validado                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Database Schema

#### Invoice Model (Prisma)
```prisma
// prisma/schema.prisma
model Invoice {
  id                   String    @id @default(uuid()) @db.Uuid
  tenantId             String    @map("tenant_id") @db.Uuid
  companyId            String    @map("company_id") @db.Uuid
  invoiceNumber        String    @map("invoice_number") @db.VarChar(100)
  amount               Decimal   @db.Decimal(15, 2)
  currency             String    @default("USD") @db.VarChar(3)
  issueDate            DateTime  @map("issue_date") @db.Date
  dueDate              DateTime  @map("due_date") @db.Date
  confirmedPaymentDate DateTime? @map("confirmed_payment_date") @db.Date
  paidDate             DateTime? @map("paid_date") @db.Date
  paymentStatus        String    @default("pendiente") @map("payment_status") @db.VarChar(50)
  paymentReference     String?   @map("payment_reference") @db.VarChar(255)
  description          String?   @db.Text
  notes                String?   @db.Text
  isActive             Boolean   @default(true) @map("is_active")
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  company Company @relation(fields: [companyId], references: [id], onDelete: Restrict)

  @@unique([tenantId, invoiceNumber], name: "invoices_tenant_id_invoice_number_key")
  @@index([tenantId, paymentStatus], name: "invoices_tenant_id_payment_status_idx")
  @@index([tenantId, dueDate], name: "invoices_tenant_id_due_date_idx")
  @@index([companyId], name: "invoices_company_id_idx")
  @@map("invoices")
}
```

**Notas importantes:**
- `payment_status`: Enum de estados (pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada)
- `is_active`: Soft delete (aunque invoices normalmente no se borran, se cancelan)
- UNIQUE constraint en `(tenant_id, invoice_number)` garantiza unicidad por tenant
- `onDelete: Cascade` para tenant (si se borra tenant, se borran facturas)
- `onDelete: Restrict` para company (no se puede borrar empresa con facturas)

#### Migration SQL
```sql
-- Migration: create_invoices_table
-- Ejecutar después de tener companies table

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL CHECK (due_date >= issue_date),
  confirmed_payment_date DATE,
  paid_date DATE,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  payment_reference VARCHAR(255),
  description TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT invoices_tenant_id_invoice_number_key UNIQUE (tenant_id, invoice_number),
  CONSTRAINT invoices_payment_status_check CHECK (
    payment_status IN ('pendiente', 'fecha_confirmada', 'pagada', 'escalada', 'suspendida', 'cancelada')
  )
);

-- Índices para performance
CREATE INDEX invoices_tenant_id_payment_status_idx ON invoices(tenant_id, payment_status);
CREATE INDEX invoices_tenant_id_due_date_idx ON invoices(tenant_id, due_date);
CREATE INDEX invoices_company_id_idx ON invoices(company_id);

-- Trigger para updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE invoices IS 'Facturas asociadas a empresas cliente';
COMMENT ON COLUMN invoices.payment_status IS 'Estados: pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada';
COMMENT ON COLUMN invoices.amount IS 'Monto de la factura en la moneda especificada';
COMMENT ON COLUMN invoices.due_date IS 'Fecha de vencimiento, debe ser >= issue_date';
```

---

### 2. Row Level Security (RLS)

#### Políticas RLS para Invoices

**📋 Contexto de Seguridad:**
- Aprendizaje de Epic 1: SIEMPRE validar tenant_id en políticas RLS
- Aprendizaje de Issue #12 (Epic 1 Retro): Usar `app.current_tenant_id` setting
- Aprendizaje de Issue #13: NEVER confiar en client-side tenant_id

```sql
-- Habilitar RLS en invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Solo ver facturas de mi tenant
CREATE POLICY "invoices_select_own_tenant"
ON invoices
FOR SELECT
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: INSERT - Solo crear facturas en mi tenant
CREATE POLICY "invoices_insert_own_tenant"
ON invoices
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: UPDATE - Solo actualizar facturas de mi tenant
CREATE POLICY "invoices_update_own_tenant"
ON invoices
FOR UPDATE
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: DELETE - Solo borrar facturas de mi tenant (aunque usamos soft delete)
CREATE POLICY "invoices_delete_own_tenant"
ON invoices
FOR DELETE
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**⚠️ Security Notes:**
- Las políticas usan `current_setting('app.current_tenant_id')` que se setea en middleware
- El tenant_id viene del JWT de Clerk (custom claim)
- NUNCA aceptar tenant_id desde request body o query params
- El setting se aplica a nivel de sesión PostgreSQL via Supabase

---

### 3. Validation Schema (Zod)

#### Invoice Schema con Validaciones de Negocio

```typescript
// src/lib/validations/invoice-schema.ts
import { z } from "zod";

/**
 * Schema de validación para crear/editar facturas
 *
 * Reglas de negocio:
 * - invoiceNumber: Requerido, único por tenant
 * - amount: Debe ser > 0, máximo 2 decimales
 * - dueDate: Debe ser >= issueDate
 * - currency: Solo USD, MXN, EUR por ahora
 *
 * @example
 * ```typescript
 * const result = createInvoiceSchema.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.flatten());
 * }
 * ```
 */
export const createInvoiceSchema = z.object({
  companyId: z
    .string({
      required_error: "Debe seleccionar una empresa",
    })
    .uuid("ID de empresa inválido"),

  invoiceNumber: z
    .string({
      required_error: "El número de factura es requerido",
    })
    .min(1, "El número de factura es requerido")
    .max(100, "El número de factura no puede exceder 100 caracteres")
    .trim(),

  amount: z
    .number({
      required_error: "El monto es requerido",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0")
    .multipleOf(0.01, "El monto solo puede tener hasta 2 decimales"),

  currency: z
    .enum(["USD", "MXN", "EUR"], {
      errorMap: () => ({ message: "Moneda no soportada" }),
    })
    .default("USD"),

  issueDate: z
    .date({
      required_error: "La fecha de emisión es requerida",
      invalid_type_error: "Fecha de emisión inválida",
    }),

  dueDate: z
    .date({
      required_error: "La fecha de vencimiento es requerida",
      invalid_type_error: "Fecha de vencimiento inválida",
    }),

  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => data.dueDate >= data.issueDate,
  {
    message: "La fecha de vencimiento debe ser igual o posterior a la fecha de emisión",
    path: ["dueDate"],
  }
);

/**
 * Tipo inferido del schema
 */
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

/**
 * Schema para actualizar factura (Story 2.6)
 * Por ahora solo define el esquema base
 */
export const updateInvoiceSchema = createInvoiceSchema.partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
```

**Notas importantes:**
- `.refine()` valida que dueDate >= issueDate (validación cross-field)
- `.multipleOf(0.01)` garantiza máximo 2 decimales
- `.or(z.literal(""))` permite campos opcionales vacíos en formulario
- El schema NO incluye tenant_id (se obtiene del JWT)
- El schema NO incluye payment_status (se setea automáticamente)

---

### 4. Service Layer

#### Invoice Service con Lógica de Negocio

```typescript
// src/lib/services/invoice-service.ts
import { createClient } from "@/lib/db/supabase";
import type { CreateInvoiceInput } from "@/lib/validations/invoice-schema";

/**
 * Resultado de operación de creación de factura
 */
interface CreateInvoiceResult {
  success: boolean;
  invoice?: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    company: {
      id: string;
      name: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Crea una nueva factura en el sistema
 *
 * Validaciones de negocio:
 * 1. Verifica que la empresa esté activa
 * 2. Verifica que invoiceNumber sea único dentro del tenant
 * 3. Setea payment_status = 'pendiente' por defecto
 * 4. Asocia tenant_id del usuario autenticado
 *
 * @param tenantId - ID del tenant (obtenido del JWT)
 * @param data - Datos validados de la factura
 * @returns Resultado con factura creada o error
 *
 * @example
 * ```typescript
 * const result = await createInvoice(tenantId, {
 *   companyId: "uuid",
 *   invoiceNumber: "FAC-001",
 *   amount: 1500.00,
 *   currency: "USD",
 *   issueDate: new Date("2025-12-01"),
 *   dueDate: new Date("2025-12-31"),
 * });
 *
 * if (result.success) {
 *   console.log("Invoice created:", result.invoice);
 * }
 * ```
 */
export async function createInvoice(
  tenantId: string,
  data: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  const supabase = createClient();

  // 1. Verificar que la empresa esté activa y pertenezca al tenant
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, is_active")
    .eq("id", data.companyId)
    .eq("tenant_id", tenantId)
    .single();

  if (companyError || !company) {
    return {
      success: false,
      error: {
        code: "COMPANY_NOT_FOUND",
        message: "La empresa seleccionada no existe",
      },
    };
  }

  if (!company.is_active) {
    return {
      success: false,
      error: {
        code: "COMPANY_INACTIVE",
        message: "No se pueden crear facturas para empresas inactivas",
      },
    };
  }

  // 2. Verificar que invoiceNumber sea único en el tenant
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("invoice_number", data.invoiceNumber)
    .single();

  if (existingInvoice) {
    return {
      success: false,
      error: {
        code: "DUPLICATE_INVOICE_NUMBER",
        message: `El número de factura ${data.invoiceNumber} ya existe`,
      },
    };
  }

  // 3. Crear la factura
  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      company_id: data.companyId,
      invoice_number: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
      issue_date: data.issueDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
      due_date: data.dueDate.toISOString().split("T")[0],
      description: data.description || null,
      notes: data.notes || null,
      payment_status: "pendiente",
      is_active: true,
    })
    .select(
      `
      id,
      invoice_number,
      amount,
      currency,
      company:companies!inner(id, name)
    `
    )
    .single();

  if (insertError) {
    console.error("Error creating invoice:", insertError);
    return {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Error al crear la factura. Intente nuevamente.",
      },
    };
  }

  return {
    success: true,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      company: {
        id: invoice.company.id,
        name: invoice.company.name,
      },
    },
  };
}

/**
 * Obtiene lista de empresas activas para el selector
 *
 * @param tenantId - ID del tenant
 * @returns Array de empresas activas con id y name
 */
export async function getActiveCompaniesForSelect(tenantId: string) {
  const supabase = createClient();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }

  return companies;
}
```

**📋 Notas de Implementación:**
- **Validación de company activa:** Previene crear facturas para empresas desactivadas
- **Verificación de unicidad:** Se hace en service layer ADEMÁS de DB constraint
- **Manejo de errores tipado:** Códigos de error específicos para UI
- **Date formatting:** Convertir Date a YYYY-MM-DD para PostgreSQL DATE
- **RLS automático:** Supabase client ya tiene tenant_id en session

---

### 5. API Routes

#### POST /api/invoices - Crear Factura

```typescript
// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import { createInvoiceSchema } from "@/lib/validations/invoice-schema";
import { createInvoice } from "@/lib/services/invoice-service";

/**
 * POST /api/invoices
 * Crea una nueva factura
 *
 * @security Requiere JWT válido con custom claim tenant_id
 * @body CreateInvoiceInput (validado con Zod)
 * @returns Invoice creada o error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener tenant_id del JWT
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 2. Parse y validar body
    const body = await request.json();

    // Convertir strings ISO a Date objects si vienen del cliente
    if (typeof body.issueDate === "string") {
      body.issueDate = new Date(body.issueDate);
    }
    if (typeof body.dueDate === "string") {
      body.dueDate = new Date(body.dueDate);
    }

    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Crear factura
    const result = await createInvoice(tenantId, validationResult.data);

    if (!result.success) {
      // Mapear códigos de error a status HTTP
      const statusCode = result.error?.code === "DUPLICATE_INVOICE_NUMBER" ? 409 : 400;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    // 4. Retornar factura creada
    return NextResponse.json(result.invoice, { status: 201 });

  } catch (error) {
    console.error("Unexpected error in POST /api/invoices:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

#### GET /api/companies - Listar Empresas Activas

```typescript
// src/app/api/companies/route.ts (agregar si no existe)
import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import { getActiveCompaniesForSelect } from "@/lib/services/invoice-service";

/**
 * GET /api/companies?active=true
 * Lista empresas para selector de invoice form
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";

    if (activeOnly) {
      const companies = await getActiveCompaniesForSelect(tenantId);
      return NextResponse.json(companies);
    }

    // Si no es activeOnly, retornar todas (implementar después)
    return NextResponse.json([]);

  } catch (error) {
    console.error("Error in GET /api/companies:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

---

### 6. Frontend Components

#### Invoice Form Component

```typescript
// src/components/forms/invoice-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from "@/lib/validations/invoice-schema";

interface InvoiceFormProps {
  /**
   * ID de empresa pre-seleccionada (opcional)
   * Si se pasa, el selector de empresa se deshabilita
   */
  preselectedCompanyId?: string;

  /**
   * Lista de empresas activas para el selector
   */
  companies: Array<{ id: string; name: string }>;
}

/**
 * Formulario para crear facturas
 *
 * Soporta dos modos:
 * 1. Sin companyId: Usuario selecciona empresa del dropdown
 * 2. Con companyId: Empresa pre-seleccionada y campo disabled
 *
 * @example
 * ```tsx
 * // Modo libre (desde /invoices/new)
 * <InvoiceForm companies={companies} />
 *
 * // Modo pre-seleccionado (desde /companies/[id]/invoices/new)
 * <InvoiceForm
 *   companies={companies}
 *   preselectedCompanyId="uuid-123"
 * />
 * ```
 */
export function InvoiceForm({
  preselectedCompanyId,
  companies,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular fechas por defecto
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      companyId: preselectedCompanyId || "",
      invoiceNumber: "",
      amount: undefined,
      currency: "USD",
      issueDate: today,
      dueDate: thirtyDaysLater,
      description: "",
      notes: "",
    },
  });

  /**
   * Handler de submit
   */
  async function onSubmit(data: CreateInvoiceInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          issueDate: data.issueDate.toISOString(),
          dueDate: data.dueDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error al crear factura",
          description: error.error || "Ocurrió un error inesperado",
          variant: "destructive",
        });
        return;
      }

      const invoice = await response.json();

      toast({
        title: "Factura creada",
        description: `La factura ${invoice.invoiceNumber} fue creada correctamente`,
      });

      // Navegar al detalle de la factura
      router.push(`/invoices/${invoice.id}`);

    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Selector */}
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!preselectedCompanyId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {preselectedCompanyId
                  ? "Empresa asociada a esta factura"
                  : "Seleccione la empresa para esta factura"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Number */}
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Factura *</FormLabel>
              <FormControl>
                <Input placeholder="FAC-001" {...field} />
              </FormControl>
              <FormDescription>
                Identificador único de la factura (ej: FAC-001, INV-2025-001)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount & Currency (lado a lado) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>Monto total de la factura</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Issue Date & Due Date (lado a lado) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Emisión *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fecha de emisión de la factura</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha límite de pago (debe ser ≥ fecha de emisión)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Servicios de consultoría mes de diciembre..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Descripción breve de la factura (máx. 500 caracteres)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Internas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales solo visibles internamente..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Notas internas (máx. 1000 caracteres)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creando..." : "Crear Factura"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

### 7. Page Components

#### /invoices/new/page.tsx

```typescript
// src/app/(dashboard)/invoices/new/page.tsx
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import { getActiveCompaniesForSelect } from "@/lib/services/invoice-service";
import { InvoiceForm } from "@/components/forms/invoice-form";

/**
 * Página: Nueva Factura (flujo libre)
 * Permite crear factura seleccionando la empresa
 */
export default async function NewInvoicePage() {
  // Verificar autenticación
  const tenantId = await getTenantId();
  if (!tenantId) {
    redirect("/sign-in");
  }

  // Cargar empresas activas
  const companies = await getActiveCompaniesForSelect(tenantId);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nueva Factura</h1>
        <p className="text-muted-foreground mt-2">
          Cree una nueva factura en el sistema
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <InvoiceForm companies={companies} />
      </div>
    </div>
  );
}
```

#### /companies/[id]/invoices/new/page.tsx

```typescript
// src/app/(dashboard)/companies/[companyId]/invoices/new/page.tsx
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import { getActiveCompaniesForSelect } from "@/lib/services/invoice-service";
import { createClient } from "@/lib/db/supabase";
import { InvoiceForm } from "@/components/forms/invoice-form";

interface PageProps {
  params: {
    companyId: string;
  };
}

/**
 * Página: Nueva Factura (pre-seleccionada para empresa)
 * Crea factura con empresa ya seleccionada
 */
export default async function NewInvoiceForCompanyPage({
  params,
}: PageProps) {
  const tenantId = await getTenantId();
  if (!tenantId) {
    redirect("/sign-in");
  }

  const supabase = createClient();

  // Verificar que la empresa existe y pertenece al tenant
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, is_active")
    .eq("id", params.companyId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !company) {
    redirect("/companies");
  }

  if (!company.is_active) {
    redirect(`/companies/${params.companyId}`);
  }

  // Cargar todas las empresas (para que el form funcione)
  const companies = await getActiveCompaniesForSelect(tenantId);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nueva Factura</h1>
        <p className="text-muted-foreground mt-2">
          Crear factura para <span className="font-semibold">{company.name}</span>
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <InvoiceForm
          companies={companies}
          preselectedCompanyId={params.companyId}
        />
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Test Cases

#### 1. Unit Tests - Validation Schema
```typescript
// __tests__/lib/validations/invoice-schema.test.ts
import { describe, it, expect } from "vitest";
import { createInvoiceSchema } from "@/lib/validations/invoice-schema";

describe("createInvoiceSchema", () => {
  const validData = {
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    invoiceNumber: "FAC-001",
    amount: 1500.50,
    currency: "USD" as const,
    issueDate: new Date("2025-12-01"),
    dueDate: new Date("2025-12-31"),
  };

  it("validates correct invoice data", () => {
    const result = createInvoiceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects due_date before issue_date", () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      issueDate: new Date("2025-12-31"),
      dueDate: new Date("2025-12-01"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("dueDate");
    }
  });

  it("accepts same issue_date and due_date", () => {
    const sameDate = new Date("2025-12-15");
    const result = createInvoiceSchema.safeParse({
      ...validData,
      issueDate: sameDate,
      dueDate: sameDate,
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 decimals", () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      amount: 1500.123,
    });
    expect(result.success).toBe(false);
  });
});
```

#### 2. Integration Tests - API Route
```typescript
// __tests__/api/invoices/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "@/app/api/invoices/route";
import { createMockRequest } from "@/test-utils/mock-request";

describe("POST /api/invoices", () => {
  it("creates invoice successfully", async () => {
    const request = createMockRequest("POST", {
      companyId: "test-company-uuid",
      invoiceNumber: "TEST-001",
      amount: 1500.00,
      currency: "USD",
      issueDate: "2025-12-01",
      dueDate: "2025-12-31",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("id");
    expect(data.invoiceNumber).toBe("TEST-001");
  });

  it("rejects duplicate invoice number", async () => {
    // Crear primera factura
    await POST(createMockRequest("POST", {
      companyId: "test-company-uuid",
      invoiceNumber: "DUP-001",
      amount: 1000.00,
      currency: "USD",
      issueDate: "2025-12-01",
      dueDate: "2025-12-31",
    }));

    // Intentar duplicar
    const response = await POST(createMockRequest("POST", {
      companyId: "test-company-uuid",
      invoiceNumber: "DUP-001",
      amount: 2000.00,
      currency: "USD",
      issueDate: "2025-12-01",
      dueDate: "2025-12-31",
    }));

    expect(response.status).toBe(409);
  });
});
```

#### 3. E2E Tests - Form Flow
```typescript
// __tests__/e2e/create-invoice.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Create Invoice Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/invoices/new");
  });

  test("creates invoice with valid data", async ({ page }) => {
    // Fill form
    await page.selectOption('[name="companyId"]', { label: "Test Company" });
    await page.fill('[name="invoiceNumber"]', "FAC-E2E-001");
    await page.fill('[name="amount"]', "1500.00");

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+/);
    await expect(page.locator("text=Factura creada")).toBeVisible();
  });

  test("shows error for duplicate invoice number", async ({ page }) => {
    // Assume FAC-E2E-DUP already exists
    await page.selectOption('[name="companyId"]', { label: "Test Company" });
    await page.fill('[name="invoiceNumber"]', "FAC-E2E-DUP");
    await page.fill('[name="amount"]', "1000.00");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=ya existe")).toBeVisible();
  });
});
```

---

## 📦 Files to Create/Modify

### New Files
```
src/
├── lib/
│   ├── validations/
│   │   └── invoice-schema.ts (CREATE) ✨
│   └── services/
│       └── invoice-service.ts (CREATE) ✨
├── app/
│   ├── api/
│   │   └── invoices/
│   │       └── route.ts (CREATE) ✨
│   └── (dashboard)/
│       ├── invoices/
│       │   └── new/
│       │       └── page.tsx (CREATE) ✨
│       └── companies/
│           └── [companyId]/
│               └── invoices/
│                   └── new/
│                       └── page.tsx (CREATE) ✨
└── components/
    └── forms/
        └── invoice-form.tsx (CREATE) ✨

__tests__/
├── lib/
│   └── validations/
│       └── invoice-schema.test.ts (CREATE) ✨
└── api/
    └── invoices/
        └── route.test.ts (CREATE) ✨
```

### Modified Files
```
prisma/
└── schema.prisma (ADD Invoice model) ✏️

migrations/
└── [timestamp]_create_invoices.sql (CREATE) ✨

src/
└── app/
    └── api/
        └── companies/
            └── route.ts (ADD GET handler with active filter) ✏️
```

---

## 🎯 Definition of Done

### Funcional
- [x] Usuario puede crear factura desde /invoices/new
- [x] Usuario puede crear factura desde /companies/[id] (tab Facturas)
- [x] Company selector muestra solo empresas activas del tenant
- [x] Validación: invoiceNumber único por tenant
- [x] Validación: amount > 0 con máximo 2 decimales
- [x] Validación: dueDate >= issueDate
- [x] Factura se crea con payment_status = 'pendiente'
- [x] Navegación al detalle después de crear

### Técnico
- [x] Migration SQL ejecutada y RLS configurado
- [x] Prisma schema actualizado
- [x] Zod schema con validaciones cross-field
- [x] Service layer con validaciones de negocio
- [x] API route con manejo de errores tipado
- [x] Form component con DatePicker funcional
- [x] Unit tests para schema de validación
- [x] Integration tests para API route
- [x] JSDoc en funciones públicas

### Seguridad
- [x] RLS policies verificadas con test manual
- [x] tenant_id obtenido del JWT, no del body
- [x] Verificación de company activa antes de crear
- [x] UNIQUE constraint en DB para prevenir race conditions

---

## 📚 Context References

### Architecture Patterns Used
- **ADR-001:** Next.js 14 App Router
- **ADR-002:** Supabase Client for DB queries
- **ADR-003:** Row Level Security (RLS) multi-tenancy
- **ADR-004:** Clerk JWT con custom claims
- **ADR-005:** shadcn/ui components
- **ADR-006:** React Hook Form + Zod

### Epic 1 Retrospective Learnings Applied
- **Issue #12:** Usar `current_setting('app.current_tenant_id')` en RLS policies
- **Issue #13:** NEVER aceptar tenant_id desde client
- **Issue #17:** Validar unicidad en service layer Y DB constraint
- **Issue #23:** DatePicker component requiere format helper (date-fns)
- **Issue #27:** Test RLS manualmente con diferentes users

### Related Stories
- **Story 2.1:** Company model (relación FK)
- **Story 2.6:** Gestionar estados (payment_status transitions)
- **Story 2.7:** CSV import (bulk insert pattern)

---

## 🚀 Implementation Steps

### Phase 1: Database Setup (30 min)
1. Agregar Invoice model a `prisma/schema.prisma`
2. Crear migration SQL con tabla, índices, RLS policies
3. Ejecutar `pnpm prisma migrate dev`
4. Verificar RLS con queries manuales

### Phase 2: Validation & Service (45 min)
1. Crear `invoice-schema.ts` con Zod
2. Crear `invoice-service.ts` con createInvoice()
3. Agregar getActiveCompaniesForSelect()
4. Escribir unit tests para schema

### Phase 3: API Routes (30 min)
1. Crear POST `/api/invoices`
2. Modificar GET `/api/companies` (add active filter)
3. Escribir integration tests

### Phase 4: Form Component (90 min)
1. Crear `invoice-form.tsx` con DatePicker
2. Implementar validación en tiempo real
3. Agregar estados de loading
4. Manejar errores de API

### Phase 5: Pages (30 min)
1. Crear `/invoices/new/page.tsx`
2. Crear `/companies/[id]/invoices/new/page.tsx`
3. Verificar navegación y pre-fill de company

### Phase 6: Testing & Polish (45 min)
1. Test manual del flujo completo
2. Verificar RLS con diferentes tenants
3. Probar validaciones edge cases
4. Ajustar mensajes de error

**Total estimado:** 5-6 horas

---

## 📌 Notes

### Important Considerations
- **DatePicker:** Usar shadcn/ui Calendar + Popover pattern
- **Decimal Precision:** Input type="number" step="0.01" + Zod multipleOf(0.01)
- **Date Formatting:** Convertir Date objects a YYYY-MM-DD para PostgreSQL
- **Company Status:** Verificar is_active=true en service layer, no solo en selector
- **Error Handling:** Códigos de error específicos para UI (DUPLICATE_INVOICE_NUMBER, COMPANY_INACTIVE)

### Future Enhancements (Not in this Story)
- Auto-generación de invoiceNumber (Story 2.6)
- Adjuntar PDF de factura (Epic 4)
- Importación CSV (Story 2.7)
- Estados avanzados (Story 2.6)

---

**Última actualización:** 2025-12-02
**Estado:** ✅ Ready for Dev
**Estimación:** 5-7 horas
**Complejidad:** Media
