'use client';

/**
 * Dialog para pausar un playbook activo
 * Story 3.7: Control Manual de Playbook Activo
 */
import { useState } from 'react';
import { Pause, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PausePlaybookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  playbookName: string;
}

export function PausePlaybookDialog({
  open,
  onOpenChange,
  invoiceId,
  playbookName,
}: PausePlaybookDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/playbook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', note: note || undefined }),
      });

      if (!res.ok) {
        let errorMessage = 'Error al pausar playbook';
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Error HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Playbook pausado',
        description: 'El playbook ha sido pausado exitosamente',
      });
      setNote('');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al pausar playbook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pausar Playbook</AlertDialogTitle>
          <AlertDialogDescription>
            Se pausará el playbook &quot;{playbookName}&quot;. No se enviarán más mensajes
            automáticos hasta que lo reanudes.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="pause-note">Nota (opcional)</Label>
          <Textarea
            id="pause-note"
            placeholder="Ej: Cliente solicitó más tiempo..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{note.length}/500 caracteres</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handlePause} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Pausando...' : 'Pausar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
