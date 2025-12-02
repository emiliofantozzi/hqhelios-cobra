# Story 1.3: Auto-Registro con Creación de Tenant

**Status:** ready-for-dev
**Epic:** 1 - Foundation Setup
**Priority:** Critical (Habilita onboarding de nuevos usuarios)

---

## Story

**Como** nuevo usuario,
**Quiero** registrarme y que se cree automáticamente mi organización (tenant),
**Para que** pueda empezar a usar el sistema inmediatamente sin configuración manual.

---

## Acceptance Criteria

### AC1: Registro exitoso crea tenant
```gherkin
Given estoy en /sign-up
When completo el formulario con email y password
Then se crea un registro en tabla "tenants" automáticamente
And tenant.slug es único (basado en email)
And tenant.name se genera del email (ej: "john" de john@empresa.com)
And mi usuario se crea con role = 'admin'
And soy redirigido a /dashboard
```

### AC2: Email duplicado muestra error
```gherkin
Given ya existe usuario con email@test.com registrado en Clerk
When intento registrarme con email@test.com
Then veo error "Email ya registrado" (manejado por Clerk)
And no se crea tenant duplicado
And la base de datos permanece consistente
```

### AC3: Slugs son únicos
```gherkin
Given existe tenant con slug "emilio-abc123"
When otro usuario con email emilio@otro.com se registra
Then su slug es diferente (ej: "emilio-xyz789")
And no hay colisión de slugs
And ambos tenants funcionan independientemente
```

### AC4: Usuario queda asociado a su tenant
```gherkin
Given completé el registro exitosamente
When hago login
Then mi JWT incluye el tenant_id correcto
And puedo acceder al dashboard
And solo veo datos de mi tenant (ninguno al inicio)
```

---

## Tasks / Subtasks

- [ ] **Task 1: Crear función de generación de slug único** (AC: #1, #3)
  - [ ] 1.1 Crear `src/lib/utils/generate-slug.ts`
  - [ ] 1.2 Implementar lógica: extraer base del email + nanoid(6)
  - [ ] 1.3 Agregar validación de caracteres permitidos (lowercase, números, guiones)
  - [ ] 1.4 Testing: Generar 100 slugs y verificar unicidad

- [ ] **Task 2: Modificar webhook de Clerk para crear tenant** (AC: #1, #3, #4)
  - [ ] 2.1 Modificar `src/app/api/webhooks/clerk/route.ts`
  - [ ] 2.2 En evento `user.created`:
    - Generar slug único
    - Crear tenant en transacción
    - Crear usuario asociado al tenant
    - Actualizar `publicMetadata.tenant_id` en Clerk
  - [ ] 2.3 Manejar errores y rollback si falla algún paso
  - [ ] 2.4 Logging de cada paso del proceso

- [ ] **Task 3: Actualizar public_metadata en Clerk** (AC: #4)
  - [ ] 3.1 Usar Clerk Backend SDK para actualizar usuario
  - [ ] 3.2 Establecer `publicMetadata.tenant_id` con el UUID del nuevo tenant
  - [ ] 3.3 Verificar que el JWT se regenera con el nuevo claim

- [ ] **Task 4: Crear página de dashboard vacío** (AC: #1)
  - [ ] 4.1 Crear `src/app/(dashboard)/page.tsx`
  - [ ] 4.2 Crear `src/app/(dashboard)/layout.tsx` con sidebar básico
  - [ ] 4.3 Mostrar mensaje de bienvenida para usuarios nuevos
  - [ ] 4.4 Proteger ruta con middleware (ya configurado en 1.2)

- [ ] **Task 5: Testing de flujo completo** (AC: #1, #2, #3, #4)
  - [ ] 5.1 Test E2E: Registro → Tenant creado → Usuario creado → Dashboard accesible
  - [ ] 5.2 Test: Registrar 2 usuarios con mismo nombre base de email
  - [ ] 5.3 Test: Verificar JWT incluye tenant_id correcto
  - [ ] 5.4 Test: Verificar aislamiento RLS funciona después de registro

---

## Dev Notes

### Decisiones Arquitectónicas Aplicables

**ADR #1: Multi-Tenancy Strategy**
- Cada usuario nuevo crea un tenant nuevo (modelo self-service)
- El tenant_id se almacena en Clerk `publicMetadata` para incluirlo en JWT
- RLS garantiza aislamiento desde el primer momento

**ADR #5: Stack Tecnológico**
- nanoid para generación de IDs únicos (más corto que UUID)
- Clerk Backend SDK para actualizar metadata del usuario

### Stack Técnico Específico

| Dependencia | Versión Exacta | Uso |
|-------------|----------------|-----|
| nanoid | 5.0.7 | Generación de sufijos únicos para slugs |

### Instalación de Dependencias

```bash
pnpm add nanoid
```

### Generador de Slug (src/lib/utils/generate-slug.ts)

```typescript
/**
 * Genera slugs únicos para tenants basados en email.
 *
 * @module lib/utils/generate-slug
 */
import { nanoid } from 'nanoid';

/**
 * Genera un slug único para un tenant basado en el email del usuario.
 *
 * @param email - Email del usuario que se registra
 * @returns Slug único en formato "base-xxxxxx"
 *
 * @example
 * ```ts
 * generateSlug('john.doe@empresa.com'); // "john-abc123"
 * generateSlug('MARIA@TEST.COM'); // "maria-xyz789"
 * ```
 */
export function generateSlug(email: string): string {
  // Extraer parte antes del @
  const base = email.split('@')[0].toLowerCase();

  // Limpiar caracteres no permitidos (solo letras, números, guiones)
  const cleanBase = base
    .replace(/[^a-z0-9-]/g, '-') // Reemplazar caracteres especiales con guión
    .replace(/-+/g, '-') // Eliminar guiones consecutivos
    .replace(/^-|-$/g, '') // Eliminar guiones al inicio/final
    .substring(0, 20); // Limitar longitud base

  // Agregar sufijo único
  const suffix = nanoid(6);

  return `${cleanBase}-${suffix}`;
}

/**
 * Genera un nombre de tenant basado en el email.
 *
 * @param email - Email del usuario
 * @returns Nombre legible para el tenant
 *
 * @example
 * ```ts
 * generateTenantName('john.doe@empresa.com'); // "John Doe"
 * generateTenantName('maria@test.com'); // "Maria"
 * ```
 */
export function generateTenantName(email: string): string {
  const base = email.split('@')[0];

  // Capitalizar y reemplazar puntos/guiones con espacios
  const name = base
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name || 'Mi Organización';
}
```

### Webhook Modificado (src/app/api/webhooks/clerk/route.ts)

```typescript
/**
 * Webhook handler para eventos de Clerk.
 * Crea tenant y usuario automáticamente en registro.
 *
 * @route POST /api/webhooks/clerk
 * @security Webhook signature verification via Svix
 */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateSlug, generateTenantName } from '@/lib/utils/generate-slug';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  // Obtener el webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // Obtener headers para verificación
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Obtener body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verificar webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Crear cliente Supabase con service role (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Manejar eventos
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error('No email provided for user:', clerkUserId);
      return new Response('No email provided', { status: 400 });
    }

    console.log(`Processing user.created for: ${email}`);

    try {
      // 1. Generar slug único para el tenant
      const slug = generateSlug(email);
      const tenantName = generateTenantName(email);

      console.log(`Generated slug: ${slug}, name: ${tenantName}`);

      // 2. Crear tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          slug: slug,
          timezone: 'America/Mexico_City',
          default_currency: 'USD',
          plan_type: 'trial',
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      console.log(`Tenant created: ${tenant.id}`);

      // 3. Crear usuario asociado al tenant
      const { error: userError } = await supabase.from('users').insert({
        clerk_user_id: clerkUserId,
        tenant_id: tenant.id,
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        role: 'admin',
        is_active: true,
      });

      if (userError) {
        console.error('Error creating user:', userError);
        // Rollback: eliminar tenant creado
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      console.log(`User created for tenant: ${tenant.id}`);

      // 4. Actualizar publicMetadata en Clerk con tenant_id
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          tenant_id: tenant.id,
        },
      });

      console.log(`Clerk metadata updated for user: ${clerkUserId}`);

      return new Response('User and tenant created successfully', { status: 200 });

    } catch (error) {
      console.error('Error in user.created handler:', error);
      return new Response(
        `Error processing registration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 500 }
      );
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    const { error } = await supabase
      .from('users')
      .update({
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error updating user:', error);
      // No fallar - el usuario podría no existir aún
    } else {
      console.log(`User updated: ${id}`);
    }

    return new Response('User update processed', { status: 200 });
  }

  // Evento no manejado
  console.log(`Unhandled event type: ${eventType}`);
  return new Response('Webhook processed', { status: 200 });
}
```

### Dashboard Layout (src/app/(dashboard)/layout.tsx)

```typescript
/**
 * Layout para el dashboard con sidebar y header.
 *
 * @module app/(dashboard)/layout
 */
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Cobra
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)]">
          <nav className="p-4 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/companies"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Empresas
            </Link>
            <Link
              href="/dashboard/invoices"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Facturas
            </Link>
            <Link
              href="/dashboard/collections"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cobranzas
            </Link>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Dashboard Page (src/app/(dashboard)/page.tsx)

```typescript
/**
 * Página principal del dashboard.
 * Muestra mensaje de bienvenida y KPIs básicos.
 *
 * @module app/(dashboard)/page
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-tenant-id';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Usuario nuevo, aún no tiene datos en DB
    // Esto puede pasar si el webhook no ha terminado de procesar
    console.log('User not found in DB yet, showing welcome message');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-gray-600 mt-1">
          Panel de control de cobranzas
        </p>
      </div>

      {/* Placeholder KPIs - se completarán en historias posteriores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Facturas Pendientes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Facturas Vencidas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Cobranzas Activas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Monto Pendiente</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$0.00</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          Comienza agregando tu primera empresa
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Para comenzar a usar Cobra, agrega tus empresas cliente y sus facturas.
          El sistema se encargará de automatizar el proceso de cobranzas.
        </p>
        <button
          disabled
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
        >
          Agregar Empresa (próximamente)
        </button>
      </div>
    </div>
  );
}
```

### Página Principal (src/app/page.tsx)

```typescript
/**
 * Página principal (landing) de la aplicación.
 *
 * @module app/page
 */
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();

  // Si ya está autenticado, redirigir al dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cobra Collections
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Automatiza tu proceso de cobranzas y cobra más rápido con menos esfuerzo.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## Project Structure Notes

### Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/lib/utils/generate-slug.ts` | Crear | Generador de slugs únicos |
| `src/app/api/webhooks/clerk/route.ts` | Modificar | Agregar lógica de creación de tenant |
| `src/app/(dashboard)/layout.tsx` | Crear | Layout del dashboard con sidebar |
| `src/app/(dashboard)/page.tsx` | Crear | Página principal del dashboard |
| `src/app/page.tsx` | Crear/Modificar | Landing page |

### Dependencias a Instalar

```bash
pnpm add nanoid
```

---

## References

- [Source: docs/architecture.md#ADR #1: Multi-Tenancy Strategy]
- [Source: docs/prd.md#Historia 1.1.3: Auto-Registro con Creación de Tenant]
- [Source: docs/epics/epic-1-foundation.md#Story 1.3]
- [Clerk Docs: Update User Metadata](https://clerk.com/docs/users/metadata)
- [nanoid Documentation](https://github.com/ai/nanoid)

---

## Dev Agent Record

### Context Reference
- Epic: docs/epics/epic-1-foundation.md
- Architecture: docs/architecture.md (ADR #1)
- PRD: docs/prd.md (Historia 1.1.3)
- Prerequisito: Story 1.1 y 1.2 deben estar completadas

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List
- Esta historia DEPENDE de Story 1.1 (tablas tenants/users) y Story 1.2 (Clerk configurado)
- El webhook DEBE ejecutarse antes de que el usuario acceda al dashboard
- Si el webhook falla, el usuario quedará sin tenant - manejar este edge case
- Para desarrollo local, usar ngrok y verificar logs del webhook
- El slug generado es inmutable después de creación
- Clerk puede tardar unos segundos en refrescar el JWT con el nuevo tenant_id

### File List
- src/lib/utils/generate-slug.ts
- src/app/api/webhooks/clerk/route.ts
- src/app/(dashboard)/layout.tsx
- src/app/(dashboard)/page.tsx
- src/app/page.tsx

### Testing Commands
```bash
# Instalar dependencia
pnpm add nanoid

# Ejecutar en desarrollo
pnpm dev

# Probar generación de slug (en consola Node)
node -e "const { generateSlug } = require('./src/lib/utils/generate-slug'); console.log(generateSlug('test@example.com'));"

# Verificar webhook con ngrok
ngrok http 3000
# Registrar nuevo usuario y verificar:
# 1. Tenant creado en DB
# 2. Usuario creado en DB
# 3. publicMetadata actualizado en Clerk Dashboard
```
