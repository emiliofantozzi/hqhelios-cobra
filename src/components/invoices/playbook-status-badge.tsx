/**
 * Playbook Status Badge Component
 * Story 3.5: Activar Playbook en Factura
 *
 * Muestra el estado de la collection activa con color e icono apropiado.
 */
import { Badge } from '@/components/ui/badge';
import { Play, Pause, MessageSquare, Clock } from 'lucide-react';

type CollectionStatus = 'active' | 'paused' | 'awaiting_response' | 'pending_review';

interface PlaybookStatusBadgeProps {
  status: CollectionStatus;
  playbookName: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  CollectionStatus,
  { color: string; icon: typeof Play; label: string }
> = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Play,
    label: 'Activo',
  },
  paused: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Pause,
    label: 'Pausado',
  },
  awaiting_response: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: MessageSquare,
    label: 'Esperando respuesta',
  },
  pending_review: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Clock,
    label: 'Pendiente revisión',
  },
};

/**
 * Badge de estado de playbook/collection con color e icono
 */
export function PlaybookStatusBadge({
  status,
  playbookName,
  className,
}: PlaybookStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      Playbook: {playbookName}
    </Badge>
  );
}
