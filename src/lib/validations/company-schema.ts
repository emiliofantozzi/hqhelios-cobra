import { z } from 'zod';

/**
 * Schema de validación para crear una empresa cliente.
 *
 * @remarks
 * - taxId debe ser único dentro del tenant (validado en DB)
 * - email es opcional pero debe ser válido si se proporciona
 * - paymentTermsDays default 30 días
 * - riskLevel default "medio"
 */
export const companySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  taxId: z.string().min(1, 'Tax ID requerido').max(50),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  paymentTermsDays: z.number().int().min(1).max(365),
  riskLevel: z.enum(['bajo', 'medio', 'alto']),
});

export type CompanyFormData = z.infer<typeof companySchema>;
