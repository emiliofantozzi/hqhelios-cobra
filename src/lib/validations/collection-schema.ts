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
