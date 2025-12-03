'use client';

/**
 * Pagina de lista de facturas
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module app/(dashboard)/invoices/page
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface Invoice {
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
 * Badge para estado de pago
 */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    fecha_confirmada: 'bg-blue-100 text-blue-800',
    pagada: 'bg-green-100 text-green-800',
    escalada: 'bg-red-100 text-red-800',
    suspendida: 'bg-gray-100 text-gray-800',
    cancelada: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

/**
 * Pagina principal de facturas
 */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
          <Link href="/invoices/new">
            <Button>Nueva Factura</Button>
          </Link>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <LoadingState />
        ) : invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.companies?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.currency}{' '}
                        {Number(invoice.amount).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(invoice.due_date), 'dd MMM yyyy', {
                          locale: es,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
