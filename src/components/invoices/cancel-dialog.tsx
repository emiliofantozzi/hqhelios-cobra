/**
 * Cancel Dialog Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Dialog para cancelar una factura con advertencia y motivo obligatorio.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { cancelInvoiceSchema, type CancelInvoiceInput } from '@/lib/validations/invoice-status-schema';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function CancelDialog({ open, onOpenChange, invoiceId }: CancelDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CancelInvoiceInput>({
    resolver: zodResolver(cancelInvoiceSchema),
    defaultValues: {
      newStatus: 'cancelada',
      note: '',
    },
  });

  async function onSubmit(data: CancelInvoiceInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cancelar');
      }

      toast({
        title: 'Factura cancelada',
        description: 'La factura ha sido anulada permanentemente',
      });

      onOpenChange(false);
      form.reset();
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
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Factura
          </AlertDialogTitle>
          <AlertDialogDescription className="text-red-600 font-medium">
            Esta acción es irreversible. La factura quedará marcada como cancelada permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de Cancelación *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Factura emitida incorrectamente"
                      {...field}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                No, mantener factura
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="destructive">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Cancelando...' : 'Sí, cancelar factura'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
