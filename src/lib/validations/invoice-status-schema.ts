/**
 * Zod Schemas para transiciones de estado de facturas
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Usa discriminatedUnion para validar diferentes campos según newStatus.
 *
 * @module lib/validations/invoice-status-schema
 */
import { z } from 'zod';
import { INVOICE_STATUS } from '@/lib/constants/invoice-status-transitions';

/**
 * Schema para marcar como pagada
 * Requiere: paymentReference y paidDate
 */
export const markAsPaidSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.PAGADA),
  paymentReference: z
    .string({
      required_error: 'La referencia de pago es requerida',
    })
    .min(1, 'La referencia de pago es requerida')
    .max(255, 'La referencia no puede exceder 255 caracteres'),
  paidDate: z.coerce
    .date({
      required_error: 'La fecha de pago es requerida',
    })
    .refine((date) => date <= new Date(), {
      message: 'La fecha de pago no puede ser futura',
    }),
  note: z.string().max(1000, 'La nota no puede exceder 1000 caracteres').optional(),
});

/**
 * Schema para confirmar fecha de pago
 * Requiere: confirmedPaymentDate (debe ser hoy o futura)
 */
export const confirmPaymentDateSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.FECHA_CONFIRMADA),
  confirmedPaymentDate: z.coerce
    .date({
      required_error: 'La fecha confirmada es requerida',
    })
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      {
        message: 'La fecha confirmada debe ser hoy o futura',
      }
    ),
  note: z.string().max(1000, 'La nota no puede exceder 1000 caracteres').optional(),
});

/**
 * Schema para escalar factura
 * Solo cambia estado, note es opcional
 */
export const escalateInvoiceSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.ESCALADA),
  note: z.string().max(1000, 'La nota no puede exceder 1000 caracteres').optional(),
});

/**
 * Schema para suspender factura
 * Requiere: note (motivo de suspensión)
 */
export const suspendInvoiceSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.SUSPENDIDA),
  note: z
    .string({
      required_error: 'El motivo de suspensión es requerido',
    })
    .min(1, 'El motivo de suspensión es requerido')
    .max(1000, 'El motivo no puede exceder 1000 caracteres'),
});

/**
 * Schema para cancelar factura
 * Requiere: note (motivo de cancelación)
 */
export const cancelInvoiceSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.CANCELADA),
  note: z
    .string({
      required_error: 'El motivo de cancelación es requerido',
    })
    .min(1, 'El motivo de cancelación es requerido')
    .max(1000, 'El motivo no puede exceder 1000 caracteres'),
});

/**
 * Schema para reactivar factura (suspendida/escalada → pendiente)
 */
export const reactivateInvoiceSchema = z.object({
  newStatus: z.literal(INVOICE_STATUS.PENDIENTE),
  note: z.string().max(1000, 'La nota no puede exceder 1000 caracteres').optional(),
});

/**
 * Union discriminada para todas las transiciones de estado
 * El discriminador es el campo 'newStatus'
 */
export const invoiceStatusTransitionSchema = z.discriminatedUnion('newStatus', [
  markAsPaidSchema,
  confirmPaymentDateSchema,
  escalateInvoiceSchema,
  suspendInvoiceSchema,
  cancelInvoiceSchema,
  reactivateInvoiceSchema,
]);

// Tipos inferidos
export type InvoiceStatusTransition = z.infer<typeof invoiceStatusTransitionSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
export type ConfirmPaymentDateInput = z.infer<typeof confirmPaymentDateSchema>;
export type EscalateInvoiceInput = z.infer<typeof escalateInvoiceSchema>;
export type SuspendInvoiceInput = z.infer<typeof suspendInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type ReactivateInvoiceInput = z.infer<typeof reactivateInvoiceSchema>;
