/**
 * Schema de validación para contactos
 *
 * @module lib/validations/contact-schema
 */
import { z } from 'zod';

/**
 * Schema de validación para crear/editar un contacto.
 *
 * @remarks
 * - email debe ser válido
 * - firstName y lastName son requeridos
 * - phone y position son opcionales
 * - Un contacto PUEDE ser Primary y Escalation al mismo tiempo (común en PyMEs)
 */
export const contactSchema = z.object({
  companyId: z.string().uuid('Company ID inválido'),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().max(50).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  isPrimaryContact: z.boolean().default(false),
  isEscalationContact: z.boolean().default(false),
});
// Nota: Un contacto PUEDE ser Primary y Escalation al mismo tiempo (común en PyMEs)

/**
 * Schema para actualizar un contacto (todos los campos opcionales excepto los que se envían)
 */
export const contactUpdateSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido').max(100).optional(),
  lastName: z.string().min(1, 'Apellido requerido').max(100).optional(),
  email: z.string().email('Email inválido').max(255).optional(),
  phone: z.string().max(50).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  isPrimaryContact: z.boolean().optional(),
  isEscalationContact: z.boolean().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactUpdateData = z.infer<typeof contactUpdateSchema>;
