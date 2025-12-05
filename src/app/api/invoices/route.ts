/**
 * API Route: /api/invoices
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module app/api/invoices/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { createInvoiceSchema } from '@/lib/validations/invoice-schema';
import {
  createInvoice,
  getInvoices,
  createInitialStatusHistory,
} from '@/lib/services/invoice-service';

/**
 * GET /api/invoices
 * Lista todas las facturas del tenant
 *
 * Query params:
 * - includeInactive: boolean - Incluir facturas inactivas (default: false)
 * - companyId: string - Filtrar por empresa específica (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = await getTenantId();

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const companyId = searchParams.get('companyId') || undefined;

    const invoices = await getInvoices(tenantId, { includeInactive, companyId });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Crea una nueva factura
 *
 * @body CreateInvoiceInput (validado con Zod)
 * @returns Invoice creada o error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener tenant_id del JWT
    const tenantId = await getTenantId();

    // 3. Parse y validar body
    const body = await request.json();

    // Convertir strings ISO a Date objects si vienen del cliente
    if (typeof body.issueDate === 'string') {
      body.issueDate = new Date(body.issueDate);
    }
    if (typeof body.dueDate === 'string') {
      body.dueDate = new Date(body.dueDate);
    }

    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Crear factura
    const result = await createInvoice(tenantId, validationResult.data);

    if (!result.success) {
      // Mapear códigos de error a status HTTP
      const statusCode =
        result.error?.code === 'DUPLICATE_INVOICE_NUMBER' ? 409 : 400;
      return NextResponse.json(
        { error: result.error?.message },
        { status: statusCode }
      );
    }

    // 5. Crear registro inicial en status_history
    if (result.invoice?.id) {
      await createInitialStatusHistory(result.invoice.id, tenantId, userId);
    }

    // 6. Retornar factura creada
    return NextResponse.json(result.invoice, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
