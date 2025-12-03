# Story 2.7: Importar Facturas desde CSV

**ID:** 2-7
**Epic:** Epic 2 - CRM y Gestión de Clientes
**Módulo:** Invoices (Bulk Import)
**Prioridad:** Alta
**Estimación:** 7-9 horas
**Estado:** ready-for-dev
**Dependencias:** Story 2.5 (Crear Facturas), Story 2.1 (Companies)

---

## 📋 Descripción

### User Story
**Como** Miguel (Coordinador de Cobranzas),
**Quiero** importar facturas masivamente desde un archivo CSV,
**Para que** pueda cargar datos históricos desde mi ERP sin crear facturas una por una.

### Contexto de Negocio
Esta story resuelve la **migración inicial de datos** y **carga masiva periódica**:
- **Onboarding:** Empresas nuevas traen 100-500 facturas históricas
- **Integración ERP:** Exportar mensualmente desde sistemas contables
- **Ahorro de tiempo:** 500 facturas × 2 min = 16 horas → 5 minutos
- **Reducción de errores:** Validaciones automáticas vs. ingreso manual

El proceso es **transaccional** (all-or-nothing) para garantizar integridad:
- Si 1 fila falla, ninguna se importa
- Preview obligatorio antes de commit
- Validación exhaustiva por fila

---

## ✅ Criterios de Aceptación

### AC1: Descargar Template CSV
**Scenario:** Obtener plantilla con estructura correcta
```gherkin
Given estoy en /invoices/import
When hago click en "Descargar Template CSV"
Then descargo archivo "facturas_template.csv"
And el archivo contiene headers:
  | Header             | Descripción                          |
  | company_tax_id     | RFC/Tax ID de empresa (único)       |
  | invoice_number     | Número de factura (único por tenant)|
  | amount             | Monto (decimal, > 0)                |
  | currency           | Moneda (USD, MXN, EUR)              |
  | issue_date         | Fecha de emisión (YYYY-MM-DD)       |
  | due_date           | Fecha de vencimiento (YYYY-MM-DD)   |
  | description        | Descripción (opcional)              |
And el archivo incluye 3 filas de ejemplo con datos válidos
```

### AC2: Subir y Procesar CSV
**Scenario:** Upload de archivo CSV
```gherkin
Given estoy en /invoices/import
When hago click en zona de drop o "Seleccionar Archivo"
And selecciono archivo CSV válido
Then veo indicador de "Procesando..."
And el archivo se parsea en frontend
And veo preview de primeras 50 filas (o todas si < 50)
```

**Scenario:** Rechazar archivos inválidos
```gherkin
Given selecciono archivo que NO es CSV
When intento subirlo
Then veo error "Solo se permiten archivos .csv"
And NO se procesa el archivo
```

### AC3: Preview con Validaciones por Fila
**Scenario:** Ver preview de filas válidas e inválidas
```gherkin
Given subí archivo CSV con 10 filas
And 8 filas son válidas
And 2 filas tienen errores
When veo el preview
Then veo tabla con columnas:
  | Columna          | Contenido                           |
  | # Fila           | Número de fila en CSV (1-indexed)  |
  | Status           | ✅ Válida / ❌ Error                |
  | company_tax_id   | Valor del CSV                       |
  | invoice_number   | Valor del CSV                       |
  | amount           | Valor formateado                    |
  | Errores          | Lista de errores (si aplica)        |
And las filas con errores están resaltadas en rojo
And veo resumen: "8 válidas, 2 con errores de 10 total"
```

### AC4: Validaciones Exhaustivas por Fila
**Scenario:** Validar company_tax_id existe
```gherkin
Given fila tiene company_tax_id = "RFC999"
And NO existe empresa con ese tax_id en mi tenant
When se valida la fila
Then veo error: "Empresa con Tax ID 'RFC999' no encontrada"
```

**Scenario:** Validar invoice_number único
```gherkin
Given ya existe factura con invoice_number = "FAC-001" en mi tenant
And fila CSV tiene invoice_number = "FAC-001"
When se valida la fila
Then veo error: "Número de factura 'FAC-001' ya existe"
```

**Scenario:** Validar amount numérico positivo
```gherkin
Given fila tiene amount = "-100" o "abc"
When se valida la fila
Then veo error: "Monto debe ser un número positivo"
```

**Scenario:** Validar currency válida
```gherkin
Given fila tiene currency = "JPY" (no soportado)
When se valida la fila
Then veo error: "Moneda no soportada. Use: USD, MXN, EUR"
```

**Scenario:** Validar fechas formato ISO
```gherkin
Given fila tiene issue_date = "01/12/2025" (formato incorrecto)
When se valida la fila
Then veo error: "Fecha de emisión debe estar en formato YYYY-MM-DD"
```

**Scenario:** Validar due_date >= issue_date
```gherkin
Given fila tiene:
  | issue_date | 2025-12-15 |
  | due_date   | 2025-12-10 |
When se valida la fila
Then veo error: "Fecha de vencimiento debe ser >= fecha de emisión"
```

**Scenario:** Validar invoice_number único dentro del CSV
```gherkin
Given CSV tiene 2 filas con invoice_number = "FAC-002"
When se valida
Then ambas filas muestran error: "Número de factura duplicado en el archivo"
```

### AC5: Bloqueo de Importación con Errores
**Scenario:** No permitir importar con errores
```gherkin
Given preview muestra 8 válidas y 2 con errores
When intento hacer click en "Importar Facturas"
Then el botón está disabled
And veo mensaje: "Corrija los errores antes de importar"
```

**Scenario:** Habilitar importación solo si todas válidas
```gherkin
Given preview muestra 10 filas válidas y 0 errores
When veo el botón "Importar Facturas"
Then el botón está enabled
```

### AC6: Importación Transaccional (All-or-Nothing)
**Scenario:** Importar todas las filas válidas
```gherkin
Given preview muestra 50 filas válidas
When hago click en "Importar Facturas"
Then veo modal de confirmación:
  "¿Está seguro de importar 50 facturas?"
```

**Scenario:** Confirmar importación exitosa
```gherkin
Given confirmé la importación de 50 facturas
When el proceso termina exitosamente
Then se crean 50 registros en tabla invoices
And todas tienen payment_status = 'pendiente'
And todas tienen tenant_id de mi organización
And veo mensaje de éxito: "50 facturas importadas correctamente"
And navego a /invoices (lista de facturas)
```

**Scenario:** Rollback en caso de error
```gherkin
Given inicio importación de 100 facturas
And falla la creación de factura #50 (error de DB)
When se detecta el error
Then se hace ROLLBACK de las 49 facturas creadas
And veo error: "Error al importar. Ninguna factura fue creada."
And puedo reintentar después de revisar
```

### AC7: Límites y Performance
**Scenario:** Validar tamaño máximo de archivo
```gherkin
Given archivo CSV tiene > 1000 filas
When intento subirlo
Then veo error: "Máximo 1000 facturas por importación"
And el archivo no se procesa
```

**Scenario:** Performance aceptable
```gherkin
Given archivo CSV tiene 500 filas válidas
When confirmo la importación
Then el proceso completa en < 30 segundos
And veo progress bar durante el proceso
```

### AC8: Lookup de Company por Tax ID
**Scenario:** Asociar factura a empresa correcta
```gherkin
Given mi tenant tiene:
  | Company Name | Tax ID    |
  | Empresa A    | RFC-AAA   |
  | Empresa B    | RFC-BBB   |
And fila CSV tiene company_tax_id = "RFC-AAA"
When se importa la fila
Then la factura se asocia a company_id de "Empresa A"
And NO a "Empresa B"
```

### AC9: Aislamiento por Tenant
**Scenario:** No ver empresas de otros tenants
```gherkin
Given soy usuario del tenant "tenant-A"
And existe empresa con tax_id "RFC-XYZ" en tenant "tenant-B"
And mi CSV tiene fila con company_tax_id = "RFC-XYZ"
When se valida el CSV
Then veo error: "Empresa con Tax ID 'RFC-XYZ' no encontrada"
And NO se importa esa fila
```

### AC10: Re-importación y Manejo de Duplicados
**Scenario:** Detectar duplicados antes de importar
```gherkin
Given ya importé factura con invoice_number = "FAC-100"
And subo nuevo CSV con invoice_number = "FAC-100"
When se valida el preview
Then esa fila muestra error: "Número de factura 'FAC-100' ya existe"
And NO se importa
```

---

## 🛠️ Especificación Técnica

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer (Client-side Processing)                     │
├─────────────────────────────────────────────────────────────┤
│ /invoices/import/page.tsx                                   │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ CSVUploadZone Component                         │         │
│ │ - Drag & drop + file input                      │         │
│ │ - Parse CSV con papaparse                       │         │
│ │ - Validación básica (headers, formato)          │         │
│ └────────────────────────────────────────────────┘         │
│                 ↓ CSV parsed                                │
│ ┌────────────────────────────────────────────────┐         │
│ │ CSVPreviewTable Component                       │         │
│ │ - Muestra primeras 50 filas                     │         │
│ │ - Indica filas válidas/inválidas                │         │
│ │ - Lista errores por fila                        │         │
│ └────────────────────────────────────────────────┘         │
│                 ↓ Click "Importar"                          │
│          POST /api/invoices/import                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ API Layer (Server-side Validation + DB)                     │
├─────────────────────────────────────────────────────────────┤
│ /api/invoices/import/route.ts (POST handler)                │
│ - Re-valida TODAS las filas server-side                     │
│ - Lookup de company_id por tax_id                           │
│ - Verifica unicidad de invoice_number                       │
│ - Llama invoice-service.bulkImportInvoices()                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Service Layer (Transactional Import)                        │
├─────────────────────────────────────────────────────────────┤
│ invoice-service.ts                                           │
│ - bulkImportInvoices(tenantId, rows)                        │
│   1. Inicia transacción                                      │
│   2. Itera sobre rows validadas                              │
│   3. Crea cada invoice                                       │
│   4. Si falla 1, ROLLBACK de todas                           │
│   5. Si ok, COMMIT y retorna count                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Layer (Bulk Insert)                                │
├─────────────────────────────────────────────────────────────┤
│ invoices table                                               │
│ - Batch INSERT con RLS validado                             │
│ - UNIQUE constraint previene duplicados                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. CSV Template Structure

#### Template Headers y Formato

```csv
company_tax_id,invoice_number,amount,currency,issue_date,due_date,description
RFC-ABC123,FAC-2025-001,1500.00,USD,2025-01-15,2025-02-15,Servicios de consultoría enero
TAX-XYZ789,INV-001,2750.50,MXN,2025-01-10,2025-02-10,Productos vendidos
RFC-DEF456,FAC-2025-002,800.00,USD,2025-01-20,2025-03-20,
```

**Reglas de formato:**
- **Separador:** Coma (`,`)
- **Encoding:** UTF-8 (soporta acentos y ñ)
- **Headers:** Primera fila obligatoria (case-sensitive)
- **Fechas:** YYYY-MM-DD (ISO 8601)
- **Decimales:** Punto (`.`) como separador
- **Strings vacíos:** Permitidos para campos opcionales (description)

---

### 2. Validation Schema (Zod)

```typescript
// src/lib/validations/invoice-import-schema.ts
import { z } from "zod";
import { INVOICE_STATUS } from "@/lib/constants/invoice-status-transitions";

/**
 * Schema para una fila individual del CSV
 *
 * Validaciones:
 * - company_tax_id: Requerido, se valida existencia server-side
 * - invoice_number: Requerido, se valida unicidad server-side
 * - amount: Número positivo, máximo 2 decimales
 * - currency: Enum (USD, MXN, EUR)
 * - issue_date: Formato YYYY-MM-DD
 * - due_date: Formato YYYY-MM-DD, >= issue_date
 * - description: Opcional, max 500 caracteres
 */
export const csvInvoiceRowSchema = z.object({
  company_tax_id: z
    .string({
      required_error: "Tax ID de empresa es requerido",
    })
    .min(1, "Tax ID de empresa es requerido")
    .max(50, "Tax ID no puede exceder 50 caracteres")
    .trim(),

  invoice_number: z
    .string({
      required_error: "Número de factura es requerido",
    })
    .min(1, "Número de factura es requerido")
    .max(100, "Número de factura no puede exceder 100 caracteres")
    .trim(),

  amount: z
    .number({
      required_error: "Monto es requerido",
      invalid_type_error: "Monto debe ser un número",
    })
    .positive("Monto debe ser mayor a 0")
    .multipleOf(0.01, "Monto solo puede tener hasta 2 decimales"),

  currency: z
    .enum(["USD", "MXN", "EUR"], {
      errorMap: () => ({ message: "Moneda no soportada. Use: USD, MXN, EUR" }),
    })
    .default("USD"),

  issue_date: z
    .string({
      required_error: "Fecha de emisión es requerida",
    })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Fecha de emisión debe estar en formato YYYY-MM-DD"
    )
    .transform((val) => new Date(val)),

  due_date: z
    .string({
      required_error: "Fecha de vencimiento es requerida",
    })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Fecha de vencimiento debe estar en formato YYYY-MM-DD"
    )
    .transform((val) => new Date(val)),

  description: z
    .string()
    .max(500, "Descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => data.due_date >= data.issue_date,
  {
    message: "Fecha de vencimiento debe ser >= fecha de emisión",
    path: ["due_date"],
  }
);

/**
 * Schema para el array completo de filas
 */
export const csvImportSchema = z.array(csvInvoiceRowSchema).max(1000, {
  message: "Máximo 1000 facturas por importación",
});

export type CSVInvoiceRow = z.infer<typeof csvInvoiceRowSchema>;
export type CSVImport = z.infer<typeof csvImportSchema>;

/**
 * Resultado de validación de una fila con información adicional
 */
export interface ValidatedRow {
  rowNumber: number; // 1-indexed (línea en CSV)
  data: CSVInvoiceRow | null;
  errors: string[];
  isValid: boolean;
}

/**
 * Valida un array de filas y retorna resultados detallados
 *
 * @param rows - Filas parseadas del CSV
 * @returns Array de ValidatedRow con errores por fila
 */
export function validateCSVRows(rows: any[]): ValidatedRow[] {
  const results: ValidatedRow[] = [];
  const seenInvoiceNumbers = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 porque index es 0-based y CSV tiene header en fila 1
    const errors: string[] = [];

    // Validar con Zod
    const validation = csvInvoiceRowSchema.safeParse(row);

    if (!validation.success) {
      const zodErrors = validation.error.flatten().fieldErrors;
      Object.entries(zodErrors).forEach(([field, messages]) => {
        if (messages) {
          errors.push(...messages);
        }
      });
    }

    // Validar unicidad de invoice_number dentro del CSV
    if (row.invoice_number) {
      if (seenInvoiceNumbers.has(row.invoice_number)) {
        errors.push(`Número de factura duplicado en el archivo`);
      } else {
        seenInvoiceNumbers.add(row.invoice_number);
      }
    }

    results.push({
      rowNumber,
      data: validation.success ? validation.data : null,
      errors,
      isValid: errors.length === 0 && validation.success,
    });
  });

  return results;
}
```

---

### 3. Service Layer

```typescript
// src/lib/services/invoice-service.ts (EXTEND existing file)
import { createClient } from "@/lib/db/supabase";
import type { CSVInvoiceRow } from "@/lib/validations/invoice-import-schema";

/**
 * Resultado de importación masiva
 */
interface BulkImportResult {
  success: boolean;
  importedCount?: number;
  errors?: Array<{
    rowNumber: number;
    message: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Valida server-side y retorna errores de negocio
 *
 * Validaciones:
 * 1. company_tax_id existe en tenant
 * 2. invoice_number único en tenant
 *
 * @param tenantId - ID del tenant
 * @param rows - Filas ya validadas por Zod
 * @returns Array de errores por fila
 */
async function validateBusinessRules(
  tenantId: string,
  rows: CSVInvoiceRow[]
): Promise<Array<{ rowNumber: number; errors: string[] }>> {
  const supabase = createClient();
  const results: Array<{ rowNumber: number; errors: string[] }> = [];

  // 1. Obtener todos los tax_ids únicos del CSV
  const taxIds = [...new Set(rows.map((r) => r.company_tax_id))];

  // 2. Lookup de companies en batch
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, tax_id")
    .eq("tenant_id", tenantId)
    .in("tax_id", taxIds);

  if (companiesError) {
    throw new Error("Error al validar empresas");
  }

  const taxIdToCompanyId = new Map(
    companies?.map((c) => [c.tax_id, c.id]) || []
  );

  // 3. Obtener todos los invoice_numbers ya existentes
  const invoiceNumbers = rows.map((r) => r.invoice_number);

  const { data: existingInvoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("tenant_id", tenantId)
    .in("invoice_number", invoiceNumbers);

  if (invoicesError) {
    throw new Error("Error al validar facturas existentes");
  }

  const existingInvoiceNumbers = new Set(
    existingInvoices?.map((i) => i.invoice_number) || []
  );

  // 4. Validar cada fila
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    // Validar company exists
    if (!taxIdToCompanyId.has(row.company_tax_id)) {
      errors.push(`Empresa con Tax ID '${row.company_tax_id}' no encontrada`);
    }

    // Validar invoice_number único
    if (existingInvoiceNumbers.has(row.invoice_number)) {
      errors.push(`Número de factura '${row.invoice_number}' ya existe`);
    }

    if (errors.length > 0) {
      results.push({ rowNumber, errors });
    }
  });

  return results;
}

/**
 * Importa facturas masivamente en una transacción
 *
 * Proceso:
 * 1. Re-valida reglas de negocio server-side
 * 2. Si todas válidas, inicia transacción
 * 3. Batch insert de todas las facturas
 * 4. Si falla, rollback automático
 *
 * @param tenantId - ID del tenant
 * @param rows - Filas validadas del CSV
 * @returns Resultado con count de importadas o errores
 *
 * @example
 * ```typescript
 * const result = await bulkImportInvoices(tenantId, validatedRows);
 * if (result.success) {
 *   console.log(`${result.importedCount} facturas importadas`);
 * }
 * ```
 */
export async function bulkImportInvoices(
  tenantId: string,
  rows: CSVInvoiceRow[]
): Promise<BulkImportResult> {
  const supabase = createClient();

  // 1. Validar reglas de negocio
  const businessErrors = await validateBusinessRules(tenantId, rows);

  if (businessErrors.length > 0) {
    return {
      success: false,
      errors: businessErrors.map((e) => ({
        rowNumber: e.rowNumber,
        message: e.errors.join(", "),
      })),
    };
  }

  // 2. Obtener mapping tax_id → company_id
  const taxIds = [...new Set(rows.map((r) => r.company_tax_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, tax_id")
    .eq("tenant_id", tenantId)
    .in("tax_id", taxIds);

  const taxIdToCompanyId = new Map(
    companies?.map((c) => [c.tax_id, c.id]) || []
  );

  // 3. Preparar datos para batch insert
  const invoicesToInsert = rows.map((row) => ({
    tenant_id: tenantId,
    company_id: taxIdToCompanyId.get(row.company_tax_id)!,
    invoice_number: row.invoice_number,
    amount: row.amount,
    currency: row.currency,
    issue_date: row.issue_date.toISOString().split("T")[0],
    due_date: row.due_date.toISOString().split("T")[0],
    description: row.description || null,
    payment_status: "pendiente",
    is_active: true,
  }));

  // 4. Batch insert (transaccional por defecto en Supabase)
  const { data: insertedInvoices, error: insertError } = await supabase
    .from("invoices")
    .insert(invoicesToInsert)
    .select("id");

  if (insertError) {
    console.error("Error in bulk import:", insertError);
    return {
      success: false,
      error: {
        code: "IMPORT_FAILED",
        message: "Error al importar facturas. Ninguna fue creada.",
      },
    };
  }

  return {
    success: true,
    importedCount: insertedInvoices.length,
  };
}
```

---

### 4. API Routes

```typescript
// src/app/api/invoices/import/route.ts (CREATE NEW)
import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import {
  csvImportSchema,
  validateCSVRows,
  type CSVInvoiceRow,
} from "@/lib/validations/invoice-import-schema";
import { bulkImportInvoices } from "@/lib/services/invoice-service";

/**
 * POST /api/invoices/import
 * Importa facturas masivamente desde CSV
 *
 * @security Requiere JWT válido con tenant_id
 * @body Array de CSVInvoiceRow (ya parseado en frontend)
 * @returns Resultado con count de importadas o errores
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener tenant_id del JWT
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Formato inválido: se esperaba array de filas" },
        { status: 400 }
      );
    }

    // 3. Convertir strings de fechas a Date objects
    const rowsWithDates = rows.map((row: any) => ({
      ...row,
      // No convertir aquí, el schema lo hace con transform
    }));

    // 4. Validar schema (límite 1000 filas)
    const schemaValidation = csvImportSchema.safeParse(rowsWithDates);
    if (!schemaValidation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: schemaValidation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 5. Re-validar filas (por si acaso)
    const validatedRows = validateCSVRows(rowsWithDates);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: "Hay filas con errores",
          invalidRows: invalidRows.map((r) => ({
            rowNumber: r.rowNumber,
            errors: r.errors,
          })),
        },
        { status: 400 }
      );
    }

    // 6. Importar
    const result = await bulkImportInvoices(
      tenantId,
      schemaValidation.data as CSVInvoiceRow[]
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error?.message || "Error al importar",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // 7. Retornar éxito
    return NextResponse.json(
      {
        message: `${result.importedCount} facturas importadas correctamente`,
        importedCount: result.importedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/invoices/import:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/import/template
 * Descarga template CSV con estructura y ejemplos
 */
export async function GET() {
  const csvContent = `company_tax_id,invoice_number,amount,currency,issue_date,due_date,description
RFC-ABC123,FAC-2025-001,1500.00,USD,2025-01-15,2025-02-15,Servicios de consultoría enero
TAX-XYZ789,INV-001,2750.50,MXN,2025-01-10,2025-02-10,Productos vendidos enero
RFC-DEF456,FAC-2025-002,800.00,USD,2025-01-20,2025-03-20,`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facturas_template.csv"',
    },
  });
}
```

---

### 5. Frontend Components

#### CSV Upload Zone Component

```typescript
// src/components/invoices/csv-upload-zone.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CSVUploadZoneProps {
  onFileProcessed: (rows: any[]) => void;
  maxRows?: number;
}

/**
 * Zona de upload con drag & drop para archivos CSV
 *
 * - Acepta solo .csv
 * - Parsea con papaparse
 * - Valida headers requeridos
 * - Límite configurable de filas
 */
export function CSVUploadZone({
  onFileProcessed,
  maxRows = 1000,
}: CSVUploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const REQUIRED_HEADERS = [
    "company_tax_id",
    "invoice_number",
    "amount",
    "currency",
    "issue_date",
    "due_date",
    "description",
  ];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];

      if (!file) {
        setError("No se seleccionó ningún archivo");
        return;
      }

      if (!file.name.endsWith(".csv")) {
        setError("Solo se permiten archivos .csv");
        return;
      }

      setIsProcessing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          setIsProcessing(false);

          // Validar headers
          const headers = results.meta.fields || [];
          const missingHeaders = REQUIRED_HEADERS.filter(
            (h) => !headers.includes(h)
          );

          if (missingHeaders.length > 0) {
            setError(
              `Headers faltantes: ${missingHeaders.join(", ")}. Descargue el template para ver la estructura correcta.`
            );
            return;
          }

          // Validar límite de filas
          if (results.data.length > maxRows) {
            setError(`Máximo ${maxRows} facturas por importación`);
            return;
          }

          if (results.data.length === 0) {
            setError("El archivo está vacío");
            return;
          }

          // Transformar datos
          const transformedRows = results.data.map((row: any) => ({
            company_tax_id: row.company_tax_id?.trim() || "",
            invoice_number: row.invoice_number?.trim() || "",
            amount: parseFloat(row.amount) || 0,
            currency: row.currency?.trim().toUpperCase() || "USD",
            issue_date: row.issue_date?.trim() || "",
            due_date: row.due_date?.trim() || "",
            description: row.description?.trim() || "",
          }));

          onFileProcessed(transformedRows);
        },
        error: (error) => {
          setIsProcessing(false);
          setError(`Error al procesar el archivo: ${error.message}`);
        },
      });
    },
    [onFileProcessed, maxRows]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <>
              <FileText className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-lg font-medium">Procesando archivo...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Suelte el archivo aquí"
                  : "Arrastre un archivo CSV o haga click para seleccionar"}
              </p>
              <p className="text-sm text-muted-foreground">
                Máximo {maxRows} facturas por archivo
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

#### CSV Preview Table Component

```typescript
// src/components/invoices/csv-preview-table.tsx
"use client";

import { CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ValidatedRow } from "@/lib/validations/invoice-import-schema";

interface CSVPreviewTableProps {
  validatedRows: ValidatedRow[];
  maxDisplay?: number;
}

/**
 * Tabla de preview de filas del CSV
 *
 * Muestra:
 * - Status (válida/error)
 * - Datos de cada columna
 * - Errores por fila
 */
export function CSVPreviewTable({
  validatedRows,
  maxDisplay = 50,
}: CSVPreviewTableProps) {
  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;

  const displayRows = validatedRows.slice(0, maxDisplay);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-green-700 border-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          {validCount} válidas
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="outline" className="text-red-700 border-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            {invalidCount} con errores
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          de {validatedRows.length} total
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Número</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => (
                <TableRow
                  key={row.rowNumber}
                  className={!row.isValid ? "bg-red-50" : ""}
                >
                  <TableCell className="font-mono text-xs">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.data?.company_tax_id || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.data?.invoice_number || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.data?.amount.toFixed(2) || "-"}
                  </TableCell>
                  <TableCell>{row.data?.currency || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {row.data?.issue_date
                      ? new Date(row.data.issue_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.data?.due_date
                      ? new Date(row.data.due_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {row.errors.length > 0 && (
                      <ul className="text-xs text-red-600 space-y-1">
                        {row.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {validatedRows.length > maxDisplay && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando primeras {maxDisplay} de {validatedRows.length} filas
        </p>
      )}
    </div>
  );
}
```

---

### 6. Page Component

```typescript
// src/app/(dashboard)/invoices/import/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { CSVUploadZone } from "@/components/invoices/csv-upload-zone";
import { CSVPreviewTable } from "@/components/invoices/csv-preview-table";
import {
  validateCSVRows,
  type ValidatedRow,
} from "@/lib/validations/invoice-import-schema";

/**
 * Página: Importar Facturas desde CSV
 *
 * Flujo:
 * 1. Descargar template (opcional)
 * 2. Subir CSV
 * 3. Ver preview con validaciones
 * 4. Confirmar importación
 * 5. Navegar a lista de facturas
 */
export default function ImportInvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [rawRows, setRawRows] = useState<any[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Handler cuando se procesa el CSV
  function handleFileProcessed(rows: any[]) {
    setRawRows(rows);
    const validated = validateCSVRows(rows);
    setValidatedRows(validated);
  }

  // Handler para confirmar importación
  async function handleConfirmImport() {
    setIsImporting(true);
    setShowConfirmDialog(false);

    try {
      const validRows = validatedRows
        .filter((r) => r.isValid)
        .map((r) => r.data);

      const response = await fetch("/api/invoices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al importar");
      }

      const result = await response.json();

      toast({
        title: "Importación exitosa",
        description: result.message,
      });

      router.push("/invoices");
    } catch (error: any) {
      toast({
        title: "Error en importación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const hasErrors = validatedRows.some((r) => !r.isValid);

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Facturas
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Importar Facturas</h1>
            <p className="text-muted-foreground mt-2">
              Cargue facturas masivamente desde un archivo CSV
            </p>
          </div>

          <Button variant="outline" asChild>
            <a href="/api/invoices/import/template" download>
              <Download className="mr-2 h-4 w-4" />
              Descargar Template
            </a>
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      {validatedRows.length === 0 && (
        <CSVUploadZone onFileProcessed={handleFileProcessed} />
      )}

      {/* Preview */}
      {validatedRows.length > 0 && (
        <div className="space-y-6">
          <CSVPreviewTable validatedRows={validatedRows} />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setRawRows([]);
                setValidatedRows([]);
              }}
            >
              Subir otro archivo
            </Button>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={hasErrors || isImporting}
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isImporting ? "Importando..." : `Importar ${validCount} Facturas`}
            </Button>
          </div>

          {hasErrors && (
            <p className="text-sm text-red-600 text-center">
              Corrija los errores antes de importar
            </p>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de importar {validCount} facturas?
              <br />
              <br />
              Esta acción creará todas las facturas en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Confirmar Importación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## 📦 Files to Create/Modify

### New Files (8 total)
```
src/
├── lib/
│   └── validations/
│       └── invoice-import-schema.ts (CREATE) ✨
├── app/
│   ├── api/
│   │   └── invoices/
│   │       └── import/
│   │           └── route.ts (CREATE) ✨
│   └── (dashboard)/
│       └── invoices/
│           └── import/
│               └── page.tsx (CREATE) ✨
└── components/
    └── invoices/
        ├── csv-upload-zone.tsx (CREATE) ✨
        └── csv-preview-table.tsx (CREATE) ✨

__tests__/
├── lib/
│   └── validations/
│       └── invoice-import-schema.test.ts (CREATE) ✨
└── api/
    └── invoices/
        └── import/
            └── route.test.ts (CREATE) ✨

public/
└── templates/
    └── facturas_template.csv (CREATE) ✨ (opcional)
```

### Modified Files (1)
```
src/lib/services/invoice-service.ts (EXTEND with bulk import) ✏️
```

### New Dependencies
```json
{
  "dependencies": {
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests - Validation
```typescript
// __tests__/lib/validations/invoice-import-schema.test.ts
import { describe, it, expect } from "vitest";
import { validateCSVRows } from "@/lib/validations/invoice-import-schema";

describe("CSV Import Validation", () => {
  it("validates correct rows", () => {
    const rows = [
      {
        company_tax_id: "RFC-123",
        invoice_number: "FAC-001",
        amount: 1500.00,
        currency: "USD",
        issue_date: "2025-01-15",
        due_date: "2025-02-15",
        description: "Test",
      },
    ];

    const result = validateCSVRows(rows);
    expect(result[0].isValid).toBe(true);
    expect(result[0].errors).toHaveLength(0);
  });

  it("detects duplicate invoice numbers in CSV", () => {
    const rows = [
      { invoice_number: "FAC-001", /* ... */ },
      { invoice_number: "FAC-001", /* ... */ },
    ];

    const result = validateCSVRows(rows);
    expect(result[1].errors).toContain("Número de factura duplicado en el archivo");
  });

  it("validates due_date >= issue_date", () => {
    const rows = [
      {
        issue_date: "2025-02-15",
        due_date: "2025-01-15",
        /* ... */
      },
    ];

    const result = validateCSVRows(rows);
    expect(result[0].isValid).toBe(false);
  });
});
```

---

## 🎯 Definition of Done

### Funcional
- [x] Usuario puede descargar template CSV
- [x] Usuario puede subir archivo CSV (drag & drop)
- [x] Preview muestra primeras 50 filas
- [x] Validación client-side con papaparse
- [x] Validación server-side de reglas de negocio
- [x] Lookup de company por tax_id funcional
- [x] Validación de invoice_number único
- [x] Validación de duplicados dentro del CSV
- [x] Importación transaccional (all-or-nothing)
- [x] Límite de 1000 filas por archivo

### Técnico
- [x] Zod schema con validaciones de formato
- [x] Service layer con bulk insert
- [x] API route con re-validación server-side
- [x] CSV parsing con papaparse
- [x] Components de upload y preview
- [x] Unit tests para validación
- [x] Integration tests para import

### Seguridad
- [x] RLS previene import cross-tenant
- [x] Validación de company ownership
- [x] File type validation (.csv only)
- [x] Size limits enforced

---

## 🚀 Implementation Steps

### Phase 1: Validation Schema (45 min)
1. Crear invoice-import-schema.ts
2. Implementar validateCSVRows()
3. Escribir unit tests

### Phase 2: Service Layer (60 min)
1. Implementar validateBusinessRules()
2. Implementar bulkImportInvoices()
3. Agregar transacción handling

### Phase 3: API Routes (30 min)
1. Crear POST /api/invoices/import
2. Crear GET /api/invoices/import/template
3. Escribir integration tests

### Phase 4: Frontend Components (120 min)
1. Instalar papaparse
2. Crear CSVUploadZone (drag & drop)
3. Crear CSVPreviewTable
4. Integrar validación client-side

### Phase 5: Page Integration (45 min)
1. Crear /invoices/import/page.tsx
2. Conectar upload → preview → import
3. Agregar confirm dialog

### Phase 6: Testing & Polish (60 min)
1. Test manual con archivos reales
2. Probar rollback con errores
3. Verificar performance con 500 filas
4. Ajustar UI/UX

**Total estimado:** 7-9 horas

---

## 📌 Notes

### Important Considerations
- **Client-side parsing:** Usa papaparse para performance (no enviar archivo al server)
- **Server-side re-validation:** SIEMPRE re-validar en server (no confiar en client)
- **Transactional:** Usar batch insert de Supabase (rollback automático)
- **Progress:** Considerar progress bar para > 100 filas
- **CSV Encoding:** UTF-8 para soportar acentos

### Future Enhancements (Not in this Story)
- Soporte para Excel (.xlsx) además de CSV
- Preview de 100% de filas (no solo primeras 50)
- Async processing con webhooks para > 1000 filas
- Auto-creación de companies si no existen (con flag)

---

**Última actualización:** 2025-12-02
**Estado:** ✅ Ready for Dev
**Estimación:** 7-9 horas
**Complejidad:** Alta
