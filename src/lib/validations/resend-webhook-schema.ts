import { z } from 'zod';

/**
 * Schema for Resend webhook events.
 * Validates the payload structure from Resend's webhook system.
 *
 * @see https://resend.com/docs/webhooks
 */
export const resendWebhookEventSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.bounced',
    'email.complained',
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    from: z.string().optional(),
    to: z.array(z.string()).optional(),
    subject: z.string().optional(),
  }),
});

export type ResendWebhookEvent = z.infer<typeof resendWebhookEventSchema>;
