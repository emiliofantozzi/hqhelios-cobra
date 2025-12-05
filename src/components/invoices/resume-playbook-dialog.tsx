'use client';

/**
 * Dialog para reanudar un playbook pausado
 * Story 3.7: Control Manual de Playbook Activo
 */
import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface ResumePlaybookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  playbookName: string;
}

export function ResumePlaybookDialog({
  open,
  onOpenChange,
  invoiceId,
  playbookName,
}: ResumePlaybookDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResume = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/playbook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (!res.ok) {
        let errorMessage = 'Error al reanudar playbook';
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Error HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Playbook reanudado',
        description: 'El playbook se ha activado y procesará en la próxima ejecución',
      });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al reanudar playbook',
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
          <AlertDialogTitle>Reanudar Playbook</AlertDialogTitle>
          <AlertDialogDescription>
            Se reanudará el playbook &quot;{playbookName}&quot;. El playbook se activará
            inmediatamente y continuará enviando mensajes automáticos según su configuración.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleResume} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Reanudando...' : 'Reanudar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
