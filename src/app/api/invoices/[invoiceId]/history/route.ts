/**
 * API Route: /api/invoices/[invoiceId]/history
 * Story 2.6: Gestionar Estados de Facturas
 *
 * @module app/api/invoices/[invoiceId]/history/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getInvoiceStatusHistory } from '@/lib/services/invoice-service';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * GET /api/invoices/[invoiceId]/history
 * Obtiene el historial de cambios de estado de una factura
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { invoiceId } = await context.params;

    const history = await getInvoiceStatusHistory(invoiceId, tenantId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]/history:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
