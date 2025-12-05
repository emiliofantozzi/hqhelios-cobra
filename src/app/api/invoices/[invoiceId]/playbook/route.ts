/**
 * API Route: /api/invoices/[invoiceId]/playbook
 * Story 3.7: Control Manual de Playbook Activo
 *
 * @module app/api/invoices/[invoiceId]/playbook/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { playbookActionSchema, invoiceIdSchema } from '@/lib/validations/collection-schema';
import {
  getActiveCollectionForInvoice,
  pauseCollection,
  resumeCollection,
  completeCollection,
} from '@/lib/services/collection-service';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * PATCH /api/invoices/[invoiceId]/playbook
 * Ejecuta una acción manual sobre el playbook activo de una factura
 *
 * Body:
 * - action: 'pause' | 'resume' | 'complete'
 * - note?: string (opcional, max 500 caracteres)
 *
 * Returns:
 * - 200: Acción ejecutada exitosamente
 * - 400: Body inválido
 * - 401: No autorizado
 * - 404: No hay playbook activo para esta factura
 * - 422: Transición de estado inválida
 * - 500: Error interno del servidor
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { invoiceId } = await context.params;

    // Validar invoiceId es UUID válido
    const invoiceIdResult = invoiceIdSchema.safeParse(invoiceId);
    if (!invoiceIdResult.success) {
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      );
    }

    // Parsear y validar body
    const body = await request.json();
    const parseResult = playbookActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Request inválido',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action, note } = parseResult.data;

    // Obtener collection activa
    const activeCollection = await getActiveCollectionForInvoice(tenantId, invoiceId);
    if (!activeCollection) {
      return NextResponse.json(
        {
          code: 'COLLECTION_NOT_FOUND',
          message: 'No hay playbook activo para esta factura',
        },
        { status: 404 }
      );
    }

    // Ejecutar acción según el tipo
    let result;
    switch (action) {
      case 'pause':
        result = await pauseCollection(tenantId, activeCollection.id, userId, note);
        break;
      case 'resume':
        result = await resumeCollection(tenantId, activeCollection.id, userId, note);
        break;
      case 'complete':
        result = await completeCollection(tenantId, activeCollection.id, userId, note);
        break;
    }

    if (!result.success) {
      // Mapear error codes a HTTP status
      const statusMap: Record<string, number> = {
        COLLECTION_NOT_FOUND: 404,
        INVALID_TRANSITION: 422,
        DATABASE_ERROR: 500,
      };

      const statusCode = statusMap[result.error?.code || ''] || 400;

      return NextResponse.json(
        {
          code: result.error?.code,
          message: result.error?.message,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/invoices/[id]/playbook:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
