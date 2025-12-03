/**
 * API Route: /api/invoices/[invoiceId]
 * Story 2.6: Gestionar Estados de Facturas
 *
 * @module app/api/invoices/[invoiceId]/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getInvoiceById } from '@/lib/services/invoice-service';
import { NotFoundError } from '@/lib/services/company-service';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * GET /api/invoices/[invoiceId]
 * Obtiene una factura por ID
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
    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error in GET /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
