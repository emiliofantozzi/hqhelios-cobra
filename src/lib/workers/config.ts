/**
 * Worker Configuration
 *
 * Central configuration for the collection worker.
 * All timing, rate limits, and batch settings are defined here.
 */

export const workerConfig = {
  /** Cron schedule expression (every 5 minutes) */
  schedule: '*/5 * * * *',

  /** Maximum collections to process per worker run */
  batchSize: 100,

  /** Maximum execution time in milliseconds (5 minutes - Vercel limit) */
  timeout: 300000,

  /** Redis distributed lock settings */
  lock: {
    /** Lock key name in Redis */
    key: 'collection-worker-lock',
    /** Lock TTL in seconds (auto-release after this time) */
    ttlSeconds: 45,
  },

  /** Rate limiting thresholds */
  rateLimits: {
    /** Maximum active collections per tenant at any time */
    maxActiveCollectionsPerTenant: 5,
    /** Minimum hours between messages to the same contact */
    minHoursBetweenMessagesToSameContact: 4,
    /** Maximum messages per day per tenant */
    maxMessagesPerDayPerTenant: 10,
  },
} as const;

/** Type for worker configuration */
export type WorkerConfig = typeof workerConfig;
