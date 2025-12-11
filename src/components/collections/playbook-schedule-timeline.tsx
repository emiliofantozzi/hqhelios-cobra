'use client';

/**
 * Timeline del cronograma de playbook
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * Muestra todos los mensajes de un playbook activo:
 * - Enviados (verde) - con fecha real y estado de entrega
 * - Programado (azul) - próximo mensaje con fecha de next_action_at
 * - Pendientes (gris) - fechas calculadas aproximadas
 */
import { Mail, MessageSquare, CheckCircle, Clock, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CollectionSchedule, ScheduledMessage } from '@/lib/services/collection-schedule-service';

interface PlaybookScheduleTimelineProps {
  schedule: CollectionSchedule;
}

/**
 * Configuración visual por estado del mensaje
 */
const STATUS_CONFIG = {
  sent: {
    icon: CheckCircle,
    label: 'Enviado',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  scheduled: {
    icon: Clock,
    label: 'Programado',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  pending: {
    icon: Circle,
    label: 'Pendiente',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

/**
 * Badge de delivery status para mensajes enviados
 */
function DeliveryStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    pending: { className: 'bg-gray-100 text-gray-700', label: 'Pendiente' },
    sent: { className: 'bg-blue-100 text-blue-700', label: 'Enviado' },
    delivered: { className: 'bg-green-100 text-green-700', label: 'Entregado' },
    bounced: { className: 'bg-orange-100 text-orange-700', label: 'Rebotado' },
    failed: { className: 'bg-red-100 text-red-700', label: 'Fallido' },
  };

  const config = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status };

  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Icono del canal (email/whatsapp)
 */
function ChannelIcon({ channel }: { channel: 'email' | 'whatsapp' }) {
  if (channel === 'email') {
    return <Mail className="h-4 w-4" />;
  }
  return <MessageSquare className="h-4 w-4" />;
}

/**
 * Formatea fecha para display
 */
function formatDate(dateStr: string, approximate: boolean = false) {
  const date = new Date(dateStr);
  const formatted = format(date, "d MMM yyyy, HH:mm", { locale: es });
  return approximate ? `~${formatted}` : formatted;
}

/**
 * Item individual del timeline
 */
function TimelineItem({ message, isLast }: { message: ScheduledMessage; isLast: boolean }) {
  const config = STATUS_CONFIG[message.status];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Línea vertical de conexión */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icono de estado */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
          config.iconColor,
          config.borderColor
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Contenido */}
      <div className={cn('flex-1 pb-6 pt-0.5', isLast && 'pb-0')}>
        <div
          className={cn(
            'rounded-lg border p-3',
            config.bgColor,
            config.borderColor
          )}
        >
          {/* Header: canal + número + estado */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={message.channel} />
              <span className="text-sm font-medium">
                Mensaje {message.sequenceOrder}
              </span>
              <Badge variant="outline" className="text-xs capitalize">
                {message.channel}
              </Badge>
            </div>
            <Badge
              variant={message.status === 'scheduled' ? 'default' : 'outline'}
              className={cn(
                'text-xs',
                message.status === 'sent' && 'bg-green-100 text-green-700 border-green-200',
                message.status === 'pending' && 'bg-gray-100 text-gray-600 border-gray-200'
              )}
            >
              {config.label}
            </Badge>
          </div>

          {/* Subject (si existe) */}
          {message.subjectTemplate && (
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {message.subjectTemplate}
            </p>
          )}

          {/* Fecha y delivery status */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {message.status === 'sent' ? (
              <>
                <span className="text-muted-foreground">
                  {message.sentAt && formatDate(message.sentAt)}
                </span>
                {message.deliveryStatus && (
                  <DeliveryStatusBadge status={message.deliveryStatus} />
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                {message.scheduledAt && formatDate(message.scheduledAt, message.status === 'pending')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline completo del playbook
 */
export function PlaybookScheduleTimeline({ schedule }: PlaybookScheduleTimelineProps) {
  const startedDate = format(new Date(schedule.startedAt), "d 'de' MMMM yyyy", { locale: es });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{schedule.playbookName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Activo desde {startedDate}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {schedule.messagesSentCount} de {schedule.totalMessages} enviados
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay mensajes configurados en este playbook
          </div>
        ) : (
          <div className="relative">
            {schedule.messages.map((message, index) => (
              <TimelineItem
                key={message.id}
                message={message}
                isLast={index === schedule.messages.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
