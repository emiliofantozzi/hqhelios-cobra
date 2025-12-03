'use client';

/**
 * Página de lista de empresas cliente con DataTable
 *
 * @module app/(dashboard)/companies
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CompaniesTable, type CompanyRow } from '@/components/tables/companies-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import { exportCompaniesToCSV } from '@/lib/exports/export-companies';

/**
 * Componente de estado vacío
 */
function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg border">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        No hay empresas registradas
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comienza agregando tu primera empresa cliente.
      </p>
      <div className="mt-6">
        <Link href="/companies/new">
          <Button>Nueva Empresa</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Componente de loading
 */
function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-2 text-sm text-gray-500">Cargando empresas...</p>
    </div>
  );
}

/**
 * Página principal de empresas con DataTable
 */
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Cargar empresas
  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/companies?includeInactive=${showInactive}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, [showInactive]);

  // Handler para desactivar empresa
  const handleDeactivate = async (companyId: string) => {
    if (!confirm('¿Desactivar esta empresa? Ya no aparecerá en la lista por defecto.')) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });

      if (res.ok) {
        // Recargar lista
        const refreshRes = await fetch(`/api/companies?includeInactive=${showInactive}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setCompanies(data);
        }
      }
    } catch (error) {
      console.error('Error deactivating company:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas Cliente</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las empresas cliente de tu cartera
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportCompaniesToCSV(companies as any)}
              disabled={companies.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Link href="/companies/new">
              <Button>Nueva Empresa</Button>
            </Link>
          </div>
        </div>

        {/* Filtro de inactivos */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked as boolean)}
          />
          <label htmlFor="show-inactive" className="text-sm cursor-pointer">
            Mostrar empresas inactivas
          </label>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <LoadingState />
        ) : companies.length === 0 && !showInactive ? (
          <EmptyState />
        ) : (
          <CompaniesTable data={companies} onDeactivate={handleDeactivate} />
        )}
      </div>
    </div>
  );
}
