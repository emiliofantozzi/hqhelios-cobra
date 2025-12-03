# Story 2.6: Gestionar Estados de Facturas

**ID:** 2-6
**Epic:** Epic 2 - CRM y Gestión de Clientes
**Módulo:** Invoices (State Management)
**Prioridad:** Alta
**Estimación:** 6-8 horas
**Estado:** done
**Dependencias:** Story 2.5 (Crear Facturas)

---

## 📋 Descripción

### User Story
**Como** Miguel (Coordinador de Cobranzas),
**Quiero** actualizar el estado de las facturas según su progreso de pago,
**Para que** el sistema refleje la realidad del proceso de cobranzas.

### Contexto de Negocio
Esta story implementa el **núcleo del flujo de estados** de facturas, fundamental para:
- **Epic 3:** Motor de cobranzas usa estados para activar/pausar playbooks
- **Epic 4:** Comunicación multicanal se dispara según transiciones
- **Epic 5:** IA analiza historial de estados para sugerencias
- **Epic 6:** Dashboard KPIs dependen de estados precisos

El sistema de estados es **bidimensional**:
- **Estado primario:** payment_status (pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada)
- **Fechas asociadas:** confirmed_payment_date, paid_date
- **Referencias:** payment_reference (número de transferencia, etc.)

---

## ✅ Criterios de Aceptación

### AC1: Ver Estado Actual de Factura
**Scenario:** Badge de estado visible en detalle de factura
```gherkin
Given estoy en /invoices/[invoiceId]
When la página carga
Then veo Badge con estado actual de la factura:
  | Estado            | Color   | Icono      |
  | pendiente         | yellow  | Clock      |
  | fecha_confirmada  | blue    | Calendar   |
  | pagada            | green   | CheckCircle|
  | escalada          | orange  | AlertTriangle |
  | suspendida        | gray    | Pause      |
  | cancelada         | red     | XCircle    |
And el Badge muestra el estado en español
```

### AC2: Marcar como Pagada
**Scenario:** Transición pendiente/fecha_confirmada → pagada
```gherkin
Given estoy en detalle de factura con payment_status IN ('pendiente', 'fecha_confirmada')
When hago click en botón "Marcar como Pagada"
Then veo AlertDialog solicitando:
  | Campo            | Tipo | Requerido | Validación              |
  | paymentReference | text | sí        | min 1 caractere         |
  | paidDate         | date | sí        | >= issue_date, <= hoy   |
And paidDate está pre-llenado con fecha de hoy
```

**Scenario:** Confirmar pago actualiza factura
```gherkin
Given completé el dialog de pago con:
  | paymentReference | "TRANSF-123456" |
  | paidDate         | 2025-12-02      |
When hago click en "Confirmar"
Then invoice se actualiza:
  | Campo            | Valor Nuevo        |
  | payment_status   | 'pagada'           |
  | paid_date        | 2025-12-02         |
  | payment_reference| 'TRANSF-123456'    |
  | updated_at       | NOW()              |
And se crea registro en status_history
And veo mensaje "Factura marcada como pagada"
And el Badge se actualiza a estado "pagada" verde
```

### AC3: Confirmar Fecha de Pago
**Scenario:** Cliente promete fecha de pago
```gherkin
Given factura está en estado 'pendiente'
When hago click en "Confirmar Fecha de Pago"
Then veo Dialog con DatePicker para confirmed_payment_date
And puedo seleccionar fecha >= hoy
```

**Scenario:** Guardar fecha confirmada
```gherkin
Given seleccioné fecha 2025-12-15
When confirmo
Then invoice se actualiza:
  | Campo                 | Valor Nuevo    |
  | payment_status        | 'fecha_confirmada' |
  | confirmed_payment_date| 2025-12-15     |
And se crea registro en status_history
And veo Badge azul "Fecha Confirmada"
```

### AC4: Escalar Factura
**Scenario:** Enviar factura a nivel superior
```gherkin
Given factura está en estado IN ('pendiente', 'fecha_confirmada')
When hago click en "Escalar"
Then veo AlertDialog de confirmación:
  "¿Está seguro de escalar esta factura? Esto pausará la cobranza automática."
```

**Scenario:** Confirmar escalamiento
```gherkin
Given confirmé el escalamiento
When el dialog se cierra
Then invoice se actualiza:
  | Campo          | Valor Nuevo |
  | payment_status | 'escalada'  |
And se crea registro en status_history con note: "Escalada manualmente"
And si existe Collection activa, se pausa
And veo Badge naranja "Escalada"
```

### AC5: Suspender Factura
**Scenario:** Pausar temporalmente cobranza
```gherkin
Given factura está en estado IN ('pendiente', 'fecha_confirmada', 'escalada')
When hago click en "Suspender"
Then veo Dialog solicitando:
  | Campo  | Tipo     | Requerido |
  | reason | textarea | sí        |
And puedo ingresar motivo de suspensión
```

**Scenario:** Confirmar suspensión
```gherkin
Given ingresé reason: "Cliente en proceso de bancarrota"
When confirmo
Then invoice se actualiza:
  | Campo          | Valor Nuevo  |
  | payment_status | 'suspendida' |
And se crea registro en status_history con note = reason
And Collection activa se pausa
And veo Badge gris "Suspendida"
```

### AC6: Reactivar Factura Suspendida
**Scenario:** Volver a estado pendiente desde suspendida
```gherkin
Given factura está en estado 'suspendida'
When hago click en "Reactivar"
Then veo AlertDialog de confirmación
And al confirmar, payment_status = 'pendiente'
And se crea registro en status_history
And Collection se puede reanudar
```

### AC7: Cancelar Factura
**Scenario:** Anular factura permanentemente
```gherkin
Given factura está en cualquier estado excepto 'pagada'
When hago click en "Cancelar Factura"
Then veo AlertDialog con mensaje de advertencia:
  "Esta acción es irreversible. La factura quedará marcada como cancelada."
And debo ingresar reason obligatorio
```

**Scenario:** Confirmar cancelación
```gherkin
Given ingresé reason: "Factura emitida incorrectamente"
When confirmo
Then invoice se actualiza:
  | Campo          | Valor Nuevo |
  | payment_status | 'cancelada' |
And se crea registro en status_history con note = reason
And Collection activa se cancela permanentemente
And veo Badge rojo "Cancelada"
```

### AC8: Historial de Cambios de Estado
**Scenario:** Ver timeline de transiciones
```gherkin
Given estoy en detalle de factura
And la factura ha tenido cambios de estado
When veo la sección "Historial de Estados"
Then veo timeline con entradas:
  | Fecha/Hora        | Estado Anterior | Estado Nuevo    | Usuario        | Notas              |
  | 2025-12-01 10:00  | -               | pendiente       | Sistema        | Factura creada     |
  | 2025-12-05 14:30  | pendiente       | fecha_confirmada| Miguel         | Cliente confirmó   |
  | 2025-12-15 09:15  | fecha_confirmada| pagada          | Miguel         | Ref: TRANSF-123    |
And las entradas están ordenadas DESC (más reciente primero)
```

### AC9: Validaciones de Transiciones
**Scenario:** Transiciones no permitidas bloqueadas
```gherkin
Given factura está en estado 'pagada'
When intento cambiar a cualquier otro estado
Then NO veo botones de acción para transiciones
And veo mensaje informativo: "Factura ya pagada - no se permiten cambios"
```

**Scenario:** Cancelada solo si no está pagada
```gherkin
Given factura está en estado 'pagada'
When intento cancelar
Then NO veo botón "Cancelar Factura"
```

### AC10: Aislamiento por Tenant
**Scenario:** No puedo cambiar estado de factura de otro tenant
```gherkin
Given soy usuario del tenant "tenant-A"
When intento actualizar estado de factura de "tenant-B"
Then la operación falla con error 403
And no se crea registro en status_history
```

---

## 🛠️ Especificación Técnica

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer                                               │
├─────────────────────────────────────────────────────────────┤
│ /invoices/[id]/page.tsx                                     │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ InvoiceStatusBadge Component                    │         │
│ │ - Muestra estado actual con color/icono         │         │
│ └────────────────────────────────────────────────┘         │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ InvoiceActions Component                        │         │
│ │ - Botones de transición según estado actual     │         │
│ │ - MarkAsPaidDialog                              │         │
│ │ - ConfirmPaymentDateDialog                      │         │
│ │ - EscalateDialog, SuspendDialog, CancelDialog   │         │
│ └────────────────────────────────────────────────┘         │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ InvoiceStatusHistory Component                  │         │
│ │ - Timeline de cambios de estado                 │         │
│ │ - Muestra usuario, fecha, notas                 │         │
│ └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓ PATCH /api/invoices/[id]/status
┌─────────────────────────────────────────────────────────────┐
│ API Layer                                                    │
├─────────────────────────────────────────────────────────────┤
│ /api/invoices/[id]/status/route.ts (PATCH handler)          │
│ - Valida JWT con getTenantId()                              │
│ - Valida transición permitida                               │
│ - Llama invoice-service.updateInvoiceStatus()               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Service Layer                                                │
├─────────────────────────────────────────────────────────────┤
│ invoice-service.ts                                           │
│ - updateInvoiceStatus(invoiceId, tenantId, transition)      │
│   1. Valida estado actual                                    │
│   2. Valida transición permitida (state machine)             │
│   3. Actualiza invoice en transacción                        │
│   4. Crea registro en status_history                         │
│   5. Si aplica, llama collection-service (Epic 3)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Layer                                               │
├─────────────────────────────────────────────────────────────┤
│ invoices table                                               │
│ - UPDATE payment_status, paid_date, etc.                     │
│                                                              │
│ invoice_status_history table (NEW)                          │
│ - INSERT registro con old_status → new_status               │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Database Schema

#### Status History Table (Nueva)

```prisma
// prisma/schema.prisma - ADD this model
model InvoiceStatusHistory {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  invoiceId   String   @map("invoice_id") @db.Uuid
  oldStatus   String?  @map("old_status") @db.VarChar(50)
  newStatus   String   @map("new_status") @db.VarChar(50)
  changedBy   String   @map("changed_by") @db.Uuid // User ID de Clerk
  changedAt   DateTime @default(now()) @map("changed_at") @db.Timestamptz(6)
  note        String?  @db.Text
  metadata    Json?    @db.JsonB // Para datos adicionales (payment_reference, etc.)

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId, changedAt], name: "invoice_status_history_invoice_id_changed_at_idx")
  @@index([tenantId], name: "invoice_status_history_tenant_id_idx")
  @@map("invoice_status_history")
}

// MODIFY Invoice model to add relation
model Invoice {
  // ... existing fields ...

  statusHistory InvoiceStatusHistory[]

  // ... existing relations ...
}
```

#### Migration SQL

```sql
-- Migration: create_invoice_status_history_table
-- Ejecutar después de Story 2.5

CREATE TABLE invoice_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL, -- Clerk User ID
  changed_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  note TEXT,
  metadata JSONB,

  CONSTRAINT invoice_status_history_new_status_check CHECK (
    new_status IN ('pendiente', 'fecha_confirmada', 'pagada', 'escalada', 'suspendida', 'cancelada')
  ),
  CONSTRAINT invoice_status_history_old_status_check CHECK (
    old_status IS NULL OR old_status IN ('pendiente', 'fecha_confirmada', 'pagada', 'escalada', 'suspendida', 'cancelada')
  )
);

-- Índices para performance
CREATE INDEX invoice_status_history_invoice_id_changed_at_idx
  ON invoice_status_history(invoice_id, changed_at DESC);
CREATE INDEX invoice_status_history_tenant_id_idx
  ON invoice_status_history(tenant_id);

-- Comentarios
COMMENT ON TABLE invoice_status_history IS 'Historial de cambios de estado de facturas';
COMMENT ON COLUMN invoice_status_history.old_status IS 'Estado anterior (NULL en creación)';
COMMENT ON COLUMN invoice_status_history.changed_by IS 'User ID de Clerk que hizo el cambio';
COMMENT ON COLUMN invoice_status_history.metadata IS 'Datos adicionales (payment_reference, confirmed_payment_date, etc.)';
```

---

### 2. Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Solo ver historial de mi tenant
CREATE POLICY "invoice_status_history_select_own_tenant"
ON invoice_status_history
FOR SELECT
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: INSERT - Solo crear registros en mi tenant
CREATE POLICY "invoice_status_history_insert_own_tenant"
ON invoice_status_history
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: NO UPDATE - Los registros de historial son inmutables
-- Policy: NO DELETE - Los registros de historial son permanentes
```

**⚠️ Security Notes:**
- Status history es **append-only** (solo INSERT, no UPDATE/DELETE)
- RLS previene ver historial cross-tenant
- changed_by viene del JWT userId, no del body

---

### 3. State Machine (Transiciones Permitidas)

#### Diagrama de Estados

```
                         ┌──────────────┐
                         │  PENDIENTE   │ ◄───┐
                         └──────┬───────┘     │
                                │              │
                    ┌───────────┼───────────┐  │
                    │           │           │  │
                    ▼           ▼           ▼  │
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ ESCALADA │  │  FECHA   │  │SUSPENDIDA│
            │          │  │CONFIRMADA│  │          │
            └────┬─────┘  └────┬─────┘  └────┬─────┘
                 │             │             │
                 │      ┌──────┴──────┐      │
                 │      │             │      │
                 └──────►   PAGADA    ◄──────┘
                        │             │
                        └─────────────┘

              CANCELADA puede venir desde cualquier estado
              excepto PAGADA (líneas no mostradas por claridad)
```

#### Matriz de Transiciones

```typescript
// src/lib/constants/invoice-status-transitions.ts

/**
 * Estados válidos de factura
 */
export const INVOICE_STATUS = {
  PENDIENTE: "pendiente",
  FECHA_CONFIRMADA: "fecha_confirmada",
  PAGADA: "pagada",
  ESCALADA: "escalada",
  SUSPENDIDA: "suspendida",
  CANCELADA: "cancelada",
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

/**
 * Transiciones permitidas desde cada estado
 *
 * Reglas de negocio:
 * - Desde PENDIENTE: puede ir a cualquier estado excepto cancelada (requiere reason)
 * - Desde FECHA_CONFIRMADA: puede ir a pagada, escalada, suspendida, cancelada
 * - Desde ESCALADA: puede ir a pendiente (reactivar), pagada, suspendida, cancelada
 * - Desde SUSPENDIDA: puede ir a pendiente (reactivar), cancelada
 * - Desde PAGADA: NO puede cambiar (estado terminal)
 * - Desde CANCELADA: NO puede cambiar (estado terminal)
 */
export const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [INVOICE_STATUS.PENDIENTE]: [
    INVOICE_STATUS.FECHA_CONFIRMADA,
    INVOICE_STATUS.PAGADA,
    INVOICE_STATUS.ESCALADA,
    INVOICE_STATUS.SUSPENDIDA,
    INVOICE_STATUS.CANCELADA,
  ],
  [INVOICE_STATUS.FECHA_CONFIRMADA]: [
    INVOICE_STATUS.PAGADA,
    INVOICE_STATUS.ESCALADA,
    INVOICE_STATUS.SUSPENDIDA,
    INVOICE_STATUS.CANCELADA,
  ],
  [INVOICE_STATUS.ESCALADA]: [
    INVOICE_STATUS.PENDIENTE, // Reactivar
    INVOICE_STATUS.PAGADA,
    INVOICE_STATUS.SUSPENDIDA,
    INVOICE_STATUS.CANCELADA,
  ],
  [INVOICE_STATUS.SUSPENDIDA]: [
    INVOICE_STATUS.PENDIENTE, // Reactivar
    INVOICE_STATUS.CANCELADA,
  ],
  [INVOICE_STATUS.PAGADA]: [], // Estado terminal
  [INVOICE_STATUS.CANCELADA]: [], // Estado terminal
};

/**
 * Verifica si una transición es válida
 */
export function isTransitionAllowed(
  currentStatus: InvoiceStatus,
  newStatus: InvoiceStatus
): boolean {
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowedTargets.includes(newStatus);
}

/**
 * Metadata de estados para UI
 */
export const STATUS_METADATA = {
  [INVOICE_STATUS.PENDIENTE]: {
    label: "Pendiente",
    color: "yellow",
    icon: "Clock",
    description: "Esperando pago",
  },
  [INVOICE_STATUS.FECHA_CONFIRMADA]: {
    label: "Fecha Confirmada",
    color: "blue",
    icon: "Calendar",
    description: "Cliente confirmó fecha de pago",
  },
  [INVOICE_STATUS.PAGADA]: {
    label: "Pagada",
    color: "green",
    icon: "CheckCircle",
    description: "Pago recibido y confirmado",
  },
  [INVOICE_STATUS.ESCALADA]: {
    label: "Escalada",
    color: "orange",
    icon: "AlertTriangle",
    description: "Enviada a nivel superior",
  },
  [INVOICE_STATUS.SUSPENDIDA]: {
    label: "Suspendida",
    color: "gray",
    icon: "Pause",
    description: "Pausada temporalmente",
  },
  [INVOICE_STATUS.CANCELADA]: {
    label: "Cancelada",
    color: "red",
    icon: "XCircle",
    description: "Anulada",
  },
} as const;
```

---

### 4. Validation Schema (Zod)

```typescript
// src/lib/validations/invoice-status-schema.ts
import { z } from "zod";
import { INVOICE_STATUS } from "@/lib/constants/invoice-status-transitions";

/**
 * Schema base para transición de estado
 */
const baseStatusTransitionSchema = z.object({
  newStatus: z.enum([
    INVOICE_STATUS.PENDIENTE,
    INVOICE_STATUS.FECHA_CONFIRMADA,
    INVOICE_STATUS.PAGADA,
    INVOICE_STATUS.ESCALADA,
    INVOICE_STATUS.SUSPENDIDA,
    INVOICE_STATUS.CANCELADA,
  ]),
  note: z.string().max(1000, "La nota no puede exceder 1000 caracteres").optional(),
});

/**
 * Schema para marcar como pagada
 * Requiere: payment_reference y paid_date
 */
export const markAsPaidSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.PAGADA),
  paymentReference: z
    .string({
      required_error: "La referencia de pago es requerida",
    })
    .min(1, "La referencia de pago es requerida")
    .max(255, "La referencia no puede exceder 255 caracteres"),
  paidDate: z
    .date({
      required_error: "La fecha de pago es requerida",
    })
    .max(new Date(), "La fecha de pago no puede ser futura"),
});

/**
 * Schema para confirmar fecha de pago
 * Requiere: confirmed_payment_date
 */
export const confirmPaymentDateSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.FECHA_CONFIRMADA),
  confirmedPaymentDate: z
    .date({
      required_error: "La fecha confirmada es requerida",
    })
    .min(new Date(), "La fecha confirmada debe ser hoy o futura"),
});

/**
 * Schema para escalar factura
 * Solo cambia estado, note es opcional
 */
export const escalateInvoiceSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.ESCALADA),
});

/**
 * Schema para suspender factura
 * Requiere: note (motivo de suspensión)
 */
export const suspendInvoiceSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.SUSPENDIDA),
  note: z
    .string({
      required_error: "El motivo de suspensión es requerido",
    })
    .min(1, "El motivo de suspensión es requerido")
    .max(1000, "El motivo no puede exceder 1000 caracteres"),
});

/**
 * Schema para cancelar factura
 * Requiere: note (motivo de cancelación)
 */
export const cancelInvoiceSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.CANCELADA),
  note: z
    .string({
      required_error: "El motivo de cancelación es requerido",
    })
    .min(1, "El motivo de cancelación es requerido")
    .max(1000, "El motivo no puede exceder 1000 caracteres"),
});

/**
 * Schema para reactivar factura (suspendida/escalada → pendiente)
 */
export const reactivateInvoiceSchema = baseStatusTransitionSchema.extend({
  newStatus: z.literal(INVOICE_STATUS.PENDIENTE),
});

/**
 * Union type para todos los esquemas de transición
 */
export const invoiceStatusTransitionSchema = z.discriminatedUnion("newStatus", [
  markAsPaidSchema,
  confirmPaymentDateSchema,
  escalateInvoiceSchema,
  suspendInvoiceSchema,
  cancelInvoiceSchema,
  reactivateInvoiceSchema,
]);

export type InvoiceStatusTransition = z.infer<typeof invoiceStatusTransitionSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
export type ConfirmPaymentDateInput = z.infer<typeof confirmPaymentDateSchema>;
export type SuspendInvoiceInput = z.infer<typeof suspendInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
```

---

### 5. Service Layer

```typescript
// src/lib/services/invoice-service.ts (EXTEND existing file)
import { createClient } from "@/lib/db/supabase";
import {
  INVOICE_STATUS,
  isTransitionAllowed,
  type InvoiceStatus,
} from "@/lib/constants/invoice-status-transitions";
import type { InvoiceStatusTransition } from "@/lib/validations/invoice-status-schema";

/**
 * Resultado de actualización de estado
 */
interface UpdateStatusResult {
  success: boolean;
  invoice?: {
    id: string;
    paymentStatus: InvoiceStatus;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Actualiza el estado de una factura con validaciones de state machine
 *
 * Flujo:
 * 1. Verifica que factura existe y pertenece al tenant
 * 2. Valida transición permitida según state machine
 * 3. Actualiza invoice en transacción
 * 4. Crea registro en status_history
 * 5. Retorna resultado
 *
 * @param invoiceId - ID de la factura
 * @param tenantId - ID del tenant (del JWT)
 * @param userId - ID del usuario (Clerk User ID)
 * @param transition - Datos de la transición
 * @returns Resultado con factura actualizada o error
 *
 * @example
 * ```typescript
 * const result = await updateInvoiceStatus(
 *   invoiceId,
 *   tenantId,
 *   userId,
 *   {
 *     newStatus: "pagada",
 *     paymentReference: "TRANSF-123",
 *     paidDate: new Date(),
 *   }
 * );
 * ```
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  tenantId: string,
  userId: string,
  transition: InvoiceStatusTransition
): Promise<UpdateStatusResult> {
  const supabase = createClient();

  // 1. Obtener factura actual
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, payment_status, issue_date")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !invoice) {
    return {
      success: false,
      error: {
        code: "INVOICE_NOT_FOUND",
        message: "Factura no encontrada",
      },
    };
  }

  const currentStatus = invoice.payment_status as InvoiceStatus;

  // 2. Validar transición permitida
  if (!isTransitionAllowed(currentStatus, transition.newStatus)) {
    return {
      success: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `No se puede cambiar de "${currentStatus}" a "${transition.newStatus}"`,
      },
    };
  }

  // 3. Preparar datos de actualización según tipo de transición
  const updateData: Record<string, any> = {
    payment_status: transition.newStatus,
    updated_at: new Date().toISOString(),
  };

  const metadata: Record<string, any> = {};

  // Agregar campos específicos según transición
  if (transition.newStatus === INVOICE_STATUS.PAGADA && "paymentReference" in transition) {
    updateData.payment_reference = transition.paymentReference;
    updateData.paid_date = transition.paidDate.toISOString().split("T")[0];
    metadata.payment_reference = transition.paymentReference;
    metadata.paid_date = transition.paidDate.toISOString().split("T")[0];
  }

  if (
    transition.newStatus === INVOICE_STATUS.FECHA_CONFIRMADA &&
    "confirmedPaymentDate" in transition
  ) {
    updateData.confirmed_payment_date = transition.confirmedPaymentDate
      .toISOString()
      .split("T")[0];
    metadata.confirmed_payment_date = transition.confirmedPaymentDate
      .toISOString()
      .split("T")[0];
  }

  // 4. Ejecutar transacción (UPDATE invoice + INSERT history)
  try {
    // Update invoice
    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      return {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: "Error al actualizar la factura",
        },
      };
    }

    // Insert status history
    const { error: historyError } = await supabase
      .from("invoice_status_history")
      .insert({
        tenant_id: tenantId,
        invoice_id: invoiceId,
        old_status: currentStatus,
        new_status: transition.newStatus,
        changed_by: userId,
        note: transition.note || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      });

    if (historyError) {
      console.error("Error creating status history:", historyError);
      // No falla la operación si falla el historial, pero se logea
    }

    return {
      success: true,
      invoice: {
        id: invoiceId,
        paymentStatus: transition.newStatus,
      },
    };
  } catch (error) {
    console.error("Unexpected error in updateInvoiceStatus:", error);
    return {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Error al procesar la transacción",
      },
    };
  }
}

/**
 * Obtiene el historial de cambios de estado de una factura
 *
 * @param invoiceId - ID de la factura
 * @param tenantId - ID del tenant
 * @returns Array de registros de historial ordenados DESC
 */
export async function getInvoiceStatusHistory(
  invoiceId: string,
  tenantId: string
) {
  const supabase = createClient();

  const { data: history, error } = await supabase
    .from("invoice_status_history")
    .select(
      `
      id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      note,
      metadata
    `
    )
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", tenantId)
    .order("changed_at", { ascending: false });

  if (error) {
    console.error("Error fetching status history:", error);
    return [];
  }

  return history;
}
```

---

### 6. API Routes

```typescript
// src/app/api/invoices/[invoiceId]/status/route.ts (CREATE NEW)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTenantId } from "@/lib/auth/get-tenant-id";
import { invoiceStatusTransitionSchema } from "@/lib/validations/invoice-status-schema";
import { updateInvoiceStatus } from "@/lib/services/invoice-service";

interface RouteParams {
  params: {
    invoiceId: string;
  };
}

/**
 * PATCH /api/invoices/[invoiceId]/status
 * Actualiza el estado de una factura
 *
 * @security Requiere JWT válido con tenant_id
 * @body InvoiceStatusTransition (validado con Zod discriminated union)
 * @returns Factura actualizada o error
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Obtener tenant_id y user_id del JWT
    const tenantId = await getTenantId();
    const { userId } = await auth();

    if (!tenantId || !userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Parse y validar body
    const body = await request.json();

    // Convertir strings ISO a Date objects si vienen del cliente
    if (body.paidDate && typeof body.paidDate === "string") {
      body.paidDate = new Date(body.paidDate);
    }
    if (body.confirmedPaymentDate && typeof body.confirmedPaymentDate === "string") {
      body.confirmedPaymentDate = new Date(body.confirmedPaymentDate);
    }

    const validationResult = invoiceStatusTransitionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Actualizar estado
    const result = await updateInvoiceStatus(
      params.invoiceId,
      tenantId,
      userId,
      validationResult.data
    );

    if (!result.success) {
      const statusCode = result.error?.code === "INVALID_TRANSITION" ? 422 : 400;
      return NextResponse.json({ error: result.error?.message }, { status: statusCode });
    }

    // 4. Retornar factura actualizada
    return NextResponse.json(result.invoice, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/invoices/[id]/status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

---

### 7. Frontend Components

#### InvoiceStatusBadge Component

```typescript
// src/components/invoices/invoice-status-badge.tsx
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pause,
  XCircle,
} from "lucide-react";
import { STATUS_METADATA, type InvoiceStatus } from "@/lib/constants/invoice-status-transitions";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const ICON_MAP = {
  Clock: Clock,
  Calendar: Calendar,
  CheckCircle: CheckCircle,
  AlertTriangle: AlertTriangle,
  Pause: Pause,
  XCircle: XCircle,
};

/**
 * Badge de estado de factura con color e icono
 */
export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const metadata = STATUS_METADATA[status];
  const Icon = ICON_MAP[metadata.icon as keyof typeof ICON_MAP];

  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    red: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <Badge
      variant="outline"
      className={`${colorClasses[metadata.color]} ${className || ""}`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {metadata.label}
    </Badge>
  );
}
```

#### InvoiceActions Component

```typescript
// src/components/invoices/invoice-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  AlertTriangle,
  Pause,
  XCircle,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { INVOICE_STATUS, ALLOWED_TRANSITIONS } from "@/lib/constants/invoice-status-transitions";
import { MarkAsPaidDialog } from "./mark-as-paid-dialog";
import { ConfirmPaymentDateDialog } from "./confirm-payment-date-dialog";
import { EscalateDialog } from "./escalate-dialog";
import { SuspendDialog } from "./suspend-dialog";
import { CancelDialog } from "./cancel-dialog";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: string;
  issueDate: Date;
}

/**
 * Botones de acciones de estado según estado actual
 * Renderiza solo transiciones permitidas por state machine
 */
export function InvoiceActions({
  invoiceId,
  currentStatus,
  issueDate,
}: InvoiceActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showMarkAsPaid, setShowMarkAsPaid] = useState(false);
  const [showConfirmDate, setShowConfirmDate] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus as keyof typeof ALLOWED_TRANSITIONS] || [];

  // Si está pagada o cancelada, no mostrar acciones
  if (
    currentStatus === INVOICE_STATUS.PAGADA ||
    currentStatus === INVOICE_STATUS.CANCELADA
  ) {
    return (
      <div className="text-sm text-muted-foreground">
        No se permiten cambios de estado para facturas {currentStatus === INVOICE_STATUS.PAGADA ? "pagadas" : "canceladas"}
      </div>
    );
  }

  // Handler para reactivar
  async function handleReactivate() {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: INVOICE_STATUS.PENDIENTE,
          note: "Factura reactivada",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate");
      }

      toast({
        title: "Factura reactivada",
        description: "La factura volvió a estado pendiente",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reactivar la factura",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Cambiar Estado</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {allowedTransitions.includes(INVOICE_STATUS.PAGADA) && (
            <DropdownMenuItem onClick={() => setShowMarkAsPaid(true)}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Marcar como Pagada
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.FECHA_CONFIRMADA) && (
            <DropdownMenuItem onClick={() => setShowConfirmDate(true)}>
              <Calendar className="mr-2 h-4 w-4 text-blue-600" />
              Confirmar Fecha de Pago
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.ESCALADA) && (
            <DropdownMenuItem onClick={() => setShowEscalate(true)}>
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
              Escalar Factura
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.SUSPENDIDA) && (
            <DropdownMenuItem onClick={() => setShowSuspend(true)}>
              <Pause className="mr-2 h-4 w-4 text-gray-600" />
              Suspender
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.PENDIENTE) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReactivate}>
                <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                Reactivar
              </DropdownMenuItem>
            </>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.CANCELADA) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCancel(true)}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Factura
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <MarkAsPaidDialog
        open={showMarkAsPaid}
        onOpenChange={setShowMarkAsPaid}
        invoiceId={invoiceId}
        issueDate={issueDate}
      />
      <ConfirmPaymentDateDialog
        open={showConfirmDate}
        onOpenChange={setShowConfirmDate}
        invoiceId={invoiceId}
      />
      <EscalateDialog
        open={showEscalate}
        onOpenChange={setShowEscalate}
        invoiceId={invoiceId}
      />
      <SuspendDialog
        open={showSuspend}
        onOpenChange={setShowSuspend}
        invoiceId={invoiceId}
      />
      <CancelDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        invoiceId={invoiceId}
      />
    </>
  );
}
```

#### MarkAsPaidDialog Component

```typescript
// src/components/invoices/mark-as-paid-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  markAsPaidSchema,
  type MarkAsPaidInput,
} from "@/lib/validations/invoice-status-schema";

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  issueDate: Date;
}

export function MarkAsPaidDialog({
  open,
  onOpenChange,
  invoiceId,
  issueDate,
}: MarkAsPaidDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MarkAsPaidInput>({
    resolver: zodResolver(markAsPaidSchema),
    defaultValues: {
      newStatus: "pagada",
      paymentReference: "",
      paidDate: new Date(),
    },
  });

  async function onSubmit(data: MarkAsPaidInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          paidDate: data.paidDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al marcar como pagada");
      }

      toast({
        title: "Factura marcada como pagada",
        description: `Referencia: ${data.paymentReference}`,
      });

      onOpenChange(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como Pagada</AlertDialogTitle>
          <AlertDialogDescription>
            Ingrese los detalles del pago recibido
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paymentReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de Pago *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="TRANSF-123456"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Pago *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? format(field.value, "PPP") : "Seleccione fecha"}
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
                          date > new Date() || date < issueDate
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : "Confirmar Pago"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**(Nota: Los demás dialogs siguen el mismo patrón, omitidos por brevedad - ver sección "Files to Create" para lista completa)**

---

## 📦 Files to Create/Modify

### New Files (14 total)
```
src/
├── lib/
│   ├── constants/
│   │   └── invoice-status-transitions.ts (CREATE) ✨
│   ├── validations/
│   │   └── invoice-status-schema.ts (CREATE) ✨
│   └── services/
│       └── invoice-service.ts (EXTEND with status methods) ✏️
├── app/
│   └── api/
│       └── invoices/
│           └── [invoiceId]/
│               └── status/
│                   └── route.ts (CREATE) ✨
└── components/
    └── invoices/
        ├── invoice-status-badge.tsx (CREATE) ✨
        ├── invoice-actions.tsx (CREATE) ✨
        ├── mark-as-paid-dialog.tsx (CREATE) ✨
        ├── confirm-payment-date-dialog.tsx (CREATE) ✨
        ├── escalate-dialog.tsx (CREATE) ✨
        ├── suspend-dialog.tsx (CREATE) ✨
        ├── cancel-dialog.tsx (CREATE) ✨
        └── invoice-status-history.tsx (CREATE) ✨

migrations/
└── [timestamp]_create_invoice_status_history.sql (CREATE) ✨

__tests__/
├── lib/
│   └── constants/
│       └── invoice-status-transitions.test.ts (CREATE) ✨
└── api/
    └── invoices/
        └── [id]/
            └── status/
                └── route.test.ts (CREATE) ✨
```

### Modified Files
```
prisma/
└── schema.prisma (ADD InvoiceStatusHistory model, EXTEND Invoice) ✏️
```

---

## 🧪 Testing Strategy

### Unit Tests - State Machine
```typescript
// __tests__/lib/constants/invoice-status-transitions.test.ts
import { describe, it, expect } from "vitest";
import { isTransitionAllowed, INVOICE_STATUS } from "@/lib/constants/invoice-status-transitions";

describe("Invoice Status State Machine", () => {
  it("allows pendiente → pagada", () => {
    expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.PAGADA)).toBe(true);
  });

  it("disallows pagada → pendiente", () => {
    expect(isTransitionAllowed(INVOICE_STATUS.PAGADA, INVOICE_STATUS.PENDIENTE)).toBe(false);
  });

  it("allows suspendida → pendiente (reactivate)", () => {
    expect(isTransitionAllowed(INVOICE_STATUS.SUSPENDIDA, INVOICE_STATUS.PENDIENTE)).toBe(true);
  });

  it("disallows cancelada → any", () => {
    expect(isTransitionAllowed(INVOICE_STATUS.CANCELADA, INVOICE_STATUS.PENDIENTE)).toBe(false);
    expect(isTransitionAllowed(INVOICE_STATUS.CANCELADA, INVOICE_STATUS.PAGADA)).toBe(false);
  });
});
```

---

## 🎯 Definition of Done

### Funcional
- [x] Usuario puede marcar factura como pagada con referencia
- [x] Usuario puede confirmar fecha de pago prometida
- [x] Usuario puede escalar factura
- [x] Usuario puede suspender factura con motivo
- [x] Usuario puede cancelar factura con motivo
- [x] Usuario puede reactivar factura suspendida
- [x] Status badge muestra estado actual con color/icono
- [x] Historial de cambios visible en detalle de factura
- [x] Validaciones de state machine funcionando

### Técnico
- [x] Migration SQL con status_history table
- [x] RLS policies configuradas (append-only)
- [x] State machine implementado con ALLOWED_TRANSITIONS
- [x] Zod discriminated union para validaciones
- [x] Service layer con transacciones
- [x] API route con validación de transiciones
- [x] 6+ components de dialogs para transiciones
- [x] Unit tests para state machine
- [x] Integration tests para API

### Seguridad
- [x] RLS previene acceso cross-tenant
- [x] Status history es append-only (no UPDATE/DELETE)
- [x] changed_by proviene del JWT userId
- [x] Validación de transiciones server-side

---

## 🚀 Implementation Steps

### Phase 1: Database & State Machine (60 min)
1. Crear tabla invoice_status_history + migration
2. Configurar RLS policies (append-only)
3. Crear constantes de state machine
4. Escribir tests de state machine

### Phase 2: Validation & Service (90 min)
1. Crear schemas Zod (discriminated union)
2. Extender invoice-service con updateInvoiceStatus()
3. Implementar getInvoiceStatusHistory()
4. Agregar tests de servicio

### Phase 3: API Route (30 min)
1. Crear PATCH /api/invoices/[id]/status
2. Integrar validación de transiciones
3. Escribir integration tests

### Phase 4: UI Components (120 min)
1. Crear InvoiceStatusBadge
2. Crear InvoiceActions (dropdown menu)
3. Crear 6 dialogs (MarkAsPaid, ConfirmDate, Escalate, Suspend, Cancel, Reactivate)
4. Crear InvoiceStatusHistory timeline

### Phase 5: Integration & Polish (60 min)
1. Integrar components en invoice detail page
2. Test manual de todas las transiciones
3. Verificar RLS con diferentes users
4. Ajustar UI/UX

**Total estimado:** 6-8 horas

---

## 📌 Notes

### Important Considerations
- **State Machine:** ALWAYS validar transiciones server-side
- **History Immutability:** Tabla append-only (no UPDATE/DELETE)
- **Terminal States:** PAGADA y CANCELADA no permiten cambios
- **Metadata JSONB:** Usar para almacenar datos adicionales (payment_reference, etc.)
- **Collection Integration:** Story prepara hooks para Epic 3 (pausar/cancelar collections)

### Future Enhancements (Not in this Story)
- Auto-escalamiento después de X días vencidos (Epic 3)
- Notificaciones push on state change (Epic 6)
- Audit log avanzado con diffs (Epic 6)

---

**Última actualización:** 2025-12-02
**Estado:** ✅ Ready for Dev
**Estimación:** 6-8 horas
**Complejidad:** Alta
