/**
 * API Routes para gestión de empresas cliente
 *
 * @module app/api/companies
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { companySchema } from '@/lib/validations/company-schema';
import { createCompany, getCompanies, ConflictError } from '@/lib/services/company-service';

/**
 * POST /api/companies - Crear nueva empresa
 *
 * @returns 201 con empresa creada
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 409 si taxId duplicado
 * @returns 500 en error de servidor
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener tenant_id del usuario
    const tenantId = await getTenantId();

    // 3. Validar datos de entrada
    const body = await request.json();
    const result = companySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // 4. Crear empresa
    const company = await createCompany(result.data, tenantId);

    // 5. Retornar empresa creada
    return NextResponse.json(company, { status: 201 });

  } catch (error) {
    // Manejar error de conflicto (taxId duplicado)
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Error genérico de servidor
    console.error('Error in POST /api/companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companies - Listar empresas del tenant
 *
 * @query includeInactive - Si incluir empresas inactivas (default: false)
 * @returns 200 con array de empresas
 * @returns 401 si no autenticado
 * @returns 500 en error de servidor
 */
export async function GET(request: Request) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener tenant_id del usuario
    const tenantId = await getTenantId();

    // 3. Parsear query params
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 4. Obtener empresas del tenant
    const companies = await getCompanies(tenantId, includeInactive);

    // 5. Retornar lista
    return NextResponse.json(companies);

  } catch (error) {
    console.error('Error in GET /api/companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
