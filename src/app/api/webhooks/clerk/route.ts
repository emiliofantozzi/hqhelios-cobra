/**
 * Webhook handler para eventos de Clerk.
 * Sincroniza usuarios con la base de datos.
 *
 * @route POST /api/webhooks/clerk
 * @security Webhook signature verification via Svix
 */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  // Obtener el webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // Obtener headers para verificacion
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Obtener body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verificar webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Crear cliente Supabase con service role (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Manejar eventos
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, public_metadata } =
      evt.data;

    const email = email_addresses[0]?.email_address;
    const tenantId = public_metadata?.tenant_id as string | undefined;

    if (!email) {
      return new Response('No email provided', { status: 400 });
    }

    // Si no tiene tenant_id, sera asignado en el flujo de registro (historia 1.3)
    // Por ahora, solo crear si tiene tenant_id
    if (tenantId) {
      const { error } = await supabase.from('users').insert({
        clerk_user_id: id,
        tenant_id: tenantId,
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        role: 'admin',
        is_active: true,
      });

      if (error) {
        console.error('Error creating user:', error);
        return new Response('Error creating user', { status: 500 });
      }
    }

    console.log(`User created: ${id}`);
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    const { error } = await supabase
      .from('users')
      .update({
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error updating user:', error);
      // No fallar si usuario no existe (puede no haberse creado aun)
    }

    console.log(`User updated: ${id}`);
  }

  return new Response('Webhook processed', { status: 200 });
}
