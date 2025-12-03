/**
 * Dashboard Page - Página principal con KPIs y métricas
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module app/dashboard/page
 */
import { redirect } from 'next/navigation';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';

import { getTenantId, getCurrentUser } from '@/lib/auth/get-tenant-id';
import { getDashboardData } from '@/lib/services/dashboard-service';
import { KPICard } from '@/components/dashboard/kpi-card';
import { OverdueChart } from '@/components/dashboard/overdue-chart';
import { CriticalInvoicesTable } from '@/components/dashboard/critical-invoices-table';

/**
 * Formatea monto con moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function DashboardPage() {
  let tenantId: string;
  try {
    tenantId = await getTenantId();
  } catch {
    redirect('/sign-in');
  }

  // Get user for welcome message
  let userName = '';
  try {
    const user = await getCurrentUser();
    userName = user?.first_name || '';
  } catch {
    // Silently ignore - user might still be provisioning
  }

  // Fetch dashboard data
  let dashboardData;
  let dashboardError: string | null = null;
  try {
    dashboardData = await getDashboardData(tenantId);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    dashboardError = 'Error al cargar datos del dashboard';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-gray-600 mt-1">Panel de control de cobranzas</p>
      </div>

      {/* Error state */}
      {dashboardError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{dashboardError}</p>
        </div>
      )}

      {/* Dashboard content */}
      {dashboardData && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Facturas Pendientes"
              value={dashboardData.kpis.pendingInvoices}
              icon={Clock}
              iconColor="text-yellow-600"
              description="Pendiente + Fecha Confirmada"
            />
            <KPICard
              title="Facturas Vencidas"
              value={dashboardData.kpis.overdueInvoices}
              icon={AlertCircle}
              iconColor="text-red-600"
              description="Vencidas sin pagar"
            />
            <KPICard
              title="Pagadas Este Mes"
              value={dashboardData.kpis.paidThisMonth}
              icon={CheckCircle}
              iconColor="text-green-600"
              description="Mes actual"
            />
            <KPICard
              title="Monto Pendiente"
              value={formatCurrency(dashboardData.kpis.pendingAmount)}
              icon={DollarSign}
              iconColor="text-blue-600"
              description="Total sin cobrar"
            />
          </div>

          {/* Charts and Table */}
          <div className="grid gap-6 lg:grid-cols-2">
            <OverdueChart data={dashboardData.overdueSegments} />
            <CriticalInvoicesTable invoices={dashboardData.criticalInvoices} />
          </div>
        </>
      )}

      {/* Empty state - only shown if no data and no error */}
      {!dashboardData && !dashboardError && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Comienza agregando facturas
          </h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Para ver las métricas del dashboard, primero agrega empresas y sus
            facturas al sistema.
          </p>
        </div>
      )}
    </div>
  );
}
