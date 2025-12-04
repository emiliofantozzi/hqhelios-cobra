/**
 * Schema de validación para facturas (invoices)
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module lib/validations/invoice-schema
 */
import { z } from 'zod';

/**
 * Monedas soportadas
 */
export const SUPPORTED_CURRENCIES = ['USD', 'MXN', 'EUR'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Estados de pago de factura
 */
export const PAYMENT_STATUSES = [
  'pendiente',
  'fecha_confirmada',
  'pagada',
  'escalada',
  'suspendida',
  'cancelada',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Schema base de validación para facturas (sin refinements)
 */
const invoiceBaseSchema = z.object({
  companyId: z
    .string({
      required_error: 'Debe seleccionar una empresa',
    })
    .uuid('ID de empresa inválido'),

  invoiceNumber: z
    .string({
      required_error: 'El número de factura es requerido',
    })
    .min(1, 'El número de factura es requerido')
    .max(100, 'El número de factura no puede exceder 100 caracteres')
    .trim(),

  amount: z
    .number({
      required_error: 'El monto es requerido',
      invalid_type_error: 'El monto debe ser un número',
    })
    .positive('El monto debe ser mayor a 0')
    .multipleOf(0.01, 'El monto solo puede tener hasta 2 decimales'),

  currency: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: 'Moneda no soportada' }),
  }),

  issueDate: z.coerce.date({
    required_error: 'La fecha de emisión es requerida',
    invalid_type_error: 'Fecha de emisión inválida',
  }),

  dueDate: z.coerce.date({
    required_error: 'La fecha de vencimiento es requerida',
    invalid_type_error: 'Fecha de vencimiento inválida',
  }),

  // Nuevos campos agregados en refinamiento de schema
  paymentTermsDays: z
    .number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 día')
    .max(365, 'Máximo 365 días'),

  paymentStatus: z.enum(PAYMENT_STATUSES),

  projectedPaymentDate: z.coerce.date().optional().nullable(),

  confirmedPaymentDate: z.coerce.date().optional().nullable(),

  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema de validación para crear facturas
 *
 * Reglas de negocio:
 * - invoiceNumber: Requerido, único por tenant
 * - amount: Debe ser > 0, máximo 2 decimales
 * - dueDate: Debe ser >= issueDate
 * - currency: Solo USD, MXN, EUR por ahora
 */
export const createInvoiceSchema = invoiceBaseSchema.refine(
  (data) => data.dueDate >= data.issueDate,
  {
    message:
      'La fecha de vencimiento debe ser igual o posterior a la fecha de emisión',
    path: ['dueDate'],
  }
);

/**
 * Tipo inferido del schema de creación
 */
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

/**
 * Schema para actualizar factura (Story 2.6)
 */
export const updateInvoiceSchema = invoiceBaseSchema.partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
