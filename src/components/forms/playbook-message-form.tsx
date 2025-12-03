'use client';

/**
 * Formulario modal para crear/editar mensajes de un playbook.
 *
 * @module components/forms/playbook-message-form
 */
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createPlaybookMessageSchema,
  updatePlaybookMessageSchema,
  type CreatePlaybookMessageInput,
  type UpdatePlaybookMessageInput,
  CHANNELS,
  CHANNEL_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
} from '@/lib/validations/playbook-schema';
import { VariableHelper, insertAtCursor } from '@/components/playbooks/variable-helper';

interface PlaybookMessageFormProps {
  mode: 'create' | 'edit';
  playbookId: string;
  messageId?: string;
  initialData?: Partial<CreatePlaybookMessageInput>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Formulario modal para crear o editar mensajes de playbook.
 */
export function PlaybookMessageForm({
  mode,
  playbookId,
  messageId,
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: PlaybookMessageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === 'edit';
  const schema = isEdit ? updatePlaybookMessageSchema : createPlaybookMessageSchema;

  const form = useForm<CreatePlaybookMessageInput | UpdatePlaybookMessageInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel: initialData?.channel || 'email',
      temperature: initialData?.temperature || 'amigable',
      subjectTemplate: initialData?.subjectTemplate || '',
      bodyTemplate: initialData?.bodyTemplate || '',
      waitDays: initialData?.waitDays ?? 0,
      sendOnlyIfNoResponse: initialData?.sendOnlyIfNoResponse ?? true,
      useAiGeneration: initialData?.useAiGeneration || false,
      aiInstructions: initialData?.aiInstructions || '',
    },
  });

  // Watch channel para mostrar/ocultar subject
  const channel = form.watch('channel');

  // Reset form cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      form.reset({
        channel: initialData.channel || 'email',
        temperature: initialData.temperature || 'amigable',
        subjectTemplate: initialData.subjectTemplate || '',
        bodyTemplate: initialData.bodyTemplate || '',
        waitDays: initialData.waitDays ?? 0,
        sendOnlyIfNoResponse: initialData.sendOnlyIfNoResponse ?? true,
        useAiGeneration: initialData.useAiGeneration || false,
        aiInstructions: initialData.aiInstructions || '',
      });
    }
  }, [initialData, form]);

  /**
   * Maneja la inserción de variables en el campo activo
   */
  const handleVariableClick = (variable: string) => {
    // Insertar en body por defecto, o en subject si está enfocado
    if (document.activeElement === subjectInputRef.current && channel === 'email') {
      insertAtCursor(subjectInputRef.current as unknown as HTMLTextAreaElement, variable);
      const currentValue = form.getValues('subjectTemplate') || '';
      form.setValue('subjectTemplate', currentValue + variable);
    } else {
      insertAtCursor(bodyTextareaRef.current, variable);
      // Trigger form update
      const currentValue = bodyTextareaRef.current?.value || '';
      form.setValue('bodyTemplate', currentValue);
    }
  };

  const onSubmit = async (data: CreatePlaybookMessageInput | UpdatePlaybookMessageInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/playbooks/${playbookId}/messages/${messageId}`
        : `/api/playbooks/${playbookId}/messages`;
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar mensaje');
      }

      // Toast de éxito
      toast({
        title: isEdit ? 'Mensaje actualizado' : 'Mensaje agregado',
        description: isEdit
          ? 'Los cambios se guardaron correctamente'
          : 'El mensaje fue agregado a la secuencia',
      });

      onOpenChange(false);
      form.reset();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Mensaje' : 'Agregar Mensaje'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica el contenido del mensaje'
              : 'Configura el nuevo mensaje de la secuencia de cobranza'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Canal */}
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHANNELS.map((ch) => (
                          <SelectItem key={ch} value={ch}>
                            {CHANNEL_LABELS[ch]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temperatura/Tono */}
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tono *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tono" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPERATURES.map((temp) => (
                          <SelectItem key={temp} value={temp}>
                            {TEMPERATURE_LABELS[temp]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Asunto (solo para email) */}
            {channel === 'email' && (
              <FormField
                control={form.control}
                name="subjectTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asunto del Email *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Recordatorio: Factura {{invoice_number}} pendiente"
                        {...field}
                        value={field.value || ''}
                        ref={subjectInputRef}
                      />
                    </FormControl>
                    <FormDescription>Puedes usar variables como {'{{invoice_number}}'}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Variables Helper */}
            <div className="p-3 bg-gray-50 rounded-md">
              <VariableHelper onVariableClick={handleVariableClick} />
            </div>

            {/* Cuerpo del mensaje */}
            <FormField
              control={form.control}
              name="bodyTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Hola {{contact_first_name}},

Le recordamos que la factura {{invoice_number}} por {{amount}} {{currency}} se encuentra pendiente de pago.

Agradecemos su pronta atención.`}
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                      ref={bodyTextareaRef}
                    />
                  </FormControl>
                  <FormDescription>
                    Escribe el contenido del mensaje. Usa las variables de arriba para personalizar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Días de espera */}
              <FormField
                control={form.control}
                name="waitDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de espera</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Días a esperar después del mensaje anterior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Solo si no hay respuesta */}
              <FormField
                control={form.control}
                name="sendOnlyIfNoResponse"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 mt-6">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">Solo si no hay respuesta</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Saltar si el cliente ya respondió
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Agregar Mensaje'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
