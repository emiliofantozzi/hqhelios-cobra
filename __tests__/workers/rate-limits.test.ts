/**
 * Tests for Rate Limiting Utilities
 */

import { describe, it, expect } from 'vitest';
import { checkRateLimits, TenantStats } from '@/lib/workers/rate-limits';
import { workerConfig } from '@/lib/workers/config';

describe('Rate Limits', () => {
  describe('checkRateLimits()', () => {
    it('should allow when no stats exist for tenant', () => {
      const statsMap = new Map<string, TenantStats>();

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow when all limits are within bounds', () => {
      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: 3,
            messagesSentToday: 5,
            contactLastMessageTimes: new Map(),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(true);
    });

    it('should reject when max active collections per tenant exceeded', () => {
      const maxActive = workerConfig.rateLimits.maxActiveCollectionsPerTenant;
      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: maxActive + 1, // Exceeds limit
            messagesSentToday: 0,
            contactLastMessageTimes: new Map(),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('max_active_exceeded');
    });

    it('should reject when daily message limit per tenant reached', () => {
      const maxDaily = workerConfig.rateLimits.maxMessagesPerDayPerTenant;
      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: 1,
            messagesSentToday: maxDaily, // At limit
            contactLastMessageTimes: new Map(),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('daily_limit_exceeded');
      expect(result.retryAfter).toBeDefined();
      // retryAfter should be tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expect(result.retryAfter?.toDateString()).toBe(tomorrow.toDateString());
    });

    it('should reject when min hours between messages not met', () => {
      const minHours = workerConfig.rateLimits.minHoursBetweenMessagesToSameContact;
      // Last message was 2 hours ago (less than minHours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: 1,
            messagesSentToday: 0,
            contactLastMessageTimes: new Map([['contact-1', twoHoursAgo]]),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('min_hours_not_met');
      expect(result.retryAfter).toBeDefined();

      // retryAfter should be minHours after last message
      const expectedRetry = new Date(
        twoHoursAgo.getTime() + minHours * 60 * 60 * 1000
      );
      expect(result.retryAfter?.getTime()).toBeCloseTo(
        expectedRetry.getTime(),
        -3 // Within 1 second
      );
    });

    it('should allow when min hours between messages has passed', () => {
      const minHours = workerConfig.rateLimits.minHoursBetweenMessagesToSameContact;
      // Last message was minHours + 1 hours ago
      const longAgo = new Date(Date.now() - (minHours + 1) * 60 * 60 * 1000);

      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: 1,
            messagesSentToday: 0,
            contactLastMessageTimes: new Map([['contact-1', longAgo]]),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
        statsMap
      );

      expect(result.allowed).toBe(true);
    });

    it('should allow different contacts even if one was recently messaged', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const statsMap = new Map<string, TenantStats>([
        [
          'tenant-1',
          {
            tenantId: 'tenant-1',
            activeCollections: 1,
            messagesSentToday: 0,
            // contact-1 was messaged recently, but we're checking contact-2
            contactLastMessageTimes: new Map([['contact-1', twoHoursAgo]]),
          },
        ],
      ]);

      const result = checkRateLimits(
        { tenant_id: 'tenant-1', primary_contact_id: 'contact-2' },
        statsMap
      );

      expect(result.allowed).toBe(true);
    });
  });
});
