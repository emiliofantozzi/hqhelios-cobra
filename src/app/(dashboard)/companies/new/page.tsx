/**
 * Página para crear nueva empresa cliente
 *
 * @module app/(dashboard)/companies/new
 */
import { CompanyForm } from '@/components/forms/company-form';

export default function NewCompanyPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nueva Empresa</h1>
          <p className="text-gray-600">
            Agrega una nueva empresa cliente al sistema para gestionar sus facturas y cobranzas.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg border p-6">
          <CompanyForm />
        </div>
      </div>
    </div>
  );
}
