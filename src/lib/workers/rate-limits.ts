/**
 * Rate Limiting Utilities
 *
 * Functions to check and enforce rate limits for collection processing.
 * Prevents spam and ensures fair distribution of messages.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { workerConfig } from './config';

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the message is allowed to be sent */
  allowed: boolean;
  /** Reason for rejection if not allowed */
  reason?: 'max_active_exceeded' | 'min_hours_not_met' | 'daily_limit_exceeded';
  /** When to retry if rate limited */
  retryAfter?: Date;
}

/**
 * Statistics for a tenant used in rate limiting
 */
export interface TenantStats {
  tenantId: string;
  /** Number of currently active collections */
  activeCollections: number;
  /** Number of messages sent today */
  messagesSentToday: number;
  /** Map of contact ID to their last message timestamp */
  contactLastMessageTimes: Map<string, Date>;
}

/**
 * Minimal collection interface for rate limit checks
 */
interface CollectionForRateLimit {
  tenant_id: string;
  primary_contact_id: string;
}

/**
 * Checks all rate limits for a collection.
 *
 * @param collection - The collection to check
 * @param tenantStatsMap - Map of tenant stats by tenant ID
 * @returns Rate limit check result
 */
export function checkRateLimits(
  collection: CollectionForRateLimit,
  tenantStatsMap: Map<string, TenantStats>
): RateLimitResult {
  const stats = tenantStatsMap.get(collection.tenant_id);

  if (!stats) {
    // No stats means first collection for this tenant - allow
    return { allowed: true };
  }

  const { rateLimits } = workerConfig;

  // Check max active collections per tenant
  if (stats.activeCollections >= rateLimits.maxActiveCollectionsPerTenant) {
    return {
      allowed: false,
      reason: 'max_active_exceeded',
    };
  }

  // Check daily message limit per tenant
  if (stats.messagesSentToday >= rateLimits.maxMessagesPerDayPerTenant) {
    // Retry tomorrow at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      allowed: false,
      reason: 'daily_limit_exceeded',
      retryAfter: tomorrow,
    };
  }

  // Check minimum hours between messages to same contact
  const lastMessageTime = stats.contactLastMessageTimes.get(
    collection.primary_contact_id
  );

  if (lastMessageTime) {
    const hoursSinceLastMessage =
      (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);

    if (
      hoursSinceLastMessage < rateLimits.minHoursBetweenMessagesToSameContact
    ) {
      const retryAfter = new Date(
        lastMessageTime.getTime() +
          rateLimits.minHoursBetweenMessagesToSameContact * 60 * 60 * 1000
      );

      return {
        allowed: false,
        reason: 'min_hours_not_met',
        retryAfter,
      };
    }
  }

  return { allowed: true };
}

/**
 * Gets the count of messages sent by a tenant today.
 *
 * @param supabase - Supabase admin client
 * @param tenantId - Tenant ID to check
 * @param date - Date to check (defaults to today)
 * @returns Number of messages sent today
 */
export async function getTenantDailyMessageCount(
  supabase: SupabaseClient,
  tenantId: string,
  date: Date = new Date()
): Promise<number> {
  // Get start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Count messages sent today by checking last_message_sent_at on collections
  const { count, error } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('last_message_sent_at', startOfDay.toISOString())
    .lte('last_message_sent_at', endOfDay.toISOString());

  if (error) {
    console.error('[RateLimits] Error getting daily message count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Gets the last message time for a contact across all collections.
 *
 * @param supabase - Supabase admin client
 * @param contactId - Contact ID to check
 * @returns Last message timestamp or null if never sent
 */
export async function getContactLastMessageTime(
  supabase: SupabaseClient,
  contactId: string
): Promise<Date | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('last_message_sent_at')
    .eq('primary_contact_id', contactId)
    .not('last_message_sent_at', 'is', null)
    .order('last_message_sent_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.last_message_sent_at) {
    return null;
  }

  return new Date(data.last_message_sent_at);
}

/**
 * Builds tenant statistics for rate limiting from a batch of collections.
 * Optimized with batch queries to avoid N+1 pattern (MED-2).
 *
 * @param supabase - Supabase admin client
 * @param collections - Collections to build stats for
 * @returns Map of tenant ID to their stats
 */
export async function buildTenantStats(
  supabase: SupabaseClient,
  collections: Array<{ tenant_id: string; primary_contact_id: string }>
): Promise<Map<string, TenantStats>> {
  const statsMap = new Map<string, TenantStats>();

  // Get unique tenant IDs and contact IDs
  const tenantIds = Array.from(new Set(collections.map((c) => c.tenant_id)));
  const contactIds = Array.from(
    new Set(collections.map((c) => c.primary_contact_id))
  );

  // Early return if no collections
  if (tenantIds.length === 0) {
    return statsMap;
  }

  // Optimized: Calculate start of day once
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayISO = startOfDay.toISOString();

  // Run all 3 queries in parallel (MED-2: can't reduce to 1 query due to different filters)
  const [activeCountsResult, dailyCountsResult, contactMessagesResult] =
    await Promise.all([
      // Query 1: Active collection counts per tenant
      supabase
        .from('collections')
        .select('tenant_id')
        .in('tenant_id', tenantIds)
        .eq('status', 'active'),

      // Query 2: Daily message counts per tenant
      supabase
        .from('collections')
        .select('tenant_id')
        .in('tenant_id', tenantIds)
        .gte('last_message_sent_at', startOfDayISO),

      // Query 3: Last message times for contacts
      supabase
        .from('collections')
        .select('primary_contact_id, last_message_sent_at')
        .in('primary_contact_id', contactIds)
        .not('last_message_sent_at', 'is', null)
        .order('last_message_sent_at', { ascending: false }),
    ]);

  // Build active count map
  const activeCountMap = new Map<string, number>();
  for (const row of activeCountsResult.data || []) {
    const count = activeCountMap.get(row.tenant_id) || 0;
    activeCountMap.set(row.tenant_id, count + 1);
  }

  // Build daily count map
  const dailyCountMap = new Map<string, number>();
  for (const row of dailyCountsResult.data || []) {
    const count = dailyCountMap.get(row.tenant_id) || 0;
    dailyCountMap.set(row.tenant_id, count + 1);
  }

  // Build contact last message map (only keep latest per contact)
  const contactLastMessageMap = new Map<string, Date>();
  for (const row of contactMessagesResult.data || []) {
    if (
      row.last_message_sent_at &&
      !contactLastMessageMap.has(row.primary_contact_id)
    ) {
      contactLastMessageMap.set(
        row.primary_contact_id,
        new Date(row.last_message_sent_at)
      );
    }
  }

  // Build stats for each tenant
  for (const tenantId of tenantIds) {
    // Get contacts for this tenant from the batch
    const tenantContacts = collections
      .filter((c) => c.tenant_id === tenantId)
      .map((c) => c.primary_contact_id);

    // Build contact times map for this tenant
    const contactTimes = new Map<string, Date>();
    for (const contactId of tenantContacts) {
      const lastTime = contactLastMessageMap.get(contactId);
      if (lastTime) {
        contactTimes.set(contactId, lastTime);
      }
    }

    statsMap.set(tenantId, {
      tenantId,
      activeCollections: activeCountMap.get(tenantId) || 0,
      messagesSentToday: dailyCountMap.get(tenantId) || 0,
      contactLastMessageTimes: contactTimes,
    });
  }

  return statsMap;
}
