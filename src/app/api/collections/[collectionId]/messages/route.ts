/**
 * API Route: /api/collections/[collectionId]/messages
 * Story 4.2: Historial de Mensajes Enviados
 *
 * @module app/api/collections/[collectionId]/messages/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getCollectionMessages } from '@/lib/services/message-service';

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

/**
 * GET /api/collections/[collectionId]/messages
 * Retorna todos los mensajes enviados de una collection.
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
    const messages = await getCollectionMessages(collectionId, tenantId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[API] GET /api/collections/[collectionId]/messages error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
