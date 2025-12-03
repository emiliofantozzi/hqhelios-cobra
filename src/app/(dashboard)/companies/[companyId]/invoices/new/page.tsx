/**
 * Pagina: Nueva Factura para Empresa Especifica
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module app/(dashboard)/companies/[companyId]/invoices/new/page
 */
import { redirect } from 'next/navigation';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getActiveCompaniesForSelect } from '@/lib/services/invoice-service';
import { getCompanyById } from '@/lib/services/company-service';
import { InvoiceForm } from '@/components/forms/invoice-form';

interface PageProps {
  params: Promise<{
    companyId: string;
  }>;
}

/**
 * Pagina para crear factura con empresa pre-seleccionada
 */
export default async function NewInvoiceForCompanyPage({ params }: PageProps) {
  const { companyId } = await params;

  // Verificar autenticacion
  let tenantId: string;
  try {
    tenantId = await getTenantId();
  } catch {
    redirect('/sign-in');
  }

  // Verificar que la empresa existe y pertenece al tenant
  let company;
  try {
    company = await getCompanyById(companyId, tenantId);
  } catch {
    redirect('/companies');
  }

  if (!company.is_active) {
    redirect(`/companies/${companyId}`);
  }

  // Cargar todas las empresas (para que el form funcione)
  const companies = await getActiveCompaniesForSelect(tenantId);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nueva Factura</h1>
        <p className="text-gray-600 mt-2">
          Crear factura para{' '}
          <span className="font-semibold">{company.name}</span>
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <InvoiceForm companies={companies} preselectedCompanyId={companyId} />
      </div>
    </div>
  );
}
