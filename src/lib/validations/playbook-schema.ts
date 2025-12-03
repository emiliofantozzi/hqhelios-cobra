import { z } from 'zod';

/**
 * Tipos de trigger para playbooks de cobranza.
 * - pre_due: Se ejecuta antes del vencimiento
 * - post_due: Se ejecuta después del vencimiento
 * - manual: Se ejecuta manualmente por el usuario
 */
export const TRIGGER_TYPES = ['pre_due', 'post_due', 'manual'] as const;

/**
 * Canales de comunicación disponibles para mensajes.
 */
export const CHANNELS = ['email', 'whatsapp'] as const;

/**
 * Niveles de tono/temperatura para mensajes de cobranza.
 * - amigable: Tono cordial y recordatorio suave
 * - firme: Tono profesional y directo
 * - urgente: Tono urgente con énfasis en consecuencias
 */
export const TEMPERATURES = ['amigable', 'firme', 'urgente'] as const;

/**
 * Schema de validación para crear un playbook.
 *
 * @remarks
 * - triggerDays es requerido si triggerType no es 'manual'
 * - isDefault true marca este playbook como default para su trigger type
 * - Solo puede haber un default por trigger type por tenant (validado en DB)
 */
export const createPlaybookSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
    description: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
    triggerType: z.enum(TRIGGER_TYPES, {
      errorMap: () => ({ message: 'Selecciona un tipo de trigger válido' }),
    }),
    triggerDays: z.coerce.number().int().nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // triggerDays requerido si no es manual
      if (data.triggerType !== 'manual' && (data.triggerDays === null || data.triggerDays === undefined)) {
        return false;
      }
      return true;
    },
    {
      message: 'Días de trigger es requerido para playbooks pre_due y post_due',
      path: ['triggerDays'],
    }
  );

/**
 * Schema para actualizar un playbook existente.
 * Todos los campos son opcionales.
 */
export const updatePlaybookSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres').optional(),
    description: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
    triggerType: z
      .enum(TRIGGER_TYPES, {
        errorMap: () => ({ message: 'Selecciona un tipo de trigger válido' }),
      })
      .optional(),
    triggerDays: z.coerce.number().int().nullable().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Si se cambia triggerType a no-manual, triggerDays debe estar presente
      if (data.triggerType && data.triggerType !== 'manual' && data.triggerDays === null) {
        return false;
      }
      return true;
    },
    {
      message: 'Días de trigger es requerido para playbooks pre_due y post_due',
      path: ['triggerDays'],
    }
  );

/**
 * Schema de validación para crear un mensaje de playbook.
 *
 * @remarks
 * - subjectTemplate es requerido para emails
 * - bodyTemplate debe tener al menos 10 caracteres
 * - waitDays indica cuántos días esperar antes de enviar este mensaje
 * - sendOnlyIfNoResponse salta el mensaje si el cliente ya respondió
 */
export const createPlaybookMessageSchema = z
  .object({
    channel: z.enum(CHANNELS, {
      errorMap: () => ({ message: 'Selecciona un canal válido' }),
    }),
    temperature: z.enum(TEMPERATURES, {
      errorMap: () => ({ message: 'Selecciona un tono válido' }),
    }),
    subjectTemplate: z.string().max(500, 'Máximo 500 caracteres').optional().nullable().or(z.literal('')),
    bodyTemplate: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
    waitDays: z.coerce.number().int().min(0, 'Mínimo 0 días').default(0),
    sendOnlyIfNoResponse: z.boolean().default(true),
    useAiGeneration: z.boolean().default(false),
    aiInstructions: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable().or(z.literal('')),
  })
  .refine(
    (data) => {
      // subjectTemplate requerido para email
      if (data.channel === 'email' && (!data.subjectTemplate || data.subjectTemplate.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'El asunto es requerido para mensajes de email',
      path: ['subjectTemplate'],
    }
  );

/**
 * Schema para actualizar un mensaje existente.
 */
export const updatePlaybookMessageSchema = z
  .object({
    channel: z
      .enum(CHANNELS, {
        errorMap: () => ({ message: 'Selecciona un canal válido' }),
      })
      .optional(),
    temperature: z
      .enum(TEMPERATURES, {
        errorMap: () => ({ message: 'Selecciona un tono válido' }),
      })
      .optional(),
    subjectTemplate: z.string().max(500, 'Máximo 500 caracteres').optional().nullable().or(z.literal('')),
    bodyTemplate: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').optional(),
    waitDays: z.coerce.number().int().min(0, 'Mínimo 0 días').optional(),
    sendOnlyIfNoResponse: z.boolean().optional(),
    useAiGeneration: z.boolean().optional(),
    aiInstructions: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Si channel es email, subjectTemplate debe estar presente (si se actualiza)
      if (data.channel === 'email' && data.subjectTemplate !== undefined && (!data.subjectTemplate || data.subjectTemplate.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'El asunto es requerido para mensajes de email',
      path: ['subjectTemplate'],
    }
  );

/**
 * Schema para reordenar mensajes de un playbook.
 *
 * @remarks
 * - Recibe un array de objetos con id y sequenceOrder
 * - El sequenceOrder debe ser positivo y único
 */
export const reorderMessagesSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().uuid('ID de mensaje inválido'),
      sequenceOrder: z.number().int().positive('El orden debe ser positivo'),
    })
  ),
});

// Type exports
export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;
export type CreatePlaybookMessageInput = z.infer<typeof createPlaybookMessageSchema>;
export type UpdatePlaybookMessageInput = z.infer<typeof updatePlaybookMessageSchema>;
export type ReorderMessagesInput = z.infer<typeof reorderMessagesSchema>;

// Labels para UI en español
export const TRIGGER_TYPE_LABELS: Record<(typeof TRIGGER_TYPES)[number], string> = {
  pre_due: 'Antes del vencimiento',
  post_due: 'Después del vencimiento',
  manual: 'Manual',
};

export const CHANNEL_LABELS: Record<(typeof CHANNELS)[number], string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export const TEMPERATURE_LABELS: Record<(typeof TEMPERATURES)[number], string> = {
  amigable: 'Amigable',
  firme: 'Firme',
  urgente: 'Urgente',
};
