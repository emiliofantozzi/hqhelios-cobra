'use client';

/**
 * Formulario para crear/editar facturas
 * Story 2.5: Crear Facturas Manualmente
 * Story 3.4.1: Editar Facturas
 *
 * @module components/forms/invoice-form
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
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
  editInvoiceSchema,
  type CreateInvoiceInput,
  type EditInvoiceInput,
  SUPPORTED_CURRENCIES,
  PAYMENT_STATUSES,
} from '@/lib/validations/invoice-schema';

/**
 * Datos iniciales para modo edición
 */
interface InvoiceInitialData {
  companyId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  paymentStatus: string;
  projectedPaymentDate?: string | null;
  description?: string | null;
  notes?: string | null;
}

interface InvoiceFormProps {
  /**
   * Modo del formulario: crear o editar
   */
  mode?: 'create' | 'edit';

  /**
   * ID de la factura (requerido en modo edit)
   */
  invoiceId?: string;

  /**
   * Datos iniciales para edición
   */
  initialData?: InvoiceInitialData;

  /**
   * ID de empresa pre-seleccionada (opcional, solo en modo create)
   */
  preselectedCompanyId?: string;

  /**
   * Lista de empresas activas para el selector
   */
  companies: Array<{ id: string; name: string }>;
}

/**
 * Formulario para crear/editar facturas
 */
export function InvoiceForm({
  mode = 'create',
  invoiceId,
  initialData,
  preselectedCompanyId,
  companies,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEditMode = mode === 'edit';

  // Calcular fechas por defecto (solo para crear)
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  // Preparar valores por defecto
  const getDefaultValues = (): CreateInvoiceInput => {
    if (isEditMode && initialData) {
      return {
        companyId: initialData.companyId,
        invoiceNumber: initialData.invoiceNumber,
        amount: initialData.amount,
        currency: initialData.currency as 'USD' | 'MXN' | 'EUR',
        issueDate: new Date(initialData.issueDate),
        dueDate: new Date(initialData.dueDate),
        paymentTermsDays: initialData.paymentTermsDays,
        paymentStatus: initialData.paymentStatus as typeof PAYMENT_STATUSES[number],
        projectedPaymentDate: initialData.projectedPaymentDate
          ? new Date(initialData.projectedPaymentDate)
          : undefined,
        description: initialData.description || '',
        notes: initialData.notes || '',
      };
    }

    return {
      companyId: preselectedCompanyId || '',
      invoiceNumber: '',
      amount: undefined as unknown as number,
      currency: 'USD',
      issueDate: today,
      dueDate: thirtyDaysLater,
      paymentTermsDays: 30,
      paymentStatus: 'pendiente',
      projectedPaymentDate: undefined,
      description: '',
      notes: '',
    };
  };

  // El form usa CreateInvoiceInput como tipo base.
  // En modo edit, editInvoiceSchema valida (todos los campos opcionales, sin paymentStatus).
  // En modo create, createInvoiceSchema valida (campos requeridos).
  // El cast a Resolver es necesario porque zodResolver infiere tipos diferentes
  // para cada schema, pero el form necesita un tipo consistente.
  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(
      isEditMode ? editInvoiceSchema : createInvoiceSchema
    ) as unknown as Resolver<CreateInvoiceInput>,
    defaultValues: getDefaultValues(),
  });

  // Resetear form cuando cambian los datos iniciales (modo edit)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset es estable,
  // getDefaultValues se recalcula intencionalmente solo cuando initialData cambia
  useEffect(() => {
    if (isEditMode && initialData) {
      form.reset(getDefaultValues());
    }
  }, [initialData, isEditMode, form]);

  /**
   * Handler de submit
   */
  async function onSubmit(data: CreateInvoiceInput | EditInvoiceInput) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const url = isEditMode ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          issueDate: data.issueDate?.toISOString(),
          dueDate: data.dueDate?.toISOString(),
          projectedPaymentDate: data.projectedPaymentDate?.toISOString() ?? null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Error 409 - número de factura duplicado
        if (response.status === 409) {
          setApiError(error.error);
          return;
        }

        throw new Error(error.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} factura`);
      }

      // Navegar al detalle o a la lista
      if (isEditMode && invoiceId) {
        router.push(`/invoices/${invoiceId}`);
      } else {
        router.push('/invoices');
      }
      router.refresh();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} invoice:`, error);
      setApiError(
        error instanceof Error
          ? error.message
          : `Error al ${isEditMode ? 'actualizar' : 'crear'} factura`
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
                value={field.value}
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
                <Select onValueChange={field.onChange} value={field.value}>
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

        {/* Payment Terms (solo visible, paymentStatus solo en modo create) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="paymentTermsDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condicion de Pago (dias)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 30 : value);
                    }}
                    value={field.value ?? 30}
                  />
                </FormControl>
                <FormDescription>Dias de credito (1-365)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado de Pago - Solo visible en modo create */}
          {!isEditMode && (
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Estado inicial de la factura</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* En modo edit, mostrar info de que el estado se cambia en otra pantalla */}
          {isEditMode && (
            <div className="flex items-end pb-2">
              <p className="text-sm text-gray-500">
                El estado de pago se gestiona desde la vista de detalle de la factura.
              </p>
            </div>
          )}
        </div>

        {/* Projected Payment Date */}
        <FormField
          control={form.control}
          name="projectedPaymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha Proyectada de Pago</FormLabel>
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
                        <span>Sin fecha proyectada</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Fecha estimada de pago (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormDescription>Notas internas (max. 1000 caracteres)</FormDescription>
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
            {isSubmitting
              ? isEditMode
                ? 'Guardando...'
                : 'Creando...'
              : isEditMode
                ? 'Guardar Cambios'
                : 'Crear Factura'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
