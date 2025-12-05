/**
 * API Route: /api/invoices/[invoiceId]/activate-playbook
 * Story 3.5: Activar Playbook en Factura
 *
 * @module app/api/invoices/[invoiceId]/activate-playbook/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { createCollection } from '@/lib/services/collection-service';
import { activatePlaybookSchema } from '@/lib/validations/collection-schema';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * POST /api/invoices/[invoiceId]/activate-playbook
 * Activa un playbook de cobranza para una factura
 *
 * Body:
 * - playbookId: string (UUID del playbook a activar)
 *
 * Returns:
 * - 201: Collection creada exitosamente
 * - 400: Body inválido
 * - 401: No autorizado
 * - 404: Factura o playbook no encontrado
 * - 409: Ya existe collection activa
 * - 422: Status de factura inválido o sin contacto primario
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { invoiceId } = await context.params;

    // Parsear y validar body
    const body = await request.json();
    const parseResult = activatePlaybookSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'ID de playbook inválido',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Crear collection
    const result = await createCollection(
      tenantId,
      invoiceId,
      parseResult.data.playbookId,
      userId
    );

    if (!result.success) {
      // Mapear error codes a HTTP status
      const statusMap: Record<string, number> = {
        INVOICE_NOT_FOUND: 404,
        PLAYBOOK_NOT_FOUND: 404,
        INVALID_STATUS: 422,
        NO_PRIMARY_CONTACT: 422,
        COLLECTION_EXISTS: 409,
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

    return NextResponse.json(result.collection, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/invoices/[id]/activate-playbook:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
