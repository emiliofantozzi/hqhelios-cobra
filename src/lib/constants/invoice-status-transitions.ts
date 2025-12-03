/**
 * Invoice Status State Machine
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Define los estados válidos de factura y las transiciones permitidas.
 * Usado para validación tanto en frontend como backend.
 *
 * @module lib/constants/invoice-status-transitions
 */

/**
 * Estados válidos de factura
 */
export const INVOICE_STATUS = {
  PENDIENTE: 'pendiente',
  FECHA_CONFIRMADA: 'fecha_confirmada',
  PAGADA: 'pagada',
  ESCALADA: 'escalada',
  SUSPENDIDA: 'suspendida',
  CANCELADA: 'cancelada',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

/**
 * Transiciones permitidas desde cada estado
 *
 * Reglas de negocio:
 * - Desde PENDIENTE: puede ir a cualquier estado
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
 * Verifica si una transición de estado es válida
 *
 * @param currentStatus - Estado actual de la factura
 * @param newStatus - Estado destino
 * @returns true si la transición está permitida
 *
 * @example
 * ```ts
 * isTransitionAllowed('pendiente', 'pagada') // true
 * isTransitionAllowed('pagada', 'pendiente') // false
 * ```
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
 * Incluye etiquetas en español, colores e iconos
 */
export const STATUS_METADATA: Record<
  InvoiceStatus,
  {
    label: string;
    color: 'yellow' | 'blue' | 'green' | 'orange' | 'gray' | 'red';
    icon: 'Clock' | 'Calendar' | 'CheckCircle' | 'AlertTriangle' | 'Pause' | 'XCircle';
    description: string;
  }
> = {
  [INVOICE_STATUS.PENDIENTE]: {
    label: 'Pendiente',
    color: 'yellow',
    icon: 'Clock',
    description: 'Esperando pago',
  },
  [INVOICE_STATUS.FECHA_CONFIRMADA]: {
    label: 'Fecha Confirmada',
    color: 'blue',
    icon: 'Calendar',
    description: 'Cliente confirmó fecha de pago',
  },
  [INVOICE_STATUS.PAGADA]: {
    label: 'Pagada',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Pago recibido y confirmado',
  },
  [INVOICE_STATUS.ESCALADA]: {
    label: 'Escalada',
    color: 'orange',
    icon: 'AlertTriangle',
    description: 'Enviada a nivel superior',
  },
  [INVOICE_STATUS.SUSPENDIDA]: {
    label: 'Suspendida',
    color: 'gray',
    icon: 'Pause',
    description: 'Pausada temporalmente',
  },
  [INVOICE_STATUS.CANCELADA]: {
    label: 'Cancelada',
    color: 'red',
    icon: 'XCircle',
    description: 'Anulada',
  },
};

/**
 * Lista de todos los estados (útil para validaciones)
 */
export const ALL_INVOICE_STATUSES = Object.values(INVOICE_STATUS);

/**
 * Estados terminales (no permiten más transiciones)
 */
export const TERMINAL_STATUSES: InvoiceStatus[] = [
  INVOICE_STATUS.PAGADA,
  INVOICE_STATUS.CANCELADA,
];

/**
 * Verifica si un estado es terminal
 */
export function isTerminalStatus(status: InvoiceStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
