/**
 * API Route: /api/collections/[collectionId]/timeline
 * Story 3.7: Control Manual de Playbook Activo
 *
 * @module app/api/collections/[collectionId]/timeline/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getCollectionTimeline } from '@/lib/services/collection-service';

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

/**
 * GET /api/collections/[collectionId]/timeline
 * Obtiene el timeline de eventos de una collection
 *
 * Returns:
 * - 200: Array de eventos del timeline
 * - 401: No autorizado
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { collectionId } = await context.params;

    const timeline = await getCollectionTimeline(tenantId, collectionId);

    return NextResponse.json(timeline, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/collections/[id]/timeline:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
