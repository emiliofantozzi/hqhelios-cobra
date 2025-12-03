/**
 * API Route: /api/invoices/import
 * Story 2.7: Importar Facturas desde CSV
 *
 * POST - Importa facturas masivamente desde CSV
 * GET - Descarga template CSV
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import {
  csvImportSchema,
  validateCSVRows,
  type CSVInvoiceRow,
} from '@/lib/validations/invoice-import-schema';
import { bulkImportInvoices, validateBusinessRules } from '@/lib/services/invoice-service';

/**
 * POST /api/invoices/import
 * Importa facturas masivamente desde CSV
 *
 * @body { rows: CSVInvoiceRow[] } - Filas parseadas del CSV
 * @returns Resultado con count de importadas o errores
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Get tenant
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 3. Parse body
    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Formato inválido: se esperaba array de filas' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay filas para importar' },
        { status: 400 }
      );
    }

    if (rows.length > 1000) {
      return NextResponse.json(
        { error: 'Máximo 1000 facturas por importación' },
        { status: 400 }
      );
    }

    // 4. Validar schema de cada fila
    const schemaValidation = csvImportSchema.safeParse(rows);
    if (!schemaValidation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: schemaValidation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 5. Re-validar filas con nuestra función
    const validatedRows = validateCSVRows(rows);
    const invalidRows = validatedRows.filter((r) => !r.isValid);

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: 'Hay filas con errores de formato',
          invalidRows: invalidRows.map((r) => ({
            rowNumber: r.rowNumber,
            errors: r.errors,
          })),
        },
        { status: 400 }
      );
    }

    // 6. Validar reglas de negocio (company exists, invoice unique)
    const businessErrors = await validateBusinessRules(
      tenantId,
      schemaValidation.data as CSVInvoiceRow[]
    );

    if (businessErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Hay filas con errores de validación',
          invalidRows: businessErrors.map((e) => ({
            rowNumber: e.rowNumber,
            errors: e.errors,
          })),
        },
        { status: 400 }
      );
    }

    // 7. Importar
    const result = await bulkImportInvoices(
      tenantId,
      userId,
      schemaValidation.data as CSVInvoiceRow[]
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error?.message || 'Error al importar',
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // 8. Retornar éxito
    return NextResponse.json(
      {
        message: `${result.importedCount} facturas importadas correctamente`,
        importedCount: result.importedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/import:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/import
 * Descarga template CSV con estructura y ejemplos
 */
export async function GET() {
  const csvContent = `company_tax_id,invoice_number,amount,currency,issue_date,due_date,description
RFC-ABC123,FAC-2025-001,1500.00,USD,2025-01-15,2025-02-15,Servicios de consultoría enero
TAX-XYZ789,INV-001,2750.50,MXN,2025-01-10,2025-02-10,Productos vendidos enero
RFC-DEF456,FAC-2025-002,800.00,EUR,2025-01-20,2025-03-20,`;

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="facturas_template.csv"',
    },
  });
}
