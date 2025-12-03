/**
 * API Route: /api/invoices/[invoiceId]/status
 * Story 2.6: Gestionar Estados de Facturas
 *
 * @module app/api/invoices/[invoiceId]/status/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { invoiceStatusTransitionSchema } from '@/lib/validations/invoice-status-schema';
import { updateInvoiceStatus } from '@/lib/services/invoice-service';

interface RouteContext {
  params: Promise<{
    invoiceId: string;
  }>;
}

/**
 * PATCH /api/invoices/[invoiceId]/status
 * Actualiza el estado de una factura
 *
 * @security Requiere JWT válido con tenant_id
 * @body InvoiceStatusTransition (validado con Zod discriminated union)
 * @returns Factura actualizada o error
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // 1. Obtener tenant_id y user_id del JWT
    const tenantId = await getTenantId();
    const { userId } = await auth();

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener invoiceId de los params
    const { invoiceId } = await context.params;

    // 3. Parse y validar body
    const body = await request.json();

    // Convertir strings ISO a Date objects si vienen del cliente
    if (body.paidDate && typeof body.paidDate === 'string') {
      body.paidDate = new Date(body.paidDate);
    }
    if (body.confirmedPaymentDate && typeof body.confirmedPaymentDate === 'string') {
      body.confirmedPaymentDate = new Date(body.confirmedPaymentDate);
    }

    const validationResult = invoiceStatusTransitionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Actualizar estado
    const result = await updateInvoiceStatus(invoiceId, tenantId, userId, validationResult.data);

    if (!result.success) {
      // Mapear códigos de error a status HTTP
      const statusCode = result.error?.code === 'INVALID_TRANSITION' ? 422 : 400;
      return NextResponse.json({ error: result.error?.message }, { status: statusCode });
    }

    // 5. Retornar factura actualizada
    return NextResponse.json(result.invoice, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/invoices/[id]/status:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
