/**
 * API Route: /api/collections/[collectionId]/schedule
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * Retorna el cronograma completo de mensajes de una collection,
 * incluyendo mensajes enviados (con datos reales) y pendientes (con fechas calculadas).
 *
 * @module app/api/collections/[collectionId]/schedule/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getCollectionSchedule } from '@/lib/services/collection-schedule-service';

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

/**
 * GET /api/collections/[collectionId]/schedule
 * Retorna el cronograma completo de mensajes de una collection.
 * Requiere autenticación y verifica acceso por tenant.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { collectionId } = await context.params;
    const schedule = await getCollectionSchedule(tenantId, collectionId);

    if (!schedule) {
      return NextResponse.json({ error: 'Collection no encontrada' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('[API] GET /api/collections/[collectionId]/schedule error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
