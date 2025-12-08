'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { CollectionMessage } from '@/lib/services/message-service';

interface MessageDetailDialogProps {
  message: CollectionMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog que muestra el contenido completo de un mensaje enviado.
 * Incluye alert si el mensaje reboto o fallo.
 *
 * @param message - Mensaje a mostrar
 * @param open - Estado de visibilidad del dialog
 * @param onOpenChange - Callback para cambiar estado de visibilidad
 */
export function MessageDetailDialog({
  message,
  open,
  onOpenChange,
}: MessageDetailDialogProps) {
  const hasDeliveryIssue = ['bounced', 'failed'].includes(message.deliveryStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{message.subject || 'Mensaje sin asunto'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert si rebotó o falló */}
          {hasDeliveryIssue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {message.deliveryStatus === 'bounced'
                  ? 'El mensaje no pudo ser entregado'
                  : 'El envío falló'}
              </AlertDescription>
            </Alert>
          )}

          {/* Metadata del mensaje */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Enviado a:</span>
              <div className="text-muted-foreground">
                {message.contact.firstName} {message.contact.lastName}
                <br />
                {message.contact.email}
              </div>
            </div>

            <div>
              <span className="font-medium">Fecha envío:</span>
              <div className="text-muted-foreground">
                {message.sentAt
                  ? new Date(message.sentAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '-'}
              </div>
            </div>

            {message.deliveredAt && (
              <div>
                <span className="font-medium">Fecha entrega:</span>
                <div className="text-muted-foreground">
                  {new Date(message.deliveredAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            )}

            {message.externalMessageId && (
              <div>
                <span className="font-medium">ID externo:</span>
                <div className="text-muted-foreground font-mono text-xs">
                  {message.externalMessageId}
                </div>
              </div>
            )}
          </div>

          {/* Contenido del mensaje */}
          <div>
            <span className="font-medium">Contenido:</span>
            <div className="mt-2 p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{message.body}</pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
