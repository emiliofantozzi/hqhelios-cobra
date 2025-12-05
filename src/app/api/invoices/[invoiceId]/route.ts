/**
 * API Route: /api/invoices/[invoiceId]
 * Story 2.6: Gestionar Estados de Facturas
 * Story 3.4.1: Editar Facturas
 *
 * @module app/api/invoices/[invoiceId]/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getInvoiceById, updateInvoice } from '@/lib/services/invoice-service';
import { getActiveCollectionForInvoice } from '@/lib/services/collection-service';
import { editInvoiceSchema } from '@/lib/validations/invoice-schema';
import { NotFoundError } from '@/lib/services/company-service';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * GET /api/invoices/[invoiceId]
 * Obtiene una factura por ID con collection activa si existe
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { invoiceId } = await context.params;

    const invoice = await getInvoiceById(invoiceId, tenantId);

    // Obtener collection activa si existe (Story 3.5)
    const activeCollection = await getActiveCollectionForInvoice(tenantId, invoiceId);

    return NextResponse.json({
      ...invoice,
      activeCollection,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error in GET /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/invoices/[invoiceId]
 * Actualiza una factura (Story 3.4.1)
 *
 * No permite cambiar paymentStatus - usar /api/invoices/[id]/status
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { invoiceId } = await context.params;

    // Parsear y validar body
    const body = await request.json();
    const parseResult = editInvoiceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Datos de factura inválidos',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Actualizar factura
    const result = await updateInvoice(invoiceId, tenantId, parseResult.data);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'INVOICE_NOT_FOUND'
          ? 404
          : result.error?.code === 'DUPLICATE_INVOICE_NUMBER'
            ? 409
            : 400;

      return NextResponse.json({ error: result.error?.message }, { status: statusCode });
    }

    return NextResponse.json(result.invoice);
  } catch (error) {
    console.error('Error in PATCH /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
