/**
 * Invoice Status History Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Timeline de cambios de estado de una factura.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

import {
  STATUS_METADATA,
  type InvoiceStatus,
} from '@/lib/constants/invoice-status-transitions';
import { InvoiceStatusBadge } from './invoice-status-badge';

interface StatusHistoryMetadata {
  payment_reference?: string;
  paid_date?: string;
  confirmed_payment_date?: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
  note: string | null;
  metadata: StatusHistoryMetadata | null;
}

interface InvoiceStatusHistoryProps {
  history: StatusHistoryEntry[];
}

/**
 * Timeline de cambios de estado
 * Muestra entradas ordenadas DESC (más reciente primero)
 */
export function InvoiceStatusHistory({ history }: InvoiceStatusHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No hay historial de cambios de estado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div
          key={entry.id}
          className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
        >
          {/* Dot indicator */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300" />

          {/* Content */}
          <div className="bg-gray-50 rounded-lg p-3">
            {/* Header: Fecha y transición */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                {format(new Date(entry.changed_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                  locale: es,
                })}
              </span>

              {/* Transición */}
              <div className="flex items-center gap-2">
                {entry.old_status ? (
                  <>
                    <InvoiceStatusBadge status={entry.old_status as InvoiceStatus} />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground mr-2">Creación</span>
                )}
                <InvoiceStatusBadge status={entry.new_status as InvoiceStatus} />
              </div>
            </div>

            {/* Nota si existe */}
            {entry.note && (
              <p className="mt-2 text-sm text-gray-700 bg-white rounded p-2 border">
                {entry.note}
              </p>
            )}

            {/* Metadata adicional */}
            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {entry.metadata.payment_reference && (
                  <span>Ref. pago: {String(entry.metadata.payment_reference)}</span>
                )}
                {entry.metadata.paid_date && (
                  <span className="ml-3">
                    Fecha pago: {String(entry.metadata.paid_date)}
                  </span>
                )}
                {entry.metadata.confirmed_payment_date && (
                  <span>
                    Fecha confirmada: {String(entry.metadata.confirmed_payment_date)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
