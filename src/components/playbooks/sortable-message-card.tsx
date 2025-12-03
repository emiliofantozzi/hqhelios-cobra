'use client';

/**
 * Card de mensaje con soporte para drag & drop.
 *
 * @module components/playbooks/sortable-message-card
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Eye, Mail, MessageSquare } from 'lucide-react';
import { CHANNEL_LABELS, TEMPERATURE_LABELS } from '@/lib/validations/playbook-schema';

/**
 * Tipo de mensaje para el card
 */
export interface PlaybookMessageItem {
  id: string;
  sequence_order: number;
  channel: 'email' | 'whatsapp';
  temperature: 'amigable' | 'firme' | 'urgente';
  subject_template: string | null;
  body_template: string;
  wait_days: number;
  send_only_if_no_response: boolean;
}

interface SortableMessageCardProps {
  message: PlaybookMessageItem;
  onEdit?: (message: PlaybookMessageItem) => void;
  onDelete?: (messageId: string) => void;
  onPreview?: (message: PlaybookMessageItem) => void;
}

/**
 * Obtiene el color del badge según la temperatura
 */
function getTemperatureVariant(
  temp: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (temp) {
    case 'amigable':
      return 'secondary';
    case 'firme':
      return 'default';
    case 'urgente':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Card de mensaje con drag handle y acciones.
 */
export function SortableMessageCard({
  message,
  onEdit,
  onDelete,
  onPreview,
}: SortableMessageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Truncar body para preview
  const bodyPreview =
    message.body_template.length > 100
      ? message.body_template.substring(0, 100) + '...'
      : message.body_template;

  const ChannelIcon = message.channel === 'email' ? Mail : MessageSquare;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            type="button"
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Sequence Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
            {message.sequence_order}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            {/* Header with badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <ChannelIcon className="h-3 w-3" />
                {CHANNEL_LABELS[message.channel]}
              </Badge>
              <Badge variant={getTemperatureVariant(message.temperature)}>
                {TEMPERATURE_LABELS[message.temperature]}
              </Badge>
              {message.wait_days > 0 && (
                <Badge variant="outline">+{message.wait_days} días</Badge>
              )}
              {message.send_only_if_no_response && (
                <Badge variant="outline" className="text-xs">
                  Solo sin respuesta
                </Badge>
              )}
            </div>

            {/* Subject (email only) */}
            {message.channel === 'email' && message.subject_template && (
              <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                {message.subject_template}
              </div>
            )}

            {/* Body preview */}
            <div className="text-sm text-gray-500 line-clamp-2">{bodyPreview}</div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {onPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPreview(message)}
                title="Vista previa"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(message)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
