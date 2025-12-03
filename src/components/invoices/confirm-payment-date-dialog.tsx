/**
 * Confirm Payment Date Dialog Component
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Dialog para confirmar fecha de pago prometida por el cliente.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  confirmPaymentDateSchema,
  type ConfirmPaymentDateInput,
} from '@/lib/validations/invoice-status-schema';

interface ConfirmPaymentDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function ConfirmPaymentDateDialog({
  open,
  onOpenChange,
  invoiceId,
}: ConfirmPaymentDateDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const form = useForm<ConfirmPaymentDateInput>({
    resolver: zodResolver(confirmPaymentDateSchema),
    defaultValues: {
      newStatus: 'fecha_confirmada',
      confirmedPaymentDate: addDays(today, 7), // Default: 1 semana
    },
  });

  async function onSubmit(data: ConfirmPaymentDateInput) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          confirmedPaymentDate: data.confirmedPaymentDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al confirmar fecha');
      }

      toast({
        title: 'Fecha de pago confirmada',
        description: `Fecha: ${format(data.confirmedPaymentDate, 'PPP', { locale: es })}`,
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
          <AlertDialogTitle>Confirmar Fecha de Pago</AlertDialogTitle>
          <AlertDialogDescription>
            Seleccione la fecha en que el cliente confirmó que realizará el pago
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="confirmedPaymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Confirmada *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value
                            ? format(field.value, 'PPP', { locale: es })
                            : 'Seleccione fecha'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                {isSubmitting ? 'Guardando...' : 'Confirmar Fecha'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
