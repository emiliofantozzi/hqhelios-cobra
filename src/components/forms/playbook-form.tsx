'use client';

/**
 * Formulario para crear o editar un playbook de cobranza.
 *
 * @module components/forms/playbook-form
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPlaybookSchema,
  type CreatePlaybookInput,
  TRIGGER_TYPES,
  TRIGGER_TYPE_LABELS,
} from '@/lib/validations/playbook-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

interface PlaybookFormProps {
  mode?: 'create' | 'edit';
  playbookId?: string;
  initialData?: Partial<CreatePlaybookInput>;
  /** Si es true, redirige a la página de edición después de crear */
  redirectToEdit?: boolean;
}

/**
 * Componente de formulario para crear o editar playbooks.
 *
 * @param props - Propiedades del formulario
 * @param props.mode - Modo del formulario: 'create' o 'edit'
 * @param props.playbookId - ID del playbook (requerido en modo edit)
 * @param props.initialData - Datos iniciales para pre-llenar el formulario
 * @param props.redirectToEdit - Redirigir a edición después de crear
 * @returns Formulario con validación y manejo de errores
 */
export function PlaybookForm({
  mode = 'create',
  playbookId,
  initialData,
  redirectToEdit = true,
}: PlaybookFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<CreatePlaybookInput>({
    resolver: zodResolver(createPlaybookSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      triggerType: initialData?.triggerType || 'post_due',
      triggerDays: initialData?.triggerDays ?? 3,
      isDefault: initialData?.isDefault || false,
    },
  });

  // Watch triggerType para mostrar/ocultar triggerDays
  const triggerType = form.watch('triggerType');

  // Actualizar valores cuando initialData cambie
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        triggerType: initialData.triggerType || 'post_due',
        triggerDays: initialData.triggerDays ?? 3,
        isDefault: initialData.isDefault || false,
      });
    }
  }, [initialData, form]);

  // Limpiar triggerDays cuando cambia a manual
  useEffect(() => {
    if (triggerType === 'manual') {
      form.setValue('triggerDays', null);
    } else if (form.getValues('triggerDays') === null) {
      form.setValue('triggerDays', 3);
    }
  }, [triggerType, form]);

  /**
   * Maneja el envío del formulario
   */
  async function onSubmit(data: CreatePlaybookInput) {
    setIsLoading(true);
    setApiError(null);

    try {
      const url = mode === 'create' ? '/api/playbooks' : `/api/playbooks/${playbookId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        // Error 409 - default duplicado
        if (response.status === 409) {
          setApiError(error.error);
          return;
        }

        // Error 422 - validación de negocio (ej: activar sin mensajes)
        if (response.status === 422) {
          setApiError(error.error);
          return;
        }

        throw new Error(
          error.error || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} playbook`
        );
      }

      const result = await response.json();

      // Toast de éxito
      toast({
        title: mode === 'create' ? 'Playbook creado' : 'Playbook actualizado',
        description: mode === 'create'
          ? 'Ahora puedes agregar mensajes a la secuencia'
          : 'Los cambios se guardaron correctamente',
      });

      // Éxito: navegar
      if (mode === 'create' && redirectToEdit) {
        router.push(`/playbooks/${result.id}/edit`);
      } else if (mode === 'edit' && playbookId) {
        router.push(`/playbooks/${playbookId}/edit`);
      } else {
        router.push('/playbooks');
      }
      router.refresh();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  const cancelUrl = mode === 'edit' && playbookId ? `/playbooks/${playbookId}/edit` : '/playbooks';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error de API */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {apiError}
          </div>
        )}

        {/* Grid de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre (requerido) */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Cobranza Estándar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Trigger */}
          <FormField
            control={form.control}
            name="triggerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Trigger *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cuándo ejecutar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRIGGER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TRIGGER_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {triggerType === 'pre_due' && 'Se ejecutará antes de la fecha de vencimiento'}
                  {triggerType === 'post_due' && 'Se ejecutará después de la fecha de vencimiento'}
                  {triggerType === 'manual' && 'Se ejecutará manualmente cuando lo necesites'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Días de Trigger (condicional) */}
          {triggerType !== 'manual' && (
            <FormField
              control={form.control}
              name="triggerDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días {triggerType === 'pre_due' ? 'antes' : 'después'} *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    {triggerType === 'pre_due'
                      ? 'Cuántos días antes del vencimiento iniciar la secuencia'
                      : 'Cuántos días después del vencimiento iniciar la secuencia'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Es Default */}
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Playbook por defecto</FormLabel>
                  <FormDescription>
                    Si está activo, este playbook se usará automáticamente para nuevas facturas del
                    tipo seleccionado.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Descripción (textarea, ancho completo) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el propósito de este playbook..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Playbook' : 'Guardar Cambios'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(cancelUrl)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
