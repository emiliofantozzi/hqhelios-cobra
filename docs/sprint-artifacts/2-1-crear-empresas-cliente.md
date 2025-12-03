# Story 2.1: Crear Empresas Cliente

Status: ready-for-dev

## Story

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** agregar nuevas empresas cliente al sistema,
**Para que** pueda gestionar sus facturas y cobranzas.

## Acceptance Criteria

### **Scenario 1: Crear empresa exitosamente**
```gherkin
Given estoy autenticado y en /companies
When hago click en "Nueva Empresa"
Then veo formulario con campos:
  | Campo | Tipo | Requerido |
  | name | text | sí |
  | taxId | text | sí |
  | email | email | no |
  | phone | tel | no |
  | address | textarea | no |
  | industry | select | no |
  | paymentTermsDays | number | no (default 30) |
  | riskLevel | select | no (default medio) |
```

### **Scenario 2: Guardar empresa crea registro**
```gherkin
Given lleno el formulario con datos válidos
When hago click en "Guardar"
Then la empresa aparece en la lista
And tiene tenant_id de mi organización
And is_active = true
```

### **Scenario 3: Tax ID duplicado muestra error**
```gherkin
Given ya existe empresa con taxId "RFC123456"
When intento crear otra empresa con taxId "RFC123456"
Then veo error "RFC/Tax ID ya registrado"
And el formulario no se limpia
```

## Tasks / Subtasks

### Epic 2 Preparation (Prerequisites)
- [ ] **Task 0.1**: Schema Prisma para Company (AC: Schema)
  - [ ] Agregar model Company a prisma/schema.prisma siguiendo el schema del Epic 2
  - [ ] Incluir índices: `@@unique([tenantId, taxId])`, `@@index([tenantId])`
  - [ ] Generar migration: `pnpm prisma migrate dev --name add-company-model`
  - [ ] Verificar migration aplicada correctamente

- [ ] **Task 0.2**: RLS Policies para Company (AC: Schema + Security)
  - [ ] Crear migration manual SQL para RLS policies
  - [ ] ENABLE ROW LEVEL SECURITY en tabla companies
  - [ ] FORCE ROW LEVEL SECURITY en tabla companies
  - [ ] Crear policy SELECT: `tenant_id = current_setting('app.current_tenant_id')::uuid`
  - [ ] Crear policy INSERT: mismo check + validar datos
  - [ ] Crear policy UPDATE: mismo check
  - [ ] Crear policy DELETE: mismo check (aunque usaremos soft delete)
  - [ ] Ejecutar tests de aislamiento RLS (usar template del Epic 1)

- [ ] **Task 0.3**: Zod Schema para Company (AC: Schema + Validation)
  - [ ] Crear `src/lib/validations/company-schema.ts`
  - [ ] Implementar schema siguiendo especificación del Epic
  - [ ] Agregar test de validación con casos edge

### Main Implementation
- [ ] **Task 1**: API Route POST /api/companies (AC: 2, 3)
  - [ ] Crear `src/app/api/companies/route.ts`
  - [ ] Implementar POST handler con patrón del Epic 1:
    - Auth con Clerk (`auth()`)
    - Validar con Zod schema
    - Obtener tenant_id del user metadata
    - Crear empresa con Supabase Client (respeta RLS)
    - Error handling: 409 si taxId duplicado
  - [ ] Agregar tests de integración

- [ ] **Task 2**: Company Service (AC: 2, 3)
  - [ ] Crear `src/lib/services/company-service.ts`
  - [ ] Función `createCompany(data, tenantId)` con JSDoc OBLIGATORIO
  - [ ] Validar unicidad de taxId dentro del tenant
  - [ ] Manejar ConflictError si duplicado
  - [ ] Logging de creación exitosa

- [ ] **Task 3**: Company Form Component (AC: 1, 2, 3)
  - [ ] Crear `src/components/forms/company-form.tsx`
  - [ ] Usar react-hook-form + Zod schema
  - [ ] shadcn/ui components: Input, Select, Textarea, Button, Form
  - [ ] Campos según AC1 con defaults (paymentTermsDays=30, riskLevel=medio)
  - [ ] Mostrar error de validación en-line
  - [ ] Mostrar error 409 (taxId duplicado) sin limpiar formulario
  - [ ] Loading state durante submit

- [ ] **Task 4**: Page /companies/new (AC: 1, 2)
  - [ ] Crear `src/app/(dashboard)/companies/new/page.tsx`
  - [ ] Layout con título "Nueva Empresa"
  - [ ] Renderizar CompanyForm
  - [ ] onSuccess: router.push('/companies')
  - [ ] Breadcrumbs: Dashboard > Companies > Nueva

- [ ] **Task 5**: Lista de Companies (AC: 2 - verificación)
  - [ ] Crear `src/app/(dashboard)/companies/page.tsx`
  - [ ] Botón "Nueva Empresa" que navega a /companies/new
  - [ ] Lista simple (tabla básica o cards) mostrando empresas creadas
  - [ ] Fetch con React Query desde /api/companies GET

- [ ] **Task 6**: API Route GET /api/companies (AC: 2 - lista)
  - [ ] Implementar GET handler en `src/app/api/companies/route.ts`
  - [ ] Auth + tenant_id filtering (RLS automático)
  - [ ] Ordenar por created_at DESC
  - [ ] Return lista de empresas

## Dev Notes

### Architecture Compliance

**Stack Tecnológico (Epic 1 + Architecture):**
- Next.js 14.2.13 (App Router ya establecido)
- React 18.3.1, TypeScript 5.4.5
- Prisma 5.18.0 para schema, @supabase/supabase-js 2.45.0 para queries
- Clerk 4.29.9 para auth (patterns ya establecidos en Epic 1)
- shadcn/ui para form components
- React Hook Form 7.52.2 + Zod 3.23.8

**Patrones Críticos del Epic 1 (Retrospectiva):**
1. ✅ **RLS OBLIGATORIO**: ENABLE + FORCE RLS en tabla companies
2. ✅ **Queries con Supabase Client**: NO usar Prisma directo (bypasea RLS)
3. ✅ **Validación de tenant_id**: Extraer de Clerk metadata `user.publicMetadata.tenant_id`
4. ✅ **Unicidad dentro de tenant**: Constraint `@@unique([tenantId, taxId])`
5. ✅ **Error handling**: ConflictError (409) si taxId duplicado
6. ✅ **Soft delete**: Campo `is_active` (no DELETE físico)
7. ✅ **UUID validation**: Validar formato UUID del tenant_id
8. ✅ **JSDoc OBLIGATORIO**: Documentar todas las funciones públicas

**Errores a NO Repetir del Epic 1:**
- ❌ NO usar SECURITY DEFINER en funciones RPC (bypassea RLS)
- ❌ NO usar service role key en frontend (usar anon key)
- ❌ NO olvidar FORCE RLS (solo ENABLE no es suficiente)
- ❌ NO asumir validación - SIEMPRE validar inputs con Zod
- ❌ NO olvidar indices compuestos `(tenant_id, ...)`

### Database Schema

```prisma
model Company {
  id               String   @id @default(uuid()) @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  name             String   @db.VarChar(255)
  taxId            String   @map("tax_id") @db.VarChar(50)
  email            String?  @db.VarChar(255)
  phone            String?  @db.VarChar(50)
  address          String?  @db.Text
  industry         String?  @db.VarChar(100)
  paymentTermsDays Int      @default(30) @map("payment_terms_days")
  riskLevel        String   @default("medio") @map("risk_level") @db.VarChar(20)
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @default(now()) @updatedAt @map("updated_at")

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  contacts    Contact[]
  invoices    Invoice[]
  collections Collection[]

  @@unique([tenantId, taxId])
  @@index([tenantId])
  @@map("companies")
}
```

**RLS Policies SQL:**
```sql
-- Migration manual después de prisma migrate dev

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "tenant_isolation_select" ON companies
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy INSERT
CREATE POLICY "tenant_isolation_insert" ON companies
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy UPDATE
CREATE POLICY "tenant_isolation_update" ON companies
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy DELETE (soft delete via is_active)
CREATE POLICY "tenant_isolation_delete" ON companies
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Validation Schema

```typescript
// src/lib/validations/company-schema.ts

import { z } from 'zod';

/**
 * Schema de validación para crear una empresa cliente.
 *
 * @remarks
 * - taxId debe ser único dentro del tenant (validado en DB)
 * - email es opcional pero debe ser válido si se proporciona
 * - paymentTermsDays default 30
 * - riskLevel default "medio"
 */
export const companySchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(255),
  taxId: z.string().min(1, "Tax ID requerido").max(50),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  paymentTermsDays: z.number().int().min(1).default(30),
  riskLevel: z.enum(["bajo", "medio", "alto"]).default("medio"),
});

export type CompanyFormData = z.infer<typeof companySchema>;
```

### API Implementation Pattern

```typescript
// src/app/api/companies/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { companySchema } from '@/lib/validations/company-schema';
import { createCompany } from '@/lib/services/company-service';
import { getTenantId } from '@/lib/auth/get-tenant-id';

/**
 * API endpoint para crear una nueva empresa.
 *
 * @route POST /api/companies
 * @auth Requiere autenticación con Clerk
 * @throws {401} Si no está autenticado
 * @throws {400} Si los datos son inválidos
 * @throws {409} Si el taxId ya existe para este tenant
 */
export async function POST(request: Request) {
  try {
    // 1. Auth
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get tenant_id from Clerk metadata
    const tenantId = await getTenantId(userId);

    // 3. Validate input
    const body = await request.json();
    const result = companySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    // 4. Business logic
    const company = await createCompany(result.data, tenantId);

    // 5. Response
    return NextResponse.json(company, { status: 201 });

  } catch (error) {
    // 6. Error handling
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API endpoint para listar empresas del tenant.
 *
 * @route GET /api/companies
 * @auth Requiere autenticación con Clerk
 */
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    const companies = await getCompanies(tenantId);

    return NextResponse.json(companies);

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Service Implementation

```typescript
// src/lib/services/company-service.ts

import { createClient } from '@/lib/db/supabase';
import { ConflictError } from '@/lib/errors/app-errors';
import type { CompanyFormData } from '@/lib/validations/company-schema';

/**
 * Crea una nueva empresa cliente en el sistema.
 *
 * @param data - Datos de la empresa validados con Zod
 * @param tenantId - ID del tenant (UUID validado)
 * @returns Promise con la empresa creada
 * @throws {ConflictError} Si el taxId ya existe para este tenant
 *
 * @example
 * ```ts
 * const company = await createCompany(data, tenantId);
 * ```
 */
export async function createCompany(data: CompanyFormData, tenantId: string) {
  const supabase = createClient();

  // Set tenant context for RLS
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  // Check if taxId already exists (RLS automáticamente filtra por tenant)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('tax_id', data.taxId)
    .single();

  if (existing) {
    throw new ConflictError('RFC/Tax ID ya registrado');
  }

  // Create company
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      tax_id: data.taxId,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      industry: data.industry || null,
      payment_terms_days: data.paymentTermsDays,
      risk_level: data.riskLevel,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return company;
}

/**
 * Obtiene todas las empresas del tenant.
 *
 * @param tenantId - ID del tenant
 * @returns Promise con lista de empresas
 */
export async function getCompanies(tenantId: string) {
  const supabase = createClient();

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data;
}
```

### Form Component Pattern

```typescript
// src/components/forms/company-form.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, type CompanyFormData } from '@/lib/validations/company-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState } from 'react';

/**
 * Formulario para crear una empresa cliente.
 *
 * @component
 * @param props - Las propiedades del componente
 * @param props.onSuccess - Callback ejecutado al guardar exitosamente
 * @returns Formulario de empresa con validaciones
 *
 * @example
 * ```tsx
 * <CompanyForm onSuccess={() => router.push('/companies')} />
 * ```
 */
export function CompanyForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      industry: '',
      paymentTermsDays: 30,
      riskLevel: 'medio',
    },
  });

  async function onSubmit(data: CompanyFormData) {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();

        // 409 Conflict - taxId duplicado
        if (res.status === 409) {
          setApiError(error.error);
          // NO limpiar formulario en caso de error
          return;
        }

        throw new Error(error.error || 'Error al crear empresa');
      }

      onSuccess();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {apiError}
          </div>
        )}

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

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RFC/Tax ID *</FormLabel>
              <FormControl>
                <Input placeholder="RFC o Tax ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="Dirección completa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industria</FormLabel>
              <FormControl>
                <Input placeholder="ej: Tecnología, Retail" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentTermsDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Días de Crédito</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="riskLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel de Riesgo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Empresa'}
        </Button>
      </form>
    </Form>
  );
}
```

### File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── companies/
│   │       ├── page.tsx                 # Lista (Task 5)
│   │       └── new/
│   │           └── page.tsx             # Nueva empresa (Task 4)
│   └── api/
│       └── companies/
│           └── route.ts                 # POST & GET (Task 1, 6)
│
├── components/
│   └── forms/
│       └── company-form.tsx             # Form component (Task 3)
│
├── lib/
│   ├── services/
│   │   └── company-service.ts           # Business logic (Task 2)
│   └── validations/
│       └── company-schema.ts            # Zod schema (Task 0.3)
│
└── prisma/
    ├── schema.prisma                     # Company model (Task 0.1)
    └── migrations/
        └── XXXXXX_add_company_model/
            └── migration.sql             # Generated + RLS manual (Task 0.2)
```

### Testing Requirements

**RLS Isolation Tests (CRÍTICO):**
```typescript
// tests/rls/company-isolation.test.ts

describe('Company RLS Isolation', () => {
  it('should not allow tenant A to see tenant B companies', async () => {
    // Setup: Create 2 tenants with companies
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');

    const companyA = await createCompany({ name: 'Company A', taxId: 'RFC-A' }, tenantA.id);
    const companyB = await createCompany({ name: 'Company B', taxId: 'RFC-B' }, tenantB.id);

    // Test: Tenant A tries to query all companies
    const supabaseA = createClientForTenant(tenantA.id);
    const { data } = await supabaseA.from('companies').select('*');

    // Assert: Should only see Company A
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(companyA.id);
    expect(data).not.toContainEqual(expect.objectContaining({ id: companyB.id }));
  });

  it('should enforce unique taxId per tenant (allow same taxId in different tenants)', async () => {
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');

    // Same taxId in different tenants - should SUCCEED
    const companyA = await createCompany({ name: 'Company A', taxId: 'RFC-123' }, tenantA.id);
    const companyB = await createCompany({ name: 'Company B', taxId: 'RFC-123' }, tenantB.id);

    expect(companyA.tax_id).toBe('RFC-123');
    expect(companyB.tax_id).toBe('RFC-123');

    // Same taxId in SAME tenant - should FAIL
    await expect(
      createCompany({ name: 'Company C', taxId: 'RFC-123' }, tenantA.id)
    ).rejects.toThrow(ConflictError);
  });
});
```

**Integration Tests:**
```typescript
// tests/api/companies.test.ts

describe('POST /api/companies', () => {
  it('should create company with valid data', async () => {
    const res = await fetch('/api/companies', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Company',
        taxId: 'RFC-TEST',
        email: 'test@company.com',
        paymentTermsDays: 30,
        riskLevel: 'medio'
      }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(201);
    const company = await res.json();
    expect(company.name).toBe('Test Company');
    expect(company.tenant_id).toBe(testTenantId);
  });

  it('should return 409 if taxId already exists', async () => {
    // Create first company
    await createCompany({ name: 'Company 1', taxId: 'RFC-DUP' }, testTenantId);

    // Try to create with same taxId
    const res = await fetch('/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name: 'Company 2', taxId: 'RFC-DUP' }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` }
    });

    expect(res.status).toBe(409);
    const error = await res.json();
    expect(error.error).toContain('ya registrado');
  });
});
```

### Performance Considerations

**Index Strategy:**
- Primary index: `id` (UUID, auto-indexed)
- Composite unique: `(tenant_id, tax_id)` - Garantiza unicidad y lookup rápido
- Tenant filtering: `tenant_id` - RLS queries automáticamente filtran por esto

**Expected Performance:**
- Lista de empresas (<100 records): <200ms
- Crear empresa: <300ms
- Validación de taxId duplicado: <100ms (index lookup)

### Security Checklist (Epic 1 Lessons)

- [ ] ✅ RLS ENABLED en tabla companies
- [ ] ✅ RLS FORCED en tabla companies
- [ ] ✅ Policies para SELECT, INSERT, UPDATE, DELETE
- [ ] ✅ Queries usan Supabase Client (no Prisma directo)
- [ ] ✅ tenant_id extraído de Clerk metadata
- [ ] ✅ UUID validation del tenant_id
- [ ] ✅ Input validation con Zod en API route
- [ ] ✅ Unique constraint `(tenant_id, tax_id)`
- [ ] ✅ Tests de aislamiento RLS
- [ ] ✅ Error handling apropiado (409 Conflict)

### References

- **[Source: docs/epics/epic-2-crm.md#Story-2.1]** - User story y criterios de aceptación
- **[Source: docs/architecture.md#Database-Schema]** - Schema completo de Company model
- **[Source: docs/architecture.md#Patrones-de-Implementación]** - Naming conventions, JSDoc standards
- **[Source: docs/architecture.md#ADR-1]** - Decisión de RLS Multi-Tenancy
- **[Source: docs/sprint-artifacts/epic-1-retro-2025-12-02.md#Security-Checklist]** - Lessons learned Epic 1

---

## Dev Agent Record

### Context Reference

Story contexted using BMad Method Ultimate Context Engine with comprehensive analysis of:
- Epic 2 complete specification (690 lines)
- Epic 1 Retrospective (808 lines) - Security lessons and 35 issues learned from
- Architecture document (1860 lines) - Complete stack and patterns
- Sprint status tracking
- Recent git commits showing established patterns

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Completion Notes

**Story Status:** ready-for-dev
**Preparation Required:** Epic 2 prep tasks (0.1, 0.2, 0.3) MUST be completed before implementing main tasks

**Critical Path:**
1. Schema + Migration (Task 0.1)
2. RLS Policies + Tests (Task 0.2)
3. Validation Schema (Task 0.3)
4. Then proceed with main implementation

**Dependencies:**
- Epic 1 MUST be completed (✅ DONE)
- Supabase + Clerk already configured
- shadcn/ui components available

**Estimated Effort:** 8-10 hours (including prep tasks and testing)

**Key Success Factors:**
- RLS isolation tests MUST pass before marking done
- taxId uniqueness validated within tenant
- Error handling for 409 Conflict implemented correctly
- JSDoc documentation for all public functions

### File List

Files to be created/modified:
- `prisma/schema.prisma` - Add Company model
- `prisma/migrations/XXXXXX_add_company_model/migration.sql` - Schema + RLS
- `src/lib/validations/company-schema.ts` - Zod schema
- `src/app/api/companies/route.ts` - POST & GET endpoints
- `src/lib/services/company-service.ts` - Business logic
- `src/components/forms/company-form.tsx` - Form component
- `src/app/(dashboard)/companies/page.tsx` - Lista
- `src/app/(dashboard)/companies/new/page.tsx` - Nueva empresa
- `tests/rls/company-isolation.test.ts` - RLS tests
- `tests/api/companies.test.ts` - Integration tests

---

**Generated:** 2025-12-02
**Epic:** 2 - CRM y Gestión de Clientes
**Priority:** High (blocks rest of Epic 2)
**Next Story:** 2-2-listar-y-editar-empresas (depends on 2-1 completion)
