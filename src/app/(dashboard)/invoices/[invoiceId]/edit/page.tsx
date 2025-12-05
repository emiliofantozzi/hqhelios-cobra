'use client';

/**
 * Página de edición de factura
 * Story 3.4.1: Editar Facturas
 *
 * @module app/(dashboard)/invoices/[invoiceId]/edit
 */
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { InvoiceForm } from '@/components/forms/invoice-form';

interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_terms_days: number;
  payment_status: string;
  projected_payment_date?: string | null;
  description?: string | null;
  notes?: string | null;
  companies: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

/**
 * Página de edición de factura
 */
export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch invoice y companies en paralelo
        const [invoiceRes, companiesRes] = await Promise.all([
          fetch(`/api/invoices/${invoiceId}`),
          fetch('/api/companies?activeOnly=true'),
        ]);

        if (!invoiceRes.ok) {
          if (invoiceRes.status === 404) {
            setError('Factura no encontrada');
          } else {
            setError('Error al cargar la factura');
          }
          return;
        }

        const invoiceData = await invoiceRes.json();
        setInvoice(invoiceData);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">{error || 'Error'}</h2>
          <Link href="/invoices" className="text-blue-600 hover:underline mt-4 inline-block">
            Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  // Preparar datos iniciales para el formulario
  const initialData = {
    companyId: invoice.company_id,
    invoiceNumber: invoice.invoice_number,
    amount: Number(invoice.amount),
    currency: invoice.currency,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    paymentTermsDays: invoice.payment_terms_days,
    paymentStatus: invoice.payment_status,
    projectedPaymentDate: invoice.projected_payment_date,
    description: invoice.description,
    notes: invoice.notes,
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
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
        <Link href={`/invoices/${invoiceId}`} className="hover:text-blue-600">
          {invoice.invoice_number}
        </Link>
        {' / '}
        <span className="text-gray-900">Editar</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Editar Factura</h1>
        <p className="text-gray-600 mt-1">
          Modifica los datos de la factura {invoice.invoice_number}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <InvoiceForm
          mode="edit"
          invoiceId={invoiceId}
          initialData={initialData}
          companies={companies}
        />
      </div>
    </div>
  );
}
