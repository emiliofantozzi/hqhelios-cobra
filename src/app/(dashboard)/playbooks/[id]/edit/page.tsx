'use client';

/**
 * Página para editar playbook y sus mensajes
 *
 * @module app/(dashboard)/playbooks/[id]/edit
 */
import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlaybookForm } from '@/components/forms/playbook-form';
import { PlaybookMessageForm } from '@/components/forms/playbook-message-form';
import { MessageList } from '@/components/playbooks/message-list';
import { MessagePreview } from '@/components/playbooks/message-preview';
import { type PlaybookMessageItem } from '@/components/playbooks/sortable-message-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';

interface PlaybookData {
  id: string;
  name: string;
  description: string | null;
  trigger_type: 'pre_due' | 'post_due' | 'manual';
  trigger_days: number | null;
  is_default: boolean;
  is_active: boolean;
  messages: PlaybookMessageItem[];
}

/**
 * Componente de loading
 */
function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-2 text-sm text-gray-500">Cargando playbook...</p>
    </div>
  );
}

/**
 * Página de edición de playbook con mensajes
 */
export default function EditPlaybookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: playbookId } = use(params);
  const router = useRouter();
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [messageFormOpen, setMessageFormOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<PlaybookMessageItem | null>(null);
  const [previewMessage, setPreviewMessage] = useState<PlaybookMessageItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Cargar playbook
  const fetchPlaybook = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/playbooks/${playbookId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Playbook no encontrado');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setPlaybook(data);
    } catch (err) {
      console.error('Error fetching playbook:', err);
      setError('Error al cargar el playbook');
    } finally {
      setIsLoading(false);
    }
  }, [playbookId]);

  useEffect(() => {
    fetchPlaybook();
  }, [fetchPlaybook]);

  // Handler para reordenar mensajes
  const handleReorder = async (messages: Array<{ id: string; sequenceOrder: number }>) => {
    try {
      const res = await fetch(`/api/playbooks/${playbookId}/messages/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        throw new Error('Failed to reorder');
      }

      // Recargar playbook para obtener el orden actualizado del servidor
      await fetchPlaybook();
    } catch (err) {
      console.error('Error reordering messages:', err);
      throw err; // Re-throw para que MessageList pueda revertir
    }
  };

  // Handler para editar mensaje
  const handleEdit = (message: PlaybookMessageItem) => {
    setEditingMessage(message);
    setMessageFormOpen(true);
  };

  // Handler para eliminar mensaje
  const handleDelete = async (messageId: string) => {
    if (!confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/playbooks/${playbookId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchPlaybook();
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Handler para preview
  const handlePreview = (message: PlaybookMessageItem) => {
    setPreviewMessage(message);
    setPreviewOpen(true);
  };

  // Handler para agregar nuevo mensaje
  const handleAddMessage = () => {
    setEditingMessage(null);
    setMessageFormOpen(true);
  };

  // Handler para cerrar modal de mensaje
  const handleMessageFormClose = (open: boolean) => {
    if (!open) {
      setEditingMessage(null);
    }
    setMessageFormOpen(open);
  };

  // Handler para éxito al guardar mensaje
  const handleMessageSuccess = () => {
    fetchPlaybook();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !playbook) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Playbook no encontrado'}</p>
          <Link href="/playbooks">
            <Button variant="outline" className="mt-4">
              Volver a Playbooks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4">
          <Link href="/playbooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Playbook</h1>
          <p className="text-gray-600 mt-1">
            Modifica la configuración y mensajes del playbook
          </p>
        </div>

        {/* Sección: Datos del playbook */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Datos básicos y reglas de activación del playbook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlaybookForm
              mode="edit"
              playbookId={playbookId}
              initialData={{
                name: playbook.name,
                description: playbook.description || '',
                triggerType: playbook.trigger_type,
                triggerDays: playbook.trigger_days ?? undefined,
                isDefault: playbook.is_default,
              }}
            />
          </CardContent>
        </Card>

        {/* Sección: Mensajes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Secuencia de Mensajes</CardTitle>
              <CardDescription>
                Arrastra los mensajes para cambiar el orden de la secuencia
              </CardDescription>
            </div>
            <Button onClick={handleAddMessage}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Mensaje
            </Button>
          </CardHeader>
          <CardContent>
            <MessageList
              playbookId={playbookId}
              messages={playbook.messages}
              onReorder={handleReorder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal de mensaje */}
      <PlaybookMessageForm
        mode={editingMessage ? 'edit' : 'create'}
        playbookId={playbookId}
        messageId={editingMessage?.id}
        initialData={
          editingMessage
            ? {
                channel: editingMessage.channel,
                temperature: editingMessage.temperature,
                subjectTemplate: editingMessage.subject_template || '',
                bodyTemplate: editingMessage.body_template,
                waitDays: editingMessage.wait_days,
                sendOnlyIfNoResponse: editingMessage.send_only_if_no_response,
              }
            : undefined
        }
        open={messageFormOpen}
        onOpenChange={handleMessageFormClose}
        onSuccess={handleMessageSuccess}
      />

      {/* Modal de preview */}
      <MessagePreview
        message={previewMessage}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
