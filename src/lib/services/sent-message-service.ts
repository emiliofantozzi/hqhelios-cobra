/**
 * Sent Message Service
 *
 * Handles creation and management of sent message records.
 * Used by collection worker to track all outgoing messages.
 */

import { getAdminSupabaseClient } from '@/lib/db/supabase';
import { MessageChannel } from './messaging/types';

/**
 * Parameters for creating a sent message record
 */
export interface CreateSentMessageParams {
  /** Tenant ID from collection */
  tenantId: string;
  /** Collection ID that triggered the message */
  collectionId: string;
  /** Contact ID who received the message */
  contactId: string;
  /** Optional playbook message ID from template */
  playbookMessageId?: string;
  /** Channel used (email, whatsapp in Epic 5) */
  channel: MessageChannel;
  /** Email subject */
  subject?: string;
  /** Message body content */
  body: string;
  /** External message ID from provider (Resend) */
  externalMessageId: string;
}

/**
 * Creates a record of a sent message in the database.
 * Should be called after successful message send from the worker.
 *
 * @param params - Message details from collection worker
 * @returns The created sent message ID
 * @throws Error if database insert fails
 *
 * @example
 * ```ts
 * const sentMessageId = await createSentMessageRecord({
 *   tenantId: collection.tenant_id,
 *   collectionId: collection.id,
 *   contactId: collection.primary_contact_id,
 *   playbookMessageId: nextMessage.id,
 *   channel: 'email',
 *   subject: 'Payment Reminder',
 *   body: 'Dear customer...',
 *   externalMessageId: 'resend_abc123',
 * });
 * ```
 */
export async function createSentMessageRecord(
  params: CreateSentMessageParams
): Promise<string> {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from('sent_messages')
    .insert({
      tenant_id: params.tenantId,
      collection_id: params.collectionId,
      contact_id: params.contactId,
      playbook_message_id: params.playbookMessageId || null,
      channel: params.channel,
      subject: params.subject || null,
      body: params.body,
      external_message_id: params.externalMessageId,
      delivery_status: 'sent', // Resend confirmed send - initial status is 'sent'
      sent_at: new Date().toISOString(),
      was_ai_generated: false, // Templates in Epic 3, AI in Epic 5
    })
    .select('id')
    .single();

  if (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'SentMessageService',
        message: 'Failed to create sent message record',
        collectionId: params.collectionId,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    );
    throw error;
  }

  console.log(
    JSON.stringify({
      level: 'info',
      component: 'SentMessageService',
      message: 'Sent message record created',
      sentMessageId: data.id,
      collectionId: params.collectionId,
      externalMessageId: params.externalMessageId,
      timestamp: new Date().toISOString(),
    })
  );

  return data.id;
}
