/**
 * Critical Invoices Table Component - Top 10 facturas vencidas más urgentes
 * Story 2.8: Dashboard Básico con KPIs
 *
 * @module components/dashboard/critical-invoices-table
 */
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import type { CriticalInvoice } from '@/lib/services/dashboard-service';
import type { InvoiceStatus } from '@/lib/constants/invoice-status-transitions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CriticalInvoicesTableProps {
  invoices: CriticalInvoice[];
}

/**
 * Formatea monto con moneda
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Tabla de top 10 facturas críticas (más vencidas)
 */
export function CriticalInvoicesTable({ invoices }: CriticalInvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturas Críticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay facturas críticas en este momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturas Críticas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top {invoices.length} facturas más vencidas
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Número</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días Vencidos</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Link
                    href={`/companies/${invoice.companyId}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.companyName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </TableCell>
                <TableCell className="text-sm">
                  {format(invoice.dueDate, 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">{invoice.daysOverdue} días</Badge>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge
                    status={invoice.paymentStatus as InvoiceStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
