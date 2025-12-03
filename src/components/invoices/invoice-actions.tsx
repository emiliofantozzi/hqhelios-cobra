/**
 * Invoice Actions Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Dropdown con acciones de cambio de estado según transiciones permitidas.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Calendar,
  AlertTriangle,
  Pause,
  XCircle,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import {
  INVOICE_STATUS,
  ALLOWED_TRANSITIONS,
  type InvoiceStatus,
} from '@/lib/constants/invoice-status-transitions';
import { MarkAsPaidDialog } from './mark-as-paid-dialog';
import { ConfirmPaymentDateDialog } from './confirm-payment-date-dialog';
import { EscalateDialog } from './escalate-dialog';
import { SuspendDialog } from './suspend-dialog';
import { CancelDialog } from './cancel-dialog';

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  issueDate: Date;
}

/**
 * Botones de acciones de estado según estado actual
 * Renderiza solo transiciones permitidas por state machine
 */
export function InvoiceActions({ invoiceId, currentStatus, issueDate }: InvoiceActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showMarkAsPaid, setShowMarkAsPaid] = useState(false);
  const [showConfirmDate, setShowConfirmDate] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];

  // Si está pagada o cancelada, no mostrar acciones
  if (currentStatus === INVOICE_STATUS.PAGADA || currentStatus === INVOICE_STATUS.CANCELADA) {
    return (
      <div className="text-sm text-muted-foreground">
        No se permiten cambios de estado para facturas{' '}
        {currentStatus === INVOICE_STATUS.PAGADA ? 'pagadas' : 'canceladas'}
      </div>
    );
  }

  // Handler para reactivar
  async function handleReactivate() {
    setIsReactivating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: INVOICE_STATUS.PENDIENTE,
          note: 'Factura reactivada',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate');
      }

      toast({
        title: 'Factura reactivada',
        description: 'La factura volvió a estado pendiente',
      });

      router.refresh();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo reactivar la factura',
        variant: 'destructive',
      });
    } finally {
      setIsReactivating(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Cambiar Estado
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {allowedTransitions.includes(INVOICE_STATUS.PAGADA) && (
            <DropdownMenuItem onClick={() => setShowMarkAsPaid(true)}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Marcar como Pagada
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.FECHA_CONFIRMADA) && (
            <DropdownMenuItem onClick={() => setShowConfirmDate(true)}>
              <Calendar className="mr-2 h-4 w-4 text-blue-600" />
              Confirmar Fecha de Pago
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.ESCALADA) && (
            <DropdownMenuItem onClick={() => setShowEscalate(true)}>
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
              Escalar Factura
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.SUSPENDIDA) && (
            <DropdownMenuItem onClick={() => setShowSuspend(true)}>
              <Pause className="mr-2 h-4 w-4 text-gray-600" />
              Suspender
            </DropdownMenuItem>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.PENDIENTE) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReactivate} disabled={isReactivating}>
                <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                {isReactivating ? 'Reactivando...' : 'Reactivar'}
              </DropdownMenuItem>
            </>
          )}

          {allowedTransitions.includes(INVOICE_STATUS.CANCELADA) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCancel(true)}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Factura
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <MarkAsPaidDialog
        open={showMarkAsPaid}
        onOpenChange={setShowMarkAsPaid}
        invoiceId={invoiceId}
        issueDate={issueDate}
      />
      <ConfirmPaymentDateDialog
        open={showConfirmDate}
        onOpenChange={setShowConfirmDate}
        invoiceId={invoiceId}
      />
      <EscalateDialog
        open={showEscalate}
        onOpenChange={setShowEscalate}
        invoiceId={invoiceId}
      />
      <SuspendDialog open={showSuspend} onOpenChange={setShowSuspend} invoiceId={invoiceId} />
      <CancelDialog open={showCancel} onOpenChange={setShowCancel} invoiceId={invoiceId} />
    </>
  );
}
