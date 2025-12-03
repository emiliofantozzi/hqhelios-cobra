'use client';

/**
 * Página de detalle de empresa con tabs
 *
 * @module app/(dashboard)/companies/[companyId]
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ContactsList } from '@/components/contacts/contacts-list';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  is_primary_contact: boolean;
  is_escalation_contact: boolean;
  is_active: boolean;
}

interface Company {
  id: string;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  payment_terms_days: number;
  risk_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Página de detalle de empresa
 */
export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

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
        // Fetch contacts after company loads
        fetchContacts();
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompany();
  }, [companyId]);

  const handleDeactivate = async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });

      if (res.ok) {
        router.push('/companies');
      }
    } catch (err) {
      console.error('Error deactivating company:', err);
    }
  };

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

  const riskVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    bajo: 'secondary',
    medio: 'default',
    alto: 'destructive',
  };

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        {' / '}
        <Link href="/companies" className="hover:text-blue-600">
          Empresas
        </Link>
        {' / '}
        <span className="text-gray-900">{company.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {!company.is_active && (
              <Badge variant="outline" className="text-gray-500">
                Inactiva
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">{company.tax_id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${companyId}/edit`}>
            <Button variant="outline">Editar</Button>
          </Link>
          {company.is_active && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Desactivar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desactivar {company.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La empresa ya no aparecerá en la lista por defecto. Podrás verla
                    activando el filtro "Mostrar inactivos".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate}>
                    Desactivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info General</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1">{company.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p className="mt-1">{company.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Dirección</label>
              <p className="mt-1">{company.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Industria</label>
              <p className="mt-1">{company.industry || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Días de Crédito</label>
              <p className="mt-1">{company.payment_terms_days} días</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nivel de Riesgo</label>
              <div className="mt-1">
                <Badge variant={riskVariants[company.risk_level] || 'default'}>
                  {company.risk_level}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <div className="mt-1">
                <Badge variant={company.is_active ? 'secondary' : 'outline'}>
                  {company.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsList
            contacts={contacts}
            companyId={companyId}
            onRefresh={fetchContacts}
          />
        </TabsContent>

        <TabsContent value="invoices" className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-center py-8">
            Las facturas se implementarán en Story 2.5
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
