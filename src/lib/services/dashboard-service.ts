/**
 * Dashboard Service - Lógica de negocio para KPIs y métricas
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module lib/services/dashboard-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Filtros opcionales para queries de dashboard
 */
export interface DashboardFilters {
  companyIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * KPIs principales del dashboard
 */
export interface DashboardKPIs {
  pendingInvoices: number;
  overdueInvoices: number;
  paidThisMonth: number;
  pendingAmount: number;
}

/**
 * Segmento de facturas vencidas
 */
export interface OverdueSegment {
  segment: '0-7' | '8-15' | '16-30' | '30+';
  count: number;
}

/**
 * Factura crítica para tabla
 */
export interface CriticalInvoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  daysOverdue: number;
  paymentStatus: string;
}

/**
 * Obtiene KPIs principales del dashboard
 *
 * @param tenantId - ID del tenant
 * @param filters - Filtros opcionales
 * @returns KPIs calculados
 */
export async function getDashboardKPIs(
  tenantId: string,
  filters: DashboardFilters = {}
): Promise<DashboardKPIs> {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('invoices')
    .select('payment_status, amount, due_date, paid_date, company_id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (filters.companyIds && filters.companyIds.length > 0) {
    query = query.in('company_id', filters.companyIds);
  }

  const { data: invoices, error } = await query;

  if (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw new Error('Error al cargar KPIs');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Determinar rango de fechas para "pagadas este mes"
  let paidDateStart: Date;
  let paidDateEnd: Date;

  if (filters.dateFrom && filters.dateTo) {
    paidDateStart = filters.dateFrom;
    paidDateEnd = filters.dateTo;
  } else {
    paidDateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    paidDateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  let pendingInvoices = 0;
  let overdueInvoices = 0;
  let paidThisMonth = 0;
  let pendingAmount = 0;

  (invoices || []).forEach((invoice) => {
    const dueDate = new Date(invoice.due_date);
    const paidDate = invoice.paid_date ? new Date(invoice.paid_date) : null;

    // Pendientes (pendiente + fecha_confirmada)
    if (['pendiente', 'fecha_confirmada'].includes(invoice.payment_status)) {
      pendingInvoices++;
    }

    // Vencidas (pendiente con due_date < hoy)
    if (invoice.payment_status === 'pendiente' && dueDate < today) {
      overdueInvoices++;
    }

    // Pagadas en rango
    if (
      invoice.payment_status === 'pagada' &&
      paidDate &&
      paidDate >= paidDateStart &&
      paidDate <= paidDateEnd
    ) {
      paidThisMonth++;
    }

    // Monto pendiente (excluye pagada y cancelada)
    if (!['pagada', 'cancelada'].includes(invoice.payment_status)) {
      pendingAmount += Number(invoice.amount);
    }
  });

  return {
    pendingInvoices,
    overdueInvoices,
    paidThisMonth,
    pendingAmount,
  };
}

/**
 * Obtiene distribución de facturas vencidas por segmento
 *
 * @param tenantId - ID del tenant
 * @param filters - Filtros opcionales
 * @returns Array de segmentos con counts
 */
export async function getOverdueBySegment(
  tenantId: string,
  filters: DashboardFilters = {}
): Promise<OverdueSegment[]> {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('invoices')
    .select('due_date, company_id')
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'pendiente')
    .eq('is_active', true);

  if (filters.companyIds && filters.companyIds.length > 0) {
    query = query.in('company_id', filters.companyIds);
  }

  const { data: invoices, error } = await query;

  if (error) {
    console.error('Error fetching overdue segments:', error);
    throw new Error('Error al cargar datos de vencidas');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const segments: Record<'0-7' | '8-15' | '16-30' | '30+', number> = {
    '0-7': 0,
    '8-15': 0,
    '16-30': 0,
    '30+': 0,
  };

  (invoices || []).forEach((invoice) => {
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue > 0) {
      if (daysOverdue <= 7) segments['0-7']++;
      else if (daysOverdue <= 15) segments['8-15']++;
      else if (daysOverdue <= 30) segments['16-30']++;
      else segments['30+']++;
    }
  });

  return [
    { segment: '0-7', count: segments['0-7'] },
    { segment: '8-15', count: segments['8-15'] },
    { segment: '16-30', count: segments['16-30'] },
    { segment: '30+', count: segments['30+'] },
  ];
}

/**
 * Obtiene top 10 facturas más críticas (mayor antigüedad vencida)
 *
 * @param tenantId - ID del tenant
 * @param filters - Filtros opcionales
 * @returns Array de facturas críticas ordenadas DESC por días vencidos
 */
export async function getCriticalInvoices(
  tenantId: string,
  filters: DashboardFilters = {}
): Promise<CriticalInvoice[]> {
  const supabase = await getSupabaseClient(tenantId);

  const todayStr = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      amount,
      currency,
      due_date,
      payment_status,
      companies:company_id(id, name)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'pendiente')
    .eq('is_active', true)
    .lt('due_date', todayStr)
    .order('due_date', { ascending: true })
    .limit(10);

  if (filters.companyIds && filters.companyIds.length > 0) {
    query = query.in('company_id', filters.companyIds);
  }

  const { data: invoices, error } = await query;

  if (error) {
    console.error('Error fetching critical invoices:', error);
    throw new Error('Error al cargar facturas críticas');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (invoices || []).map((invoice) => {
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // El join devuelve un objeto, no un array
    const company = invoice.companies as unknown as { id: string; name: string } | null;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      companyName: company?.name || 'Desconocida',
      companyId: company?.id || '',
      amount: Number(invoice.amount),
      currency: invoice.currency,
      dueDate,
      daysOverdue,
      paymentStatus: invoice.payment_status,
    };
  });
}

/**
 * Obtiene todos los datos del dashboard en una llamada
 *
 * @param tenantId - ID del tenant
 * @param filters - Filtros opcionales
 * @returns Objeto con KPIs, chart data, y tabla críticas
 */
export async function getDashboardData(
  tenantId: string,
  filters: DashboardFilters = {}
) {
  const [kpis, overdueSegments, criticalInvoices] = await Promise.all([
    getDashboardKPIs(tenantId, filters),
    getOverdueBySegment(tenantId, filters),
    getCriticalInvoices(tenantId, filters),
  ]);

  return {
    kpis,
    overdueSegments,
    criticalInvoices,
  };
}
