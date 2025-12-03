/**
 * Pagina: Nueva Factura
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module app/(dashboard)/invoices/new/page
 */
import { redirect } from 'next/navigation';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getActiveCompaniesForSelect } from '@/lib/services/invoice-service';
import { InvoiceForm } from '@/components/forms/invoice-form';

/**
 * Pagina para crear una nueva factura
 * Permite seleccionar la empresa desde el formulario
 */
export default async function NewInvoicePage() {
  // Verificar autenticacion
  let tenantId: string;
  try {
    tenantId = await getTenantId();
  } catch {
    redirect('/sign-in');
  }

  // Cargar empresas activas
  const companies = await getActiveCompaniesForSelect(tenantId);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nueva Factura</h1>
        <p className="text-gray-600 mt-2">
          Cree una nueva factura en el sistema
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-gray-600 mb-4">
            No hay empresas activas. Debe crear una empresa antes de crear
            facturas.
          </p>
          <a
            href="/companies/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Crear Empresa
          </a>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-6">
          <InvoiceForm companies={companies} />
        </div>
      )}
    </div>
  );
}
