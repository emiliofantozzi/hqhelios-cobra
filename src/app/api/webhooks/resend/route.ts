import { Webhook } from 'svix';
import { getAdminSupabaseClient } from '@/lib/db/supabase';
import {
  resendWebhookEventSchema,
  type ResendWebhookEvent,
} from '@/lib/validations/resend-webhook-schema';

/**
 * Maps Resend event types to delivery_status values.
 *
 * @param eventType - The Resend event type (e.g., 'email.delivered')
 * @returns The corresponding delivery_status or null if unsupported
 */
function mapResendEvent(eventType: string): string | null {
  const mapping: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.complained': 'failed',
  };
  return mapping[eventType] ?? null;
}

/**
 * POST /api/webhooks/resend
 *
 * Receives webhooks from Resend to update email delivery status.
 * Validates svix signature before processing.
 *
 * @param request - The incoming webhook request
 * @returns Response with 200 OK or 401 Unauthorized
 */
export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'ResendWebhook',
        message: 'RESEND_WEBHOOK_SECRET not configured',
        timestamp: new Date().toISOString(),
      })
    );
    return new Response('Server configuration error', { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };

  // Verify signature
  const wh = new Webhook(webhookSecret);
  let event: ResendWebhookEvent;

  try {
    const rawEvent = wh.verify(payload, headers);
    // Validate payload structure with Zod schema
    const parsed = resendWebhookEventSchema.safeParse(rawEvent);
    if (!parsed.success) {
      console.error(
        JSON.stringify({
          level: 'error',
          component: 'ResendWebhook',
          message: 'Invalid payload structure',
          errors: parsed.error.errors,
          timestamp: new Date().toISOString(),
        })
      );
      return new Response('Invalid payload', { status: 400 });
    }
    event = parsed.data;
  } catch {
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'ResendWebhook',
        message: 'Invalid signature',
        timestamp: new Date().toISOString(),
      })
    );
    return new Response('Invalid signature', { status: 400 });
  }

  // Log incoming event
  console.log(
    JSON.stringify({
      level: 'info',
      component: 'ResendWebhook',
      message: 'Event received',
      event_type: event.type,
      email_id: event.data.email_id,
      timestamp: new Date().toISOString(),
    })
  );

  // Map event to delivery status
  const status = mapResendEvent(event.type);
  if (!status) {
    // Unsupported event, return OK to prevent retries
    console.log(
      JSON.stringify({
        level: 'info',
        component: 'ResendWebhook',
        message: 'Unsupported event type, ignoring',
        event_type: event.type,
        timestamp: new Date().toISOString(),
      })
    );
    return new Response('OK', { status: 200 });
  }

  // Update database
  const supabase = getAdminSupabaseClient();
  const updateData: Record<string, unknown> = {
    delivery_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'delivered') {
    updateData.delivered_at = event.created_at;
  }

  const { data, error } = await supabase
    .from('sent_messages')
    .update(updateData)
    .eq('external_message_id', event.data.email_id)
    .select('id');

  if (error) {
    // Log warning but return 200 (avoid Resend retries)
    console.warn(
      JSON.stringify({
        level: 'warn',
        component: 'ResendWebhook',
        message: 'Database update failed',
        email_id: event.data.email_id,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    );
  } else if (!data || data.length === 0) {
    // No rows updated - message not found (race condition or test email)
    console.warn(
      JSON.stringify({
        level: 'warn',
        component: 'ResendWebhook',
        message: 'Message not found for update',
        email_id: event.data.email_id,
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    console.log(
      JSON.stringify({
        level: 'info',
        component: 'ResendWebhook',
        message: 'Delivery status updated',
        email_id: event.data.email_id,
        new_status: status,
        rows_updated: data.length,
        timestamp: new Date().toISOString(),
      })
    );
  }

  return new Response('OK', { status: 200 });
}
