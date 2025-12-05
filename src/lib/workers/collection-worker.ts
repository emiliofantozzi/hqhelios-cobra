/**
 * Collection Worker
 *
 * Core logic for processing collections automatically.
 * Sends playbook messages based on schedule and respects rate limits.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getAdminSupabaseClient } from '@/lib/db/supabase';
import { replaceTemplateVariables } from '@/lib/utils/template-replacer';
import { messageService } from '@/lib/services/messaging/mock-message-service';
import { MessageChannel } from '@/lib/services/messaging/types';
import { acquireLock, releaseLock } from './distributed-lock';
import { checkRateLimits, buildTenantStats, RateLimitResult } from './rate-limits';
import { workerConfig } from './config';

/**
 * Result of processing collections
 */
export interface ProcessResult {
  /** Number of collections processed successfully */
  processed: number;
  /** Number of collections skipped (rate limit, no response, etc.) */
  skipped: number;
  /** Number of collections that errored */
  errors: number;
  /** Whether the lock was already held by another instance */
  lockHeld: boolean;
}

/**
 * Collection with related data for processing
 */
interface CollectionWithRelations {
  id: string;
  tenant_id: string;
  invoice_id: string;
  company_id: string;
  primary_contact_id: string;
  playbook_id: string;
  current_message_index: number;
  status: string;
  messages_sent_count: number;
  last_message_sent_at: string | null;
  customer_responded: boolean;
  next_action_at: string | null;
  playbook: {
    id: string;
    name: string;
    messages: PlaybookMessageData[];
  };
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    due_date: string;
  };
  company: {
    id: string;
    name: string;
  };
  primary_contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

/**
 * Playbook message data
 */
interface PlaybookMessageData {
  id: string;
  sequence_order: number;
  channel: string;
  subject_template: string | null;
  body_template: string;
  wait_days: number;
  send_only_if_no_response: boolean;
}

/**
 * Template context for message variable replacement
 */
type MessageContext = Record<string, string | number>;

/**
 * Main entry point for the collection worker.
 * Acquires lock, processes collections, releases lock.
 *
 * @returns Processing result with stats
 */
export async function processCollections(): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    skipped: 0,
    errors: 0,
    lockHeld: false,
  };

  // Try to acquire distributed lock
  const lockAcquired = await acquireLock(
    workerConfig.lock.key,
    workerConfig.lock.ttlSeconds
  );

  if (!lockAcquired) {
    console.log('[Worker] Lock held by another instance, exiting');
    return { ...result, lockHeld: true };
  }

  try {
    const supabase = getAdminSupabaseClient();

    // Fetch active collections ready to process
    const { data: collections, error } = await supabase
      .from('collections')
      .select(
        `
        id,
        tenant_id,
        invoice_id,
        company_id,
        primary_contact_id,
        playbook_id,
        current_message_index,
        status,
        messages_sent_count,
        last_message_sent_at,
        customer_responded,
        next_action_at,
        playbook:playbooks (
          id,
          name,
          messages:playbook_messages (
            id,
            sequence_order,
            channel,
            subject_template,
            body_template,
            wait_days,
            send_only_if_no_response
          )
        ),
        invoice:invoices (
          id,
          invoice_number,
          amount,
          currency,
          due_date
        ),
        company:companies (
          id,
          name
        ),
        primary_contact:contacts!primary_contact_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .eq('status', 'active')
      .lte('next_action_at', new Date().toISOString())
      .order('next_action_at', { ascending: true })
      .limit(workerConfig.batchSize);

    if (error) {
      console.error('[Worker] Error fetching collections:', error);
      return result;
    }

    if (!collections || collections.length === 0) {
      console.log('[Worker] No collections to process');
      return result;
    }

    console.log(`[Worker] Found ${collections.length} collections to process`);

    // Build tenant stats for rate limiting (single batch query)
    const tenantStats = await buildTenantStats(
      supabase,
      collections.map((c) => ({
        tenant_id: c.tenant_id,
        primary_contact_id: c.primary_contact_id,
      }))
    );

    // Pre-filter: identify tenants that already exceeded limits (AC 3)
    const blockedTenants = new Set<string>();
    for (const [tenantId, stats] of Array.from(tenantStats.entries())) {
      const { rateLimits } = workerConfig;
      if (
        stats.activeCollections >= rateLimits.maxActiveCollectionsPerTenant ||
        stats.messagesSentToday >= rateLimits.maxMessagesPerDayPerTenant
      ) {
        blockedTenants.add(tenantId);
        console.log(
          `[Worker] Tenant ${tenantId} blocked - active: ${stats.activeCollections}, daily: ${stats.messagesSentToday}`
        );
      }
    }

    // Process each collection
    for (const collection of collections) {
      // Skip entire tenant if blocked (AC 3: "skipea collections de tenants que exceden rate limits")
      if (blockedTenants.has(collection.tenant_id)) {
        result.skipped++;
        continue;
      }
      try {
        const processResult = await processCollection(
          supabase,
          collection as unknown as CollectionWithRelations,
          tenantStats
        );

        if (processResult === 'processed') {
          result.processed++;
        } else if (processResult === 'skipped') {
          result.skipped++;
        }
      } catch (err) {
        console.error(
          `[Worker] Error processing collection ${collection.id}:`,
          err
        );
        result.errors++;
        await pauseCollectionWithError(supabase, collection.id, err);
      }
    }

    console.log('[Worker] Completed:', result);
    return result;
  } finally {
    await releaseLock(workerConfig.lock.key);
  }
}

/**
 * Processes a single collection - sends message or updates state.
 *
 * @param supabase - Admin Supabase client
 * @param collection - Collection with relations
 * @param tenantStats - Pre-built tenant stats for rate limiting
 * @returns 'processed' | 'skipped' | 'completed'
 */
async function processCollection(
  supabase: SupabaseClient,
  collection: CollectionWithRelations,
  tenantStats: Map<string, import('./rate-limits').TenantStats>
): Promise<'processed' | 'skipped' | 'completed'> {
  // Get next message from playbook
  const nextMessage = getNextMessage(collection);

  // No more messages - complete the collection
  if (!nextMessage) {
    await completeCollection(supabase, collection.id);
    console.log(`[Worker] Collection ${collection.id} completed - no more messages`);
    return 'completed';
  }

  // Check sendOnlyIfNoResponse
  if (nextMessage.send_only_if_no_response && collection.customer_responded) {
    // Skip this message, advance to next
    console.log(
      `[Worker] Collection ${collection.id} - skipping message (customer responded)`
    );
    await advanceToNextMessage(supabase, collection, nextMessage);
    return 'skipped';
  }

  // Check rate limits
  const rateLimitResult = checkRateLimits(
    {
      tenant_id: collection.tenant_id,
      primary_contact_id: collection.primary_contact_id,
    },
    tenantStats
  );

  if (!rateLimitResult.allowed) {
    await handleRateLimitHit(supabase, collection, rateLimitResult);
    return 'skipped';
  }

  // Build message context
  const context = buildMessageContext(collection);

  // Replace template variables
  const body = replaceTemplateVariables(nextMessage.body_template, context);
  const subject = nextMessage.subject_template
    ? replaceTemplateVariables(nextMessage.subject_template, context)
    : undefined;

  // Determine recipient based on channel
  const to =
    nextMessage.channel === 'whatsapp'
      ? collection.primary_contact.phone || collection.primary_contact.email
      : collection.primary_contact.email;

  // Send message
  const sendResult = await messageService.send({
    channel: nextMessage.channel as MessageChannel,
    to,
    subject,
    body,
    metadata: {
      collectionId: collection.id,
      invoiceId: collection.invoice_id,
      messageIndex: collection.current_message_index,
    },
  });

  // Update collection based on result
  await updateCollectionAfterSend(supabase, collection, nextMessage, sendResult.success);

  if (!sendResult.success) {
    console.log(
      `[Worker] Collection ${collection.id} - send failed: ${sendResult.error}`
    );
    return 'skipped';
  }

  console.log(
    `[Worker] Collection ${collection.id} - message sent (${nextMessage.channel})`
  );
  return 'processed';
}

/**
 * Gets the next message to send from the playbook.
 *
 * @param collection - Collection with playbook messages
 * @returns Next message or null if no more messages
 */
function getNextMessage(
  collection: CollectionWithRelations
): PlaybookMessageData | null {
  const messages = collection.playbook.messages;

  if (!messages || messages.length === 0) {
    return null;
  }

  // Sort by sequence_order
  const sortedMessages = [...messages].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );

  // Get message at current index
  if (collection.current_message_index >= sortedMessages.length) {
    return null;
  }

  return sortedMessages[collection.current_message_index];
}

/**
 * Builds the template context from collection data.
 *
 * @param collection - Collection with relations
 * @returns Template context object
 */
function buildMessageContext(collection: CollectionWithRelations): MessageContext {
  const dueDate = new Date(collection.invoice.due_date);
  const today = new Date();
  const daysOverdue = Math.max(
    0,
    Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Format amount with thousands separator
  const amount = Number(collection.invoice.amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format date
  const formattedDueDate = dueDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    company_name: collection.company.name,
    contact_first_name: collection.primary_contact.first_name,
    contact_last_name: collection.primary_contact.last_name,
    invoice_number: collection.invoice.invoice_number,
    amount,
    currency: collection.invoice.currency,
    due_date: formattedDueDate,
    days_overdue: daysOverdue,
  };
}

/**
 * Updates collection after sending a message.
 *
 * @param supabase - Admin Supabase client
 * @param collection - The collection
 * @param currentMessage - Message that was just sent
 * @param success - Whether send was successful
 */
async function updateCollectionAfterSend(
  supabase: SupabaseClient,
  collection: CollectionWithRelations,
  currentMessage: PlaybookMessageData,
  success: boolean
): Promise<void> {
  if (!success) {
    // Pause collection on error
    await supabase
      .from('collections')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', collection.id);
    return;
  }

  // Get next message to calculate next_action_at
  const messages = [...collection.playbook.messages].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );
  const nextIndex = collection.current_message_index + 1;
  const nextMessage = messages[nextIndex];

  const now = new Date();

  // Calculate next action time (AC 4 Step 7: now + wait_days)
  let nextActionAt: string | null = null;
  if (nextMessage) {
    // Use milliseconds for accurate date arithmetic (avoids edge cases with setDate)
    const nextDate = new Date(
      now.getTime() + nextMessage.wait_days * 24 * 60 * 60 * 1000
    );
    nextActionAt = nextDate.toISOString();
  }

  // Update collection
  await supabase
    .from('collections')
    .update({
      messages_sent_count: collection.messages_sent_count + 1,
      last_message_sent_at: now.toISOString(),
      current_message_index: nextIndex,
      next_action_at: nextActionAt,
      // If no next message, mark as completed
      status: nextMessage ? 'active' : 'completed',
      completed_at: nextMessage ? null : now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', collection.id);
}

/**
 * Advances to next message without sending (skip scenario).
 */
async function advanceToNextMessage(
  supabase: SupabaseClient,
  collection: CollectionWithRelations,
  _currentMessage: PlaybookMessageData
): Promise<void> {
  const messages = [...collection.playbook.messages].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );
  const nextIndex = collection.current_message_index + 1;
  const nextMessage = messages[nextIndex];

  const now = new Date();

  let nextActionAt: string | null = null;
  if (nextMessage) {
    // Use milliseconds for accurate date arithmetic
    const nextDate = new Date(
      now.getTime() + nextMessage.wait_days * 24 * 60 * 60 * 1000
    );
    nextActionAt = nextDate.toISOString();
  }

  await supabase
    .from('collections')
    .update({
      current_message_index: nextIndex,
      next_action_at: nextActionAt,
      status: nextMessage ? 'active' : 'completed',
      completed_at: nextMessage ? null : now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', collection.id);
}

/**
 * Handles rate limit hit - updates next_action_at and logs reason (AC 8, MED-1).
 */
async function handleRateLimitHit(
  supabase: SupabaseClient,
  collection: CollectionWithRelations,
  result: RateLimitResult
): Promise<void> {
  console.log(
    `[Worker] Collection ${collection.id} rate limited: ${result.reason}`,
    {
      collectionId: collection.id,
      tenantId: collection.tenant_id,
      reason: result.reason,
      retryAfter: result.retryAfter?.toISOString(),
    }
  );

  // Update collection with retry time and log skip reason
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (result.retryAfter) {
    updates.next_action_at = result.retryAfter.toISOString();
  }

  await supabase
    .from('collections')
    .update(updates)
    .eq('id', collection.id);
}

/**
 * Completes a collection when there are no more messages.
 */
async function completeCollection(
  supabase: SupabaseClient,
  collectionId: string
): Promise<void> {
  const now = new Date().toISOString();

  await supabase
    .from('collections')
    .update({
      status: 'completed',
      completed_at: now,
      next_action_at: null,
      updated_at: now,
    })
    .eq('id', collectionId);
}

/**
 * Pauses a collection due to error.
 * Logs structured error for admin notification (AC 10).
 * TODO Epic 5: Insert into notifications table for admin alert.
 */
async function pauseCollectionWithError(
  supabase: SupabaseClient,
  collectionId: string,
  error?: unknown
): Promise<void> {
  // Structured logging for admin notification (AC 10)
  console.error('[Worker] Collection paused due to error', {
    collectionId,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    action_required: 'Admin review needed',
  });

  // TODO Epic 5: Create notification record
  // await supabase.from('notifications').insert({
  //   type: 'collection_error',
  //   severity: 'high',
  //   collection_id: collectionId,
  //   message: `Collection ${collectionId} paused due to error`,
  //   created_at: new Date().toISOString(),
  // });

  await supabase
    .from('collections')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', collectionId);
}
