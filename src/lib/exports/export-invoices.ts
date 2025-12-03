/**
 * Export handler para facturas
 * Story 2.9: Exportar Datos a CSV
 *
 * @module lib/exports/export-invoices
 */
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';

/**
 * Invoice data structure for export
 */
interface InvoiceExport {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_status: string;
  description?: string | null;
  created_at?: string;
  companies?: {
    name: string;
  };
}

/**
 * Exports invoices to CSV
 *
 * Columns exported:
 * - Número de Factura
 * - Empresa
 * - Monto
 * - Moneda
 * - Fecha de Emisión
 * - Fecha de Vencimiento
 * - Estado
 * - Descripción
 * - Fecha de Creación
 *
 * @param invoices - Array of invoices to export
 */
export function exportInvoicesToCSV(invoices: InvoiceExport[]): void {
  exportToCSV({
    data: invoices,
    filename: 'facturas',
    columns: [
      {
        header: 'Número de Factura',
        accessor: (i) => i.invoice_number,
      },
      {
        header: 'Empresa',
        accessor: (i) => i.companies?.name || '',
      },
      {
        header: 'Monto',
        accessor: (i) => i.amount.toFixed(2),
      },
      {
        header: 'Moneda',
        accessor: (i) => i.currency,
      },
      {
        header: 'Fecha de Emisión',
        accessor: (i) => format(new Date(i.issue_date), 'yyyy-MM-dd'),
      },
      {
        header: 'Fecha de Vencimiento',
        accessor: (i) => format(new Date(i.due_date), 'yyyy-MM-dd'),
      },
      {
        header: 'Estado',
        accessor: (i) => i.payment_status,
      },
      {
        header: 'Descripción',
        accessor: (i) => i.description || '',
      },
      {
        header: 'Fecha de Creación',
        accessor: (i) => i.created_at ? format(new Date(i.created_at), 'yyyy-MM-dd') : '',
      },
    ],
  });
}
