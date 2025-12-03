/**
 * Escalate Dialog Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Dialog de confirmación para escalar una factura.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EscalateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function EscalateDialog({ open, onOpenChange, invoiceId }: EscalateDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEscalate() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'escalada',
          note: 'Escalada manualmente',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al escalar');
      }

      toast({
        title: 'Factura escalada',
        description: 'La factura ha sido enviada a nivel superior',
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Escalar Factura</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro de escalar esta factura? Esto pausará la cobranza automática y la enviará a
            nivel superior para revisión.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleEscalate} disabled={isSubmitting} variant="default">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Escalando...' : 'Confirmar Escalamiento'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
