'use client';

/**
 * Formulario para crear facturas
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module components/forms/invoice-form
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
  SUPPORTED_CURRENCIES,
} from '@/lib/validations/invoice-schema';

interface InvoiceFormProps {
  /**
   * ID de empresa pre-seleccionada (opcional)
   * Si se pasa, el selector de empresa se deshabilita
   */
  preselectedCompanyId?: string;

  /**
   * Lista de empresas activas para el selector
   */
  companies: Array<{ id: string; name: string }>;
}

/**
 * Formulario para crear facturas
 *
 * Soporta dos modos:
 * 1. Sin companyId: Usuario selecciona empresa del dropdown
 * 2. Con companyId: Empresa pre-seleccionada y campo disabled
 */
export function InvoiceForm({
  preselectedCompanyId,
  companies,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Calcular fechas por defecto
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      companyId: preselectedCompanyId || '',
      invoiceNumber: '',
      amount: undefined,
      currency: 'USD',
      issueDate: today,
      dueDate: thirtyDaysLater,
      description: '',
      notes: '',
    },
  });

  /**
   * Handler de submit
   */
  async function onSubmit(data: CreateInvoiceInput) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          issueDate: data.issueDate.toISOString(),
          dueDate: data.dueDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Error 409 - número de factura duplicado
        if (response.status === 409) {
          setApiError(error.error);
          return;
        }

        throw new Error(error.error || 'Error al crear factura');
      }

      const invoice = await response.json();

      // Navegar al detalle o a la lista
      router.push('/invoices');
      router.refresh();
    } catch (error) {
      console.error('Error creating invoice:', error);
      setApiError(
        error instanceof Error ? error.message : 'Error al crear factura'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error de API */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {apiError}
          </div>
        )}

        {/* Company Selector */}
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!preselectedCompanyId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {preselectedCompanyId
                  ? 'Empresa asociada a esta factura'
                  : 'Seleccione la empresa para esta factura'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Number */}
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero de Factura *</FormLabel>
              <FormControl>
                <Input placeholder="FAC-001" {...field} />
              </FormControl>
              <FormDescription>
                Identificador unico de la factura (ej: FAC-001, INV-2025-001)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount & Currency (lado a lado) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1500.00"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? undefined : value);
                    }}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>Monto total de la factura</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Issue Date & Due Date (lado a lado) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Emision *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Fecha de emision de la factura</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha limite de pago (debe ser mayor o igual a fecha de emision)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Servicios de consultoria mes de diciembre..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Descripcion breve de la factura (max. 500 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Internas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales solo visibles internamente..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Notas internas (max. 1000 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creando...' : 'Crear Factura'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
