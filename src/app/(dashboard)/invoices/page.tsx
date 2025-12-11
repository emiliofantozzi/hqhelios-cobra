'use client';

/**
 * Pagina de lista de facturas
 * Story 2.5: Crear Facturas Manualmente
 * Story 2.6: Gestionar Estados de Facturas
 * Story 3.4.1: UI Consistency - Tabla con TanStack Table
 *
 * @module app/(dashboard)/invoices/page
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvoicesTable, type InvoiceRow } from '@/components/tables/invoices-table';
import { Download, Upload } from 'lucide-react';
import { exportInvoicesToCSV } from '@/lib/exports/export-invoices';

interface ApiInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_status: string;
  companies: {
    id: string;
    name: string;
  };
}

/**
 * Componente de estado vacio
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        No hay facturas registradas
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comienza creando tu primera factura.
      </p>
      <div className="mt-6">
        <Link href="/invoices/new">
          <Button>Nueva Factura</Button>
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
      <p className="mt-2 text-sm text-gray-500">Cargando facturas...</p>
    </div>
  );
}

/**
 * Transforma datos de API al formato de InvoicesTable
 */
function transformToTableRows(invoices: ApiInvoice[]): InvoiceRow[] {
  return invoices.map((invoice) => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    amount: invoice.amount,
    currency: invoice.currency,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    payment_status: invoice.payment_status,
    company_id: invoice.companies?.id || '',
    company_name: invoice.companies?.name || 'N/A',
  }));
}

/**
 * Pagina principal de facturas
 */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/invoices');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const tableData = transformToTableRows(invoices);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las facturas de tus clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/invoices/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => exportInvoicesToCSV(invoices as any)}
              disabled={invoices.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Link href="/invoices/new">
              <Button>Nueva Factura</Button>
            </Link>
          </div>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <LoadingState />
        ) : invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <InvoicesTable data={tableData} />
        )}
      </div>
    </div>
  );
}
