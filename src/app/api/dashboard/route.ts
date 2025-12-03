/**
 * Dashboard API Route - Endpoint para datos del dashboard
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module app/api/dashboard/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getDashboardData, type DashboardFilters } from '@/lib/services/dashboard-service';

/**
 * GET /api/dashboard
 * Obtiene datos completos del dashboard con filtros opcionales
 *
 * Query params:
 * - companyIds: IDs de empresas separados por coma (opcional)
 * - dateFrom: Fecha inicio ISO (opcional)
 * - dateTo: Fecha fin ISO (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId();

    // Parse query params
    const { searchParams } = request.nextUrl;
    const companyIdsParam = searchParams.get('companyIds');
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const filters: DashboardFilters = {};

    if (companyIdsParam) {
      filters.companyIds = companyIdsParam.split(',');
    }

    if (dateFromParam) {
      filters.dateFrom = new Date(dateFromParam);
    }

    if (dateToParam) {
      filters.dateTo = new Date(dateToParam);
    }

    const data = await getDashboardData(tenantId, filters);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error);

    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
