'use client';

/**
 * Dialog para completar manualmente un playbook
 * Story 3.7: Control Manual de Playbook Activo
 */
import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface CompletePlaybookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  playbookName: string;
}

export function CompletePlaybookDialog({
  open,
  onOpenChange,
  invoiceId,
  playbookName,
}: CompletePlaybookDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/playbook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', note: note || undefined }),
      });

      if (!res.ok) {
        let errorMessage = 'Error al completar playbook';
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Error HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Playbook completado',
        description: 'El playbook ha sido completado manualmente',
      });
      setNote('');
      setConfirmed(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al completar playbook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNote('');
      setConfirmed(false);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Completar Playbook</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive">
            Esta acción finalizará el playbook &quot;{playbookName}&quot; y no se enviarán más
            mensajes automáticos para esta factura.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-complete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm-complete" className="text-sm leading-relaxed cursor-pointer">
              Confirmo que deseo completar este playbook
            </Label>
          </div>

          <div>
            <Label htmlFor="complete-note">Nota (opcional)</Label>
            <Textarea
              id="complete-note"
              placeholder="Ej: Cliente pagó por fuera del sistema..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{note.length}/500 caracteres</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleComplete}
            disabled={isLoading || !confirmed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Completando...' : 'Completar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
