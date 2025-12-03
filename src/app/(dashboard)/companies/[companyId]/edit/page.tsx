'use client';

/**
 * Página para editar una empresa
 *
 * @module app/(dashboard)/companies/[companyId]/edit
 */
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CompanyForm } from '@/components/forms/company-form';
import type { CompanyFormData } from '@/lib/validations/company-schema';

interface Company {
  id: string;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  payment_terms_days: number;
  risk_level: 'bajo' | 'medio' | 'alto';
}

/**
 * Página de edición de empresa
 */
export default function EditCompanyPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch(`/api/companies/${companyId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Empresa no encontrada');
          } else {
            setError('Error al cargar empresa');
          }
          return;
        }
        const data = await res.json();
        setCompany(data);
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompany();
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">{error || 'Error'}</h2>
          <Link href="/companies" className="text-blue-600 hover:underline mt-4 inline-block">
            Volver a empresas
          </Link>
        </div>
      </div>
    );
  }

  // Convertir datos de la API al formato del formulario
  const initialData: Partial<CompanyFormData> = {
    name: company.name,
    taxId: company.tax_id,
    email: company.email || '',
    phone: company.phone || '',
    address: company.address || '',
    industry: company.industry || '',
    paymentTermsDays: company.payment_terms_days,
    riskLevel: company.risk_level,
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          {' / '}
          <Link href="/companies" className="hover:text-blue-600">
            Empresas
          </Link>
          {' / '}
          <Link href={`/companies/${companyId}`} className="hover:text-blue-600">
            {company.name}
          </Link>
          {' / '}
          <span className="text-gray-900">Editar</span>
        </nav>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Editar Empresa</h1>
          <p className="text-gray-600">
            Modifica los datos de {company.name}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg border p-6">
          <CompanyForm
            mode="edit"
            companyId={companyId}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
}
