/**
 * Distributed Lock using Upstash Redis
 *
 * Provides a simple distributed lock mechanism to prevent
 * multiple worker instances from processing simultaneously.
 * Uses Redis SET NX EX pattern for atomic lock acquisition.
 */

import { Redis } from '@upstash/redis';

/** Redis client instance (lazy initialized) */
let redisClient: Redis | null = null;

/**
 * Gets or creates the Redis client instance.
 * Validates that required environment variables are set.
 *
 * @returns Redis client instance
 * @throws Error if environment variables are not configured
 */
function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Upstash Redis configuration. ' +
        'Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
    );
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

/**
 * Acquires a distributed lock using Redis SET NX EX pattern.
 * The lock is atomic - only one client can hold it at a time.
 *
 * @param lockKey - Unique key for the lock
 * @param ttlSeconds - Time to live in seconds (auto-release)
 * @returns true if lock acquired, false if already held by another process
 *
 * @example
 * ```typescript
 * const acquired = await acquireLock('my-worker-lock', 60);
 * if (!acquired) {
 *   console.log('Another instance is running');
 *   return;
 * }
 * try {
 *   // Do work...
 * } finally {
 *   await releaseLock('my-worker-lock');
 * }
 * ```
 */
export async function acquireLock(
  lockKey: string,
  ttlSeconds: number
): Promise<boolean> {
  const redis = getRedisClient();

  // SET key value NX EX ttl
  // NX = only set if not exists
  // EX = set expiry in seconds
  const result = await redis.set(lockKey, '1', { nx: true, ex: ttlSeconds });

  // Upstash SDK retorna 'OK' si tuvo éxito, null si la key ya existe
  // Algunos SDKs pueden retornar boolean, así que validamos ambos casos
  return result === 'OK' || (result as unknown) === true;
}

/**
 * Releases a distributed lock.
 * Should be called in a finally block to ensure cleanup.
 *
 * @param lockKey - Key of the lock to release
 */
export async function releaseLock(lockKey: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(lockKey);
}

/**
 * Checks if a lock is currently held (for testing/debugging).
 *
 * @param lockKey - Key of the lock to check
 * @returns true if lock exists, false otherwise
 */
export async function isLockHeld(lockKey: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.exists(lockKey);
  return result === 1;
}
