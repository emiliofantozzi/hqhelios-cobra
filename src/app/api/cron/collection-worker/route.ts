/**
 * Collection Worker Cron Endpoint
 *
 * GET /api/cron/collection-worker
 *
 * Vercel Cron endpoint that processes active collections.
 * Runs every 5 minutes (configured in vercel.json).
 * Protected by CRON_SECRET header validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processCollections } from '@/lib/workers/collection-worker';

/**
 * Handles GET requests from Vercel Cron.
 * Verifies the cron secret and runs the collection worker.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header to cron requests)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET environment variable not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized request to collection-worker');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting collection worker...');
    const startTime = Date.now();

    const result = await processCollections();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms:`, result);

    // If lock was held, return 200 so Vercel doesn't retry
    if (result.lockHeld) {
      return NextResponse.json(
        {
          status: 'lock_held',
          message: 'Another worker instance is running',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'success',
      processed: result.processed,
      skipped: result.skipped,
      errors: result.errors,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Cron] Worker failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Required for Vercel Cron - prevents caching
export const dynamic = 'force-dynamic';

// Maximum execution time (5 minutes - Vercel limit for Pro plan)
export const maxDuration = 300;
