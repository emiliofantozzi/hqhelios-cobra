/**
 * Webhook handler para eventos de Clerk.
 * Crea tenant y usuario automaticamente en registro.
 *
 * @route POST /api/webhooks/clerk
 * @security Webhook signature verification via Svix
 */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { provisionTenantForUser } from '@/lib/auth/provision-tenant';
import {
  supabaseEnv,
  clerkEnv,
  validateEnv,
  validateClerkEnv,
} from '@/lib/config/env';

export async function POST(request: Request) {
  // Validar configuración de Clerk
  validateClerkEnv();

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
  const wh = new Webhook(clerkEnv.webhookSecret!);
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
  validateEnv();
  const supabase = createClient(supabaseEnv.url!, supabaseEnv.serviceKey!);

  // Manejar eventos
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name } =
      evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error('No email provided for user:', clerkUserId);
      return new Response('No email provided', { status: 400 });
    }

    // Validate email format and length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      console.error('Invalid email format or length:', email);
      return new Response('Invalid email format', { status: 400 });
    }

    console.log(`Processing user.created webhook for: ${email}`);

    try {
      // Usar función compartida para provisionar tenant y usuario
      await provisionTenantForUser({
        id: clerkUserId,
        email,
        firstName: first_name,
        lastName: last_name,
      });

      return new Response('User and tenant created successfully', {
        status: 200,
      });
    } catch (error) {
      console.error('Error in user.created handler:', error);
      return new Response(
        `Error processing registration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 500 }
      );
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    // Validar que email existe
    if (!email) {
      console.warn(`user.updated without email for user: ${id}`);
      return new Response('Webhook processed', { status: 200 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', id)
      .select();

    if (error) {
      console.error('Error updating user:', error);
      console.error(`Failed to update user ${id}, email: ${email}`);

      // Solo ignorar si es error de "no rows returned"
      // Otros errores de DB deben loguearse con severidad
      if (error.code === 'PGRST116') {
        // PGRST116 = "The result contains 0 rows"
        console.warn(
          `User ${id} not found in DB (user.updated before user.created)`
        );
      } else {
        // Error real de DB - loguear con severidad pero no fallar el webhook
        console.error(`CRITICAL: Database error updating user ${id}:`, {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
      }
    } else if (data && data.length > 0) {
      console.log(`User updated successfully: ${id}`);
    } else {
      console.warn(`User ${id} not found for update (race condition)`);
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    // Soft delete: marcar como inactivo en vez de eliminar
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error soft-deleting user:', error);
      return new Response('Error processing user deletion', { status: 500 });
    }

    console.log(`User soft-deleted: ${id}`);
  }

  return new Response('Webhook processed', { status: 200 });
}
