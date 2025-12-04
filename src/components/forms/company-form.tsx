'use client';

/**
 * Formulario para crear o editar una empresa cliente.
 *
 * @module components/forms/company-form
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, type CompanyFormData } from '@/lib/validations/company-schema';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CompanyFormProps {
  mode?: 'create' | 'edit';
  companyId?: string;
  initialData?: Partial<CompanyFormData>;
}

/**
 * Componente de formulario para crear o editar empresas.
 *
 * @param props - Propiedades del formulario
 * @param props.mode - Modo del formulario: 'create' o 'edit'
 * @param props.companyId - ID de la empresa (requerido en modo edit)
 * @param props.initialData - Datos iniciales para pre-llenar el formulario
 * @returns Formulario con validación y manejo de errores
 */
export function CompanyForm({ mode = 'create', companyId, initialData }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || '',
      taxId: initialData?.taxId || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      industry: initialData?.industry || '',
      riskLevel: initialData?.riskLevel || 'medio',
      hasPortal: initialData?.hasPortal ?? false,
    },
  });

  // Actualizar valores cuando initialData cambie
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        taxId: initialData.taxId || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        industry: initialData.industry || '',
        riskLevel: initialData.riskLevel || 'medio',
        hasPortal: initialData.hasPortal ?? false,
      });
    }
  }, [initialData, form]);

  /**
   * Maneja el envío del formulario
   */
  async function onSubmit(data: CompanyFormData) {
    setIsLoading(true);
    setApiError(null);

    try {
      const url = mode === 'create' ? '/api/companies' : `/api/companies/${companyId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        // Error 409 - taxId duplicado: NO limpiar formulario
        if (response.status === 409) {
          setApiError(error.error);
          return;
        }

        // Otros errores
        throw new Error(error.error || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} empresa`);
      }

      // Éxito: navegar
      if (mode === 'edit' && companyId) {
        router.push(`/companies/${companyId}`);
      } else {
        router.push('/companies');
      }
      router.refresh();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  const cancelUrl = mode === 'edit' && companyId ? `/companies/${companyId}` : '/companies';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error de API */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {apiError}
          </div>
        )}

        {/* Grid de 2 columnas para campos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre (requerido) */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tax ID / RFC (requerido) */}
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC / Tax ID *</FormLabel>
                <FormControl>
                  <Input placeholder="RFC o Tax ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono (opcional) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+52 555 1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Industria (opcional) */}
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industria</FormLabel>
                <FormControl>
                  <Input placeholder="ej: Tecnología, Retail, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nivel de Riesgo */}
          <FormField
            control={form.control}
            name="riskLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel de Riesgo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tiene Portal */}
          <FormField
            control={form.control}
            name="hasPortal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Usa portal de facturas</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marcar si el cliente tiene acceso a portal de pagos
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Dirección (textarea, ancho completo) */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dirección completa de la empresa"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : mode === 'create' ? 'Guardar Empresa' : 'Actualizar'}
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
