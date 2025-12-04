import { z } from 'zod';

/**
 * Schema de validación para crear una empresa cliente.
 *
 * @remarks
 * - taxId debe ser único dentro del tenant (validado en DB)
 * - phone es opcional
 * - riskLevel default "medio"
 * - hasPortal indica si la empresa usa portal de facturas
 */
export const companySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  taxId: z.string().min(1, 'Tax ID requerido').max(50),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  riskLevel: z.enum(['bajo', 'medio', 'alto']),
  hasPortal: z.boolean(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
