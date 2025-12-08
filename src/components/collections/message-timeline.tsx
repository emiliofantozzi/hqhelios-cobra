'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { MessageDetailDialog } from './message-detail-dialog';
import type { CollectionMessage } from '@/lib/services/message-service';

interface MessageTimelineProps {
  messages: CollectionMessage[];
}

/**
 * Retorna el Badge de shadcn con el color y texto según el estado de entrega.
 * Colores según AC3: pending=gray, sent=blue, delivered=green, bounced=orange, failed=red
 *
 * @param status - Estado de entrega del mensaje
 * @returns Elemento Badge con el estilo apropiado
 */
export function getDeliveryStatusBadge(status: string) {
  const variants: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }
  > = {
    pending: { variant: 'secondary', label: 'Pendiente' },
    sent: { variant: 'default', label: 'Enviado' },
    delivered: { variant: 'outline', label: 'Entregado', className: 'border-green-500 text-green-700 bg-green-50' },
    bounced: { variant: 'outline', label: 'Rebotado', className: 'border-orange-500 text-orange-700 bg-orange-50' },
    failed: { variant: 'destructive', label: 'Fallido' },
  };

  const config = variants[status] || { variant: 'outline' as const, label: status };

  return (
    <Badge variant={config.variant} className={`shrink-0 ${config.className || ''}`}>
      {config.label}
    </Badge>
  );
}

/**
 * Timeline vertical de mensajes enviados en una collection.
 * Muestra fecha, canal, subject, preview y estado de entrega.
 *
 * @param messages - Array de mensajes a mostrar
 */
export function MessageTimeline({ messages }: MessageTimelineProps) {
  const [selectedMessage, setSelectedMessage] = useState<CollectionMessage | null>(null);

  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay mensajes enviados
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <Button
              variant="ghost"
              className="w-full justify-start p-4 h-auto"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex gap-4 w-full text-left">
                {/* Icono de canal */}
                <div className="flex-shrink-0 pt-1">
                  {message.channel === 'email' && (
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {/* Fecha y estado */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">
                      {message.sentAt
                        ? new Date(message.sentAt).toLocaleString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Fecha desconocida'}
                    </span>
                    {getDeliveryStatusBadge(message.deliveryStatus)}
                  </div>

                  {/* Subject */}
                  {message.subject && (
                    <div className="font-medium mb-1 truncate">{message.subject}</div>
                  )}

                  {/* Preview */}
                  <div className="text-sm text-muted-foreground truncate">
                    {message.body.substring(0, 100)}
                    {message.body.length > 100 && '...'}
                  </div>
                </div>
              </div>
            </Button>

            {/* Separator entre items (no en el ultimo) */}
            {index < messages.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>

      {/* Dialog de detalle */}
      {selectedMessage && (
        <MessageDetailDialog
          message={selectedMessage}
          open={!!selectedMessage}
          onOpenChange={(open) => !open && setSelectedMessage(null)}
        />
      )}
    </>
  );
}
