/**
 * API Routes para empresa específica
 *
 * @module app/api/companies/[id]
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { companySchema } from '@/lib/validations/company-schema';
import {
  getCompanyById,
  updateCompany,
  deactivateCompany,
  NotFoundError,
  ConflictError,
} from '@/lib/services/company-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/companies/[id] - Obtener empresa por ID
 *
 * @returns 200 con empresa
 * @returns 401 si no autenticado
 * @returns 404 si empresa no existe
 * @returns 500 en error de servidor
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id } = await params;
    const company = await getCompanyById(id, tenantId);

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in GET /api/companies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/companies/[id] - Actualizar empresa
 *
 * Soporta:
 * - Actualización completa con todos los campos
 * - Soft delete con { is_active: false }
 *
 * @returns 200 con empresa actualizada
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 404 si empresa no existe
 * @returns 409 si taxId duplicado
 * @returns 500 en error de servidor
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id } = await params;
    const body = await request.json();

    // Caso especial: soft delete
    if (body.is_active === false && Object.keys(body).length === 1) {
      const company = await deactivateCompany(id, tenantId);
      return NextResponse.json(company);
    }

    // Actualización normal: validar con Zod
    const result = companySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const company = await updateCompany(id, result.data, tenantId);
    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error in PATCH /api/companies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
