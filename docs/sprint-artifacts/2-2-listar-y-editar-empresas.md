# Story 2.2: Listar y Editar Empresas

Status: ready-for-dev

## Story

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** ver todas mis empresas y editarlas,
**Para que** pueda mantener la información actualizada.

## Acceptance Criteria

### **Scenario 1: Lista de empresas con DataTable**
```gherkin
Given estoy en /companies
When la página carga
Then veo DataTable con columnas:
  | Columna | Sortable | Filterable |
  | Nombre | sí | búsqueda |
  | Tax ID | sí | búsqueda |
  | Email | sí | no |
  | # Facturas | sí | no |
  | Riesgo | sí | filtro |
  | Acciones | no | no |
```

### **Scenario 2: Ver detalle de empresa**
```gherkin
Given estoy en lista de empresas
When hago click en una empresa
Then navego a /companies/[id]
And veo tabs: Info General, Contactos, Facturas
```

### **Scenario 3: Editar empresa**
```gherkin
Given estoy en detalle de empresa
When hago click en "Editar"
Then veo formulario pre-llenado
And puedo modificar campos
And al guardar, los cambios se reflejan
```

### **Scenario 4: Desactivar empresa (soft delete)**
```gherkin
Given estoy en detalle de empresa
When hago click en "Desactivar"
And confirmo en el dialog
Then empresa.is_active = false
And ya no aparece en lista por defecto
And puedo ver con filtro "Mostrar inactivos"
```

## Tasks / Subtasks

### Main Implementation

- [ ] **Task 1**: DataTable Component para Companies (AC: 1)
  - [ ] Crear `src/components/tables/companies-table.tsx`
  - [ ] Usar TanStack Table (@tanstack/react-table 8.20.1)
  - [ ] Columnas: Nombre, Tax ID, Email, # Facturas, Riesgo, Acciones
  - [ ] Sorting en columnas Nombre, Tax ID, Email, # Facturas, Riesgo
  - [ ] Filtro de búsqueda global (Nombre + Tax ID)
  - [ ] Filtro dropdown para Riesgo (bajo, medio, alto)
  - [ ] Paginación: 10, 25, 50, 100 per page
  - [ ] Columna Acciones: Ver, Editar, Desactivar

- [ ] **Task 2**: Page /companies - Lista con DataTable (AC: 1)
  - [ ] Actualizar `src/app/(dashboard)/companies/page.tsx`
  - [ ] Botón "Nueva Empresa" (ya existe del Story 2.1)
  - [ ] Renderizar CompaniesTable con datos
  - [ ] Checkbox "Mostrar inactivos" (toggle is_active filter)
  - [ ] Loading state mientras fetch
  - [ ] Empty state si no hay empresas

- [ ] **Task 3**: API GET /api/companies con joins (AC: 1)
  - [ ] Actualizar `src/app/api/companies/route.ts` GET handler
  - [ ] Join con invoices para contar facturas por empresa
  - [ ] Query: `SELECT companies.*, COUNT(invoices.id) as invoice_count`
  - [ ] Filtros: is_active (default true, opcional false)
  - [ ] Ordenamiento por query params (sortBy, sortOrder)
  - [ ] RLS automático por tenant_id

- [ ] **Task 4**: Page /companies/[companyId] - Detalle con Tabs (AC: 2)
  - [ ] Crear `src/app/(dashboard)/companies/[companyId]/page.tsx`
  - [ ] Layout con breadcrumbs: Dashboard > Companies > [Company Name]
  - [ ] Header con nombre empresa + botones: Editar, Desactivar
  - [ ] Tabs component (shadcn/ui Tabs):
    - Tab "Info General": Mostrar todos los campos de la empresa
    - Tab "Contactos": Lista de contactos (placeholder para Story 2.3)
    - Tab "Facturas": Lista de facturas (placeholder para Story 2.5)
  - [ ] Default tab: Info General

- [ ] **Task 5**: API GET /api/companies/[id] - Detalle (AC: 2)
  - [ ] Crear `src/app/api/companies/[id]/route.ts`
  - [ ] GET handler: obtener empresa por ID
  - [ ] Include contacts count, invoices count
  - [ ] Validar que empresa pertenece al tenant (RLS)
  - [ ] Return 404 si no existe o no pertenece al tenant

- [ ] **Task 6**: Page /companies/[companyId]/edit - Editar (AC: 3)
  - [ ] Crear `src/app/(dashboard)/companies/[companyId]/edit/page.tsx`
  - [ ] Reutilizar CompanyForm del Story 2.1 en modo "edit"
  - [ ] Fetch datos actuales de la empresa
  - [ ] Pre-llenar formulario con defaultValues
  - [ ] onSuccess: router.push(`/companies/${companyId}`)

- [ ] **Task 7**: API PATCH /api/companies/[id] - Update (AC: 3)
  - [ ] Implementar PATCH handler en `src/app/api/companies/[id]/route.ts`
  - [ ] Validar input con companySchema (mismo del Story 2.1)
  - [ ] Verificar unicidad de taxId si cambió (puede no cambiar)
  - [ ] Update solo campos modificados
  - [ ] Validar pertenencia al tenant (RLS)
  - [ ] Return 404 si no existe, 409 si taxId duplicado

- [ ] **Task 8**: Extender CompanyForm para modo "edit" (AC: 3)
  - [ ] Modificar `src/components/forms/company-form.tsx`
  - [ ] Agregar prop `mode: 'create' | 'edit'`
  - [ ] Agregar prop `companyId?: string` (required si mode=edit)
  - [ ] Agregar prop `initialData?: Company` para pre-llenar
  - [ ] Switch entre POST (/api/companies) y PATCH (/api/companies/[id])
  - [ ] Título dinámico: "Nueva Empresa" vs "Editar Empresa"

- [ ] **Task 9**: Soft Delete - Desactivar empresa (AC: 4)
  - [ ] Agregar botón "Desactivar" en detalle de empresa
  - [ ] Dialog de confirmación (shadcn/ui AlertDialog)
  - [ ] Mensaje: "¿Desactivar [Company Name]? Ya no aparecerá en la lista."
  - [ ] Al confirmar: PATCH /api/companies/[id] con { is_active: false }
  - [ ] Redirect a /companies después de desactivar
  - [ ] Toast de éxito: "Empresa desactivada"

- [ ] **Task 10**: API PATCH /api/companies/[id] - Soft Delete (AC: 4)
  - [ ] Extender PATCH handler para soportar is_active update
  - [ ] Validar que al menos un campo se actualiza
  - [ ] No permitir desactivar si tiene facturas pendientes (validación de negocio)
  - [ ] Logging de desactivación

- [ ] **Task 11**: Filtro "Mostrar inactivos" en lista (AC: 4)
  - [ ] Agregar checkbox en /companies page
  - [ ] State: `showInactive: boolean` (default false)
  - [ ] Si true: fetch con query param `?includeInactive=true`
  - [ ] Badge visual en tabla para empresas inactivas

## Dev Notes

### Architecture Compliance

**Stack Tecnológico (continuación Epic 2):**
- TanStack Table 8.20.1 (React Table v8) - DataTables con sorting/filtering
- shadcn/ui Tabs, AlertDialog, Badge - UI components
- React Query para data fetching y caching
- Mismos patterns de RLS y validación del Story 2.1

**Patrones Establecidos (Story 2.1):**
- CompanyForm ya existe en modo "create"
- company-service.ts ya tiene createCompany()
- API /api/companies POST y GET ya implementados
- RLS policies ya configuradas para companies
- Zod schema ya definido

**Nuevos Patterns:**
- DataTable con TanStack Table
- Tabs para navegación en detalle
- Soft delete pattern (is_active)
- PATCH endpoint para updates

**⚠️ Soft Delete Policy (Implementation Readiness H4):**
- NO usar hard DELETE en companies (cascade risk con invoices/contacts)
- SIEMPRE usar PATCH con `is_active: false`
- Validar en deactivate que no hay facturas pendientes con `payment_status = 'pendiente'`
- Consultar `showInactive` param para incluir registros inactivos
- Mantener integridad referencial sin perder data histórica

### Database Queries

**Lista con conteo de facturas:**
```sql
SELECT
  c.*,
  COUNT(i.id) as invoice_count
FROM companies c
LEFT JOIN invoices i ON i.company_id = c.id
WHERE c.tenant_id = current_setting('app.current_tenant_id')::uuid
  AND c.is_active = true  -- o false si showInactive
GROUP BY c.id
ORDER BY c.created_at DESC;
```

**Performance:**
- Index `(tenant_id, is_active)` para filtro rápido
- Index `(company_id)` en invoices para LEFT JOIN
- Expected: <200ms con 1000 empresas

### DataTable Implementation

```typescript
// src/components/tables/companies-table.tsx

'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

/**
 * Representa una empresa con conteo de facturas para la tabla.
 */
interface CompanyWithCount {
  id: string;
  name: string;
  taxId: string;
  email: string | null;
  riskLevel: 'bajo' | 'medio' | 'alto';
  isActive: boolean;
  invoiceCount: number;
}

/**
 * Props del componente CompaniesTable.
 */
interface CompaniesTableProps {
  data: CompanyWithCount[];
  isLoading?: boolean;
}

/**
 * Tabla de empresas con sorting, filtering y paginación.
 *
 * @component
 * @param props - Las propiedades del componente
 * @param props.data - Lista de empresas con conteo de facturas
 * @param props.isLoading - Estado de carga
 *
 * @example
 * ```tsx
 * <CompaniesTable data={companies} />
 * ```
 */
export function CompaniesTable({ data, isLoading = false }: CompaniesTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const columns: ColumnDef<CompanyWithCount>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <Link href={`/companies/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'taxId',
      header: 'Tax ID',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'invoiceCount',
      header: '# Facturas',
      cell: ({ row }) => (
        <span className="text-center">{row.original.invoiceCount}</span>
      ),
    },
    {
      accessorKey: 'riskLevel',
      header: 'Riesgo',
      cell: ({ row }) => {
        const risk = row.original.riskLevel;
        const variant = risk === 'bajo' ? 'success' : risk === 'medio' ? 'warning' : 'destructive';
        return <Badge variant={variant}>{risk}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <DropdownMenu>
          <Button variant="ghost" size="sm">⋮</Button>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href={`/companies/${row.original.id}`}>Ver</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/companies/${row.original.id}/edit`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Desactivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredData = data.filter((company) => {
    // Global filter (name + taxId)
    const matchesGlobal = globalFilter === '' ||
      company.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      company.taxId.toLowerCase().includes(globalFilter.toLowerCase());

    // Risk filter
    const matchesRisk = riskFilter === 'all' || company.riskLevel === riskFilter;

    return matchesGlobal && matchesRisk;
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  if (isLoading) {
    return <div>Cargando empresas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o Tax ID..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="border rounded px-3"
        >
          <option value="all">Todos los riesgos</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
        </select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} empresas
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Service Extensions

```typescript
// src/lib/services/company-service.ts (extensions)

/**
 * Obtiene todas las empresas del tenant con conteo de facturas.
 *
 * @param tenantId - ID del tenant
 * @param includeInactive - Si incluir empresas inactivas
 * @returns Promise con lista de empresas
 */
export async function getCompaniesWithInvoiceCount(
  tenantId: string,
  includeInactive: boolean = false
) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  let query = supabase
    .from('companies')
    .select(`
      *,
      invoices:invoices(count)
    `)
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data.map(company => ({
    ...company,
    invoiceCount: company.invoices[0]?.count || 0
  }));
}

/**
 * Obtiene una empresa por ID.
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa
 * @throws {NotFoundError} Si la empresa no existe
 */
export async function getCompanyById(companyId: string, tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      contacts:contacts(count),
      invoices:invoices(count)
    `)
    .eq('id', companyId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Company', companyId);
  }

  return data;
}

/**
 * Actualiza una empresa existente.
 *
 * @param companyId - ID de la empresa
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa actualizada
 * @throws {NotFoundError} Si la empresa no existe
 * @throws {ConflictError} Si el taxId ya existe
 */
export async function updateCompany(
  companyId: string,
  data: Partial<CompanyFormData>,
  tenantId: string
) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // Si taxId cambió, verificar unicidad
  if (data.taxId) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('tax_id', data.taxId)
      .neq('id', companyId)
      .single();

    if (existing) {
      throw new ConflictError('RFC/Tax ID ya registrado');
    }
  }

  const { data: company, error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      tax_id: data.taxId,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      industry: data.industry || null,
      payment_terms_days: data.paymentTermsDays,
      risk_level: data.riskLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update company: ${error.message}`);
  }

  return company;
}

/**
 * Desactiva una empresa (soft delete).
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa desactivada
 * @throws {NotFoundError} Si la empresa no existe
 */
export async function deactivateCompany(companyId: string, tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // TODO: Validar que no tenga facturas pendientes (Story 2.5)

  const { data: company, error } = await supabase
    .from('companies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to deactivate company: ${error.message}`);
  }

  return company;
}
```

### API Route Patterns

```typescript
// src/app/api/companies/[id]/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { getCompanyById, updateCompany, deactivateCompany } from '@/lib/services/company-service';
import { companySchema } from '@/lib/validations/company-schema';

/**
 * API endpoint para obtener una empresa por ID.
 *
 * @route GET /api/companies/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    const company = await getCompanyById(params.id, tenantId);

    return NextResponse.json(company);

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API endpoint para actualizar una empresa.
 *
 * @route PATCH /api/companies/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    const body = await request.json();

    // Support both full update and partial update (is_active only)
    if (body.is_active === false) {
      const company = await deactivateCompany(params.id, tenantId);
      return NextResponse.json(company);
    }

    // Full update validation
    const result = companySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const company = await updateCompany(params.id, result.data, tenantId);
    return NextResponse.json(company);

  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Page Implementations

**Lista de Empresas:**
```typescript
// src/app/(dashboard)/companies/page.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompaniesTable } from '@/components/tables/companies-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function CompaniesPage() {
  const [showInactive, setShowInactive] = useState(false);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', showInactive],
    queryFn: async () => {
      const res = await fetch(`/api/companies?includeInactive=${showInactive}`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Empresas</h1>
        <Link href="/companies/new">
          <Button>Nueva Empresa</Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Checkbox
          checked={showInactive}
          onCheckedChange={(checked) => setShowInactive(checked as boolean)}
          id="show-inactive"
        />
        <label htmlFor="show-inactive">Mostrar inactivos</label>
      </div>

      <CompaniesTable data={companies || []} isLoading={isLoading} />
    </div>
  );
}
```

**Detalle de Empresa:**
```typescript
// src/app/(dashboard)/companies/[companyId]/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  async function handleDeactivate() {
    const res = await fetch(`/api/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    });

    if (res.ok) {
      router.push('/companies');
    }
  }

  if (isLoading) return <div>Cargando...</div>;
  if (!company) return <div>Empresa no encontrada</div>;

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm">
        <Link href="/dashboard">Dashboard</Link> /
        <Link href="/companies">Empresas</Link> /
        {company.name}
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-gray-500">{company.tax_id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${companyId}/edit`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Desactivar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Desactivar {company.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  La empresa ya no aparecerá en la lista por defecto.
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info General</TabsTrigger>
          <TabsTrigger value="contacts">
            Contactos ({company.contacts[0]?.count || 0})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Facturas ({company.invoices[0]?.count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p>{company.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <p>{company.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <p>{company.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Industria</label>
              <p>{company.industry || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Días de Crédito</label>
              <p>{company.payment_terms_days}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Nivel de Riesgo</label>
              <Badge>{company.risk_level}</Badge>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <p className="text-gray-500">Placeholder para Story 2.3</p>
        </TabsContent>

        <TabsContent value="invoices">
          <p className="text-gray-500">Placeholder para Story 2.5</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── companies/
│   │       ├── page.tsx                    # Lista con DataTable (Task 2)
│   │       ├── [companyId]/
│   │       │   ├── page.tsx                # Detalle con tabs (Task 4)
│   │       │   └── edit/
│   │       │       └── page.tsx            # Editar (Task 6)
│   │       └── new/
│   │           └── page.tsx                # Ya existe del Story 2.1
│   └── api/
│       └── companies/
│           ├── route.ts                    # GET actualizado (Task 3)
│           └── [id]/
│               └── route.ts                # GET, PATCH (Task 5, 7, 10)
│
├── components/
│   ├── tables/
│   │   └── companies-table.tsx             # DataTable (Task 1)
│   └── forms/
│       └── company-form.tsx                # Extendido para edit (Task 8)
│
└── lib/
    └── services/
        └── company-service.ts              # Extensions (Tasks 5, 7, 9, 10)
```

### Testing Requirements

**DataTable Tests:**
```typescript
describe('CompaniesTable', () => {
  it('should sort by column', () => {
    // Test sorting by name, taxId, invoiceCount, riskLevel
  });

  it('should filter by global search', () => {
    // Test search by name and taxId
  });

  it('should filter by risk level', () => {
    // Test dropdown filter
  });

  it('should paginate results', () => {
    // Test pagination controls
  });
});
```

**Integration Tests:**
```typescript
describe('PATCH /api/companies/[id]', () => {
  it('should update company with valid data', async () => {
    const company = await createCompany({ name: 'Old Name', taxId: 'RFC-1' }, testTenantId);

    const res = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name', taxId: 'RFC-1' }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe('New Name');
  });

  it('should return 409 if taxId already exists', async () => {
    await createCompany({ name: 'Company 1', taxId: 'RFC-1' }, testTenantId);
    const company2 = await createCompany({ name: 'Company 2', taxId: 'RFC-2' }, testTenantId);

    const res = await fetch(`/api/companies/${company2.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ taxId: 'RFC-1' }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(409);
  });

  it('should soft delete company', async () => {
    const company = await createCompany({ name: 'Test', taxId: 'RFC-1' }, testTenantId);

    const res = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.is_active).toBe(false);
  });
});
```

### Performance Targets

- **DataTable inicial load:** <300ms (100 empresas)
- **Detalle de empresa:** <200ms
- **Update empresa:** <300ms
- **Soft delete:** <200ms

### Security Checklist

- [ ] ✅ RLS policies activas (heredadas del Story 2.1)
- [ ] ✅ Validación de tenant_id en todos los endpoints
- [ ] ✅ PATCH valida pertenencia antes de update
- [ ] ✅ GET [id] retorna 404 si empresa no pertenece al tenant
- [ ] ✅ Soft delete preserva RLS (is_active field)

### Dependencies

**Story 2.1 MUST be completed:**
- ✅ Company model en DB
- ✅ RLS policies configuradas
- ✅ CompanyForm component existe
- ✅ company-service.ts con createCompany()
- ✅ API /api/companies POST

**New Dependencies:**
- TanStack Table (@tanstack/react-table 8.20.1)
- shadcn/ui: Tabs, AlertDialog, Badge, Checkbox

### References

- **[Source: docs/epics/epic-2-crm.md#Story-2.2]** - User story y criterios
- **[Source: docs/architecture.md#Structure-Patterns]** - DataTable patterns
- **[Source: docs/architecture.md#Soft-Delete-Pattern]** - is_active field
- **[Source: Story 2.1]** - CompanyForm reutilización

---

## Dev Agent Record

### Context Reference

Story contexted using BMad Method with:
- Epic 2 specification (Story 2.2 extracted)
- Story 2.1 (completed) - patterns established
- Architecture document - DataTable patterns
- Epic 1 Retrospective - RLS lessons

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Prerequisites:** Story 2.1 MUST be completed and tested

**Critical Features:**
- DataTable con TanStack Table (nueva dependency)
- CRUD completo (Create en 2.1, Read/Update/Delete en 2.2)
- Soft delete pattern (is_active)
- Tabs para navegación (Info, Contactos, Facturas)

**Estimated Effort:** 10-12 hours

**Key Success Factors:**
- DataTable performance con 100+ empresas
- Soft delete preserva RLS
- Form reutilización entre create y edit
- Tabs placeholders para Stories 2.3 y 2.5

### File List

Files to create/modify:
- `src/components/tables/companies-table.tsx` - NEW
- `src/app/(dashboard)/companies/page.tsx` - UPDATE (add DataTable)
- `src/app/(dashboard)/companies/[companyId]/page.tsx` - NEW
- `src/app/(dashboard)/companies/[companyId]/edit/page.tsx` - NEW
- `src/app/api/companies/route.ts` - UPDATE (GET con joins)
- `src/app/api/companies/[id]/route.ts` - NEW (GET, PATCH)
- `src/lib/services/company-service.ts` - EXTEND (4 new functions)
- `src/components/forms/company-form.tsx` - EXTEND (add edit mode)
- `tests/api/companies-[id].test.ts` - NEW
- `tests/components/companies-table.test.ts` - NEW

---

**Generated:** 2025-12-02
**Epic:** 2 - CRM y Gestión de Clientes
**Priority:** High (builds on Story 2.1)
**Next Story:** 2-3-gestionar-contactos-de-empresa (depends on 2.1, 2.2)
