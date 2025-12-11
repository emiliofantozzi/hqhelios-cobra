/**
 * API Route: /api/collections
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * Lista todas las collections del tenant con filtros opcionales.
 *
 * @module app/api/collections/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { listCollections } from '@/lib/services/collection-service';

/**
 * GET /api/collections?status=active&companyId=...
 * Retorna todas las collections del tenant.
 * Requiere autenticación y verifica acceso por tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();

    // Obtener filtros de query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const companyId = searchParams.get('companyId') || undefined;

    const collections = await listCollections(tenantId, { status, companyId });

    return NextResponse.json(collections);
  } catch (error) {
    console.error('[API] GET /api/collections error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
