/**
 * Collection Validation Schemas
 * Story 3.5: Activar Playbook en Factura
 *
 * @module lib/validations/collection-schema
 */
import { z } from 'zod';

/**
 * Schema para activar un playbook en una factura
 */
export const activatePlaybookSchema = z.object({
  playbookId: z.string().uuid('ID de playbook inválido'),
});

/**
 * Tipo inferido del schema de activación
 */
export type ActivatePlaybookInput = z.infer<typeof activatePlaybookSchema>;

/**
 * Schema para acciones manuales sobre playbook activo
 * Story 3.7: Control Manual de Playbook Activo
 */
export const playbookActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'complete'], {
    errorMap: () => ({ message: 'Acción inválida' }),
  }),
  note: z
    .string()
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional(),
});

/**
 * Tipo inferido del schema de acción
 */
export type PlaybookActionInput = z.infer<typeof playbookActionSchema>;

/**
 * Schema para validar invoiceId en route params
 */
export const invoiceIdSchema = z.string().uuid('ID de factura inválido');
