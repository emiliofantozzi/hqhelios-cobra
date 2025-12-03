/**
 * Invoice Status Badge Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Muestra el estado de una factura con color e icono apropiado.
 */
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pause,
  XCircle,
} from 'lucide-react';
import {
  STATUS_METADATA,
  type InvoiceStatus,
} from '@/lib/constants/invoice-status-transitions';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const ICON_MAP = {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pause,
  XCircle,
};

const COLOR_CLASSES = {
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  green: 'bg-green-100 text-green-800 border-green-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
  red: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * Badge de estado de factura con color e icono
 */
export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const metadata = STATUS_METADATA[status];
  const Icon = ICON_MAP[metadata.icon];

  return (
    <Badge variant="outline" className={`${COLOR_CLASSES[metadata.color]} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      {metadata.label}
    </Badge>
  );
}
