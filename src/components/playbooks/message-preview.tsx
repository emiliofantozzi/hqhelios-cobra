'use client';

/**
 * Modal de vista previa de mensaje con variables reemplazadas.
 *
 * @module components/playbooks/message-preview
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare } from 'lucide-react';
import { replaceTemplateVariables } from '@/lib/utils/template-replacer';
import { EXAMPLE_DATA } from '@/lib/constants/template-variables';
import { CHANNEL_LABELS, TEMPERATURE_LABELS } from '@/lib/validations/playbook-schema';

interface MessagePreviewData {
  channel: 'email' | 'whatsapp';
  temperature: 'amigable' | 'firme' | 'urgente';
  subject_template: string | null;
  body_template: string;
}

interface MessagePreviewProps {
  message: MessagePreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal que muestra la vista previa de un mensaje con variables reemplazadas.
 */
export function MessagePreview({ message, open, onOpenChange }: MessagePreviewProps) {
  if (!message) return null;

  const replacedSubject = message.subject_template
    ? replaceTemplateVariables(message.subject_template, EXAMPLE_DATA)
    : null;

  const replacedBody = replaceTemplateVariables(message.body_template, EXAMPLE_DATA);

  const ChannelIcon = message.channel === 'email' ? Mail : MessageSquare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon className="h-5 w-5" />
            Vista Previa del Mensaje
          </DialogTitle>
          <DialogDescription>
            Así se verá el mensaje con datos de ejemplo. Las variables han sido reemplazadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges de canal y temperatura */}
          <div className="flex gap-2">
            <Badge variant="outline">{CHANNEL_LABELS[message.channel]}</Badge>
            <Badge
              variant={
                message.temperature === 'amigable'
                  ? 'secondary'
                  : message.temperature === 'urgente'
                    ? 'destructive'
                    : 'default'
              }
            >
              {TEMPERATURE_LABELS[message.temperature]}
            </Badge>
          </div>

          {/* Preview del mensaje */}
          {message.channel === 'email' ? (
            <EmailPreview subject={replacedSubject || ''} body={replacedBody} />
          ) : (
            <WhatsAppPreview body={replacedBody} />
          )}

          {/* Datos de ejemplo usados */}
          <div className="text-xs text-gray-400 p-3 bg-gray-50 rounded-md">
            <p className="font-medium mb-1">Datos de ejemplo utilizados:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(EXAMPLE_DATA).map(([key, value]) => (
                <span key={key}>
                  <code className="text-gray-600">{`{{${key}}}`}</code>: {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Vista previa estilo email
 */
function EmailPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <Card>
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-base font-medium">{subject}</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="whitespace-pre-wrap text-sm text-gray-700">{body}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Vista previa estilo WhatsApp
 */
function WhatsAppPreview({ body }: { body: string }) {
  return (
    <div className="bg-[#DCF8C6] rounded-lg p-4 max-w-[85%] ml-auto relative">
      <div className="absolute -right-2 top-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-[#DCF8C6]" />
      <div className="whitespace-pre-wrap text-sm text-gray-800">{body}</div>
      <div className="text-right text-xs text-gray-500 mt-1">
        {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
