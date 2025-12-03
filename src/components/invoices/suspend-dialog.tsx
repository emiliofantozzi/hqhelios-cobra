/**
 * Suspend Dialog Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Dialog para suspender una factura con motivo obligatorio.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import { suspendInvoiceSchema, type SuspendInvoiceInput } from '@/lib/validations/invoice-status-schema';

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function SuspendDialog({ open, onOpenChange, invoiceId }: SuspendDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SuspendInvoiceInput>({
    resolver: zodResolver(suspendInvoiceSchema),
    defaultValues: {
      newStatus: 'suspendida',
      note: '',
    },
  });

  async function onSubmit(data: SuspendInvoiceInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al suspender');
      }

      toast({
        title: 'Factura suspendida',
        description: 'La factura ha sido pausada temporalmente',
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
          <AlertDialogTitle>Suspender Factura</AlertDialogTitle>
          <AlertDialogDescription>
            Ingrese el motivo de la suspensión. La factura quedará pausada hasta que se reactive.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de Suspensión *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Cliente en proceso de bancarrota"
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
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Suspendiendo...' : 'Suspender Factura'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
