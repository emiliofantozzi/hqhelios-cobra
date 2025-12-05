/**
 * Página de detalle de factura
 * Story 2.6: Gestionar Estados de Facturas
 *
 * @module app/(dashboard)/invoices/[invoiceId]
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { PlaybookStatusBadge } from '@/components/invoices/playbook-status-badge';
import { InvoiceActions } from '@/components/invoices/invoice-actions';
import { ActivatePlaybookButton } from '@/components/invoices/activate-playbook-button';
import { InvoiceStatusHistory } from '@/components/invoices/invoice-status-history';
import type { InvoiceStatus } from '@/lib/constants/invoice-status-transitions';

interface ActiveCollection {
  id: string;
  status: 'active' | 'paused' | 'awaiting_response' | 'pending_review';
  playbook: {
    id: string;
    name: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  confirmed_payment_date: string | null;
  paid_date: string | null;
  payment_status: string;
  payment_reference: string | null;
  description: string | null;
  notes: string | null;
  is_active: boolean;
  companies: {
    id: string;
    name: string;
    tax_id: string;
  };
  activeCollection?: ActiveCollection | null;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Factura no encontrada');
        } else {
          setError('Error al cargar factura');
        }
        return;
      }
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Error de conexión');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await fetchInvoice();
      await fetchHistory();
      setIsLoading(false);
    }
    loadData();
  }, [invoiceId]);

  // Refresh on navigation (when dialogs close and call router.refresh())
  useEffect(() => {
    const handleFocus = () => {
      fetchInvoice();
      fetchHistory();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">{error || 'Error'}</h2>
          <Link href="/invoices" className="text-blue-600 hover:underline mt-4 inline-block">
            Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        {' / '}
        <Link href="/invoices" className="hover:text-blue-600">
          Facturas
        </Link>
        {' / '}
        <span className="text-gray-900">{invoice.invoice_number}</span>
      </nav>

      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <InvoiceStatusBadge status={invoice.payment_status as InvoiceStatus} />
            {invoice.activeCollection && (
              <PlaybookStatusBadge
                status={invoice.activeCollection.status}
                playbookName={invoice.activeCollection.playbook.name}
              />
            )}
          </div>
          <p className="text-gray-500 mt-1">
            <Link
              href={`/companies/${invoice.companies.id}`}
              className="hover:text-blue-600 hover:underline"
            >
              {invoice.companies.name}
            </Link>
            {' - '}
            {invoice.companies.tax_id}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <ActivatePlaybookButton
            invoiceId={invoice.id}
            companyId={invoice.companies.id}
            currentStatus={invoice.payment_status}
            hasActiveCollection={!!invoice.activeCollection}
          />
          <InvoiceActions
            invoiceId={invoice.id}
            currentStatus={invoice.payment_status as InvoiceStatus}
            issueDate={new Date(invoice.issue_date)}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Info */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Información Financiera</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Monto</label>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Moneda</label>
                <p className="mt-1">{invoice.currency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
                <p className="mt-1">
                  {format(new Date(invoice.issue_date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
                <p className="mt-1">
                  {format(new Date(invoice.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              {invoice.confirmed_payment_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha Confirmada de Pago</label>
                  <p className="mt-1">
                    {format(new Date(invoice.confirmed_payment_date), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              )}
              {invoice.paid_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Pago</label>
                  <p className="mt-1">
                    {format(new Date(invoice.paid_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              )}
              {invoice.payment_reference && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Referencia de Pago</label>
                  <p className="mt-1 font-mono">{invoice.payment_reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {(invoice.description || invoice.notes) && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Detalles</h2>
              {invoice.description && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="mt-1">{invoice.description}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notas Internas</label>
                  <p className="mt-1 text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Status History */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Historial de Estados</h2>
            <InvoiceStatusHistory history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
