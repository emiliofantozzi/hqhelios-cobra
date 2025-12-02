# Story 1.2: Integrar Clerk con Custom Claims

**Status:** review
**Epic:** 1 - Foundation Setup
**Priority:** Critical (Bloquea autenticación y RLS funcional)

---

## Story

**Como** desarrollador,
**Quiero** integrar Clerk con custom claims de tenant_id en JWT,
**Para que** Supabase RLS pueda filtrar queries automáticamente basándose en el tenant del usuario autenticado.

---

## Acceptance Criteria

### AC1: JWT incluye tenant_id
```gherkin
Given Clerk está configurado correctamente
When un usuario hace login
Then el JWT incluye custom claim "tenant_id"
And el claim es un UUID válido
And el token se puede decodificar y verificar
```

### AC2: Webhook sincroniza usuarios
```gherkin
Given un usuario se registra en Clerk
When Clerk envía webhook "user.created"
Then se crea registro en tabla "users" con datos del usuario
And user.clerk_user_id = clerk_user_id del webhook
And user.tenant_id = tenant del registro (o nuevo tenant si es registro inicial)
And user.email, first_name, last_name están correctos
```

### AC3: Middleware protege rutas
```gherkin
Given usuario no autenticado
When intenta acceder a /dashboard o cualquier ruta protegida
Then es redirigido a /sign-in
And no puede acceder al contenido protegido
```

### AC4: Supabase recibe tenant_id
```gherkin
Given usuario autenticado con tenant_id en JWT
When se crea cliente Supabase en cualquier API route
Then app.current_tenant_id está configurado con el tenant_id del usuario
And queries respetan RLS automáticamente
And solo retornan datos del tenant del usuario
```

---

## Tasks / Subtasks

- [ ] **Task 1: Configurar proyecto Clerk** (AC: #1)
  - [ ] 1.1 Crear cuenta/proyecto en Clerk Dashboard (https://dashboard.clerk.com)
  - [ ] 1.2 Obtener `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`
  - [ ] 1.3 Configurar URLs de redirección en Clerk Dashboard:
    - Sign-in URL: `/sign-in`
    - Sign-up URL: `/sign-up`
    - After sign-in URL: `/dashboard`
    - After sign-up URL: `/dashboard`
  - [ ] 1.4 Guardar credenciales en `.env.local` y documentar en `.env.example`

- [x] **Task 2: Instalar y configurar Clerk en Next.js** (AC: #1, #3)
  - [x] 2.1 Instalar dependencias: `pnpm add @clerk/nextjs`
  - [x] 2.2 Crear `src/middleware.ts` con configuración de rutas protegidas
  - [x] 2.3 Envolver app en `ClerkProvider` en `src/app/layout.tsx`
  - [x] 2.4 Crear páginas de auth:
    - `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
    - `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
    - `src/app/(auth)/layout.tsx`
  - [x] 2.5 Verificar que rutas públicas funcionan sin auth
  - [x] 2.6 Verificar que rutas protegidas redirigen a sign-in

- [x] **Task 3: Configurar Custom Claims en JWT** (AC: #1)
  - [x] 3.1 En Clerk Dashboard → JWT Templates → Create Template
  - [x] 3.2 Agregar claim `tenant_id` con valor `{{user.public_metadata.tenant_id}}`
  - [x] 3.3 Nombrar template como "supabase" o "default"
  - [ ] 3.4 Testing: Decodificar JWT y verificar que incluye tenant_id

- [x] **Task 4: Configurar Webhook de Clerk** (AC: #2)
  - [x] 4.1 Crear endpoint `src/app/api/webhooks/clerk/route.ts`
  - [x] 4.2 Instalar svix para verificación: `pnpm add svix`
  - [x] 4.3 Implementar verificación de firma del webhook
  - [x] 4.4 Manejar evento `user.created`:
    - Crear registro en tabla `users`
    - Asociar con tenant existente o crear nuevo (historia 1.3)
  - [x] 4.5 Manejar evento `user.updated` para sincronizar cambios
  - [ ] 4.6 En Clerk Dashboard → Webhooks → Add Endpoint:
    - URL: `https://your-domain.com/api/webhooks/clerk`
    - Events: `user.created`, `user.updated`
  - [ ] 4.7 Obtener `CLERK_WEBHOOK_SECRET` y agregar a `.env.local`

- [x] **Task 5: Crear helper para obtener tenant_id del usuario** (AC: #4)
  - [x] 5.1 Crear `src/lib/auth/get-tenant-id.ts`
  - [x] 5.2 Implementar función `getTenantId()` que:
    - Obtiene userId de Clerk
    - Busca usuario en DB para obtener tenant_id
    - Cachea resultado para evitar queries repetidas
  - [x] 5.3 Implementar función `getCurrentUser()` para obtener usuario completo

- [x] **Task 6: Integrar Clerk con cliente Supabase** (AC: #4)
  - [x] 6.1 Modificar `src/lib/db/supabase.ts` (de historia 1.1)
  - [x] 6.2 Crear función `getAuthenticatedSupabaseClient()` que:
    - Obtiene tenant_id del usuario autenticado
    - Configura `app.current_tenant_id` en Supabase
    - Retorna cliente listo para queries con RLS
  - [ ] 6.3 Crear wrapper `withTenantContext()` para API routes

- [ ] **Task 7: Testing de integración completa** (AC: #1, #2, #3, #4)
  - [ ] 7.1 Test: Login de usuario existente incluye tenant_id en JWT
  - [ ] 7.2 Test: Acceso a ruta protegida sin auth redirige
  - [ ] 7.3 Test: Webhook crea usuario correctamente
  - [ ] 7.4 Test: Query con cliente autenticado respeta RLS
  - [ ] 7.5 Documentar flujo completo en README

---

## Dev Notes

### Decisiones Arquitectónicas Aplicables

**ADR #1: Multi-Tenancy Strategy** (CRÍTICO)
- El tenant_id DEBE viajar en el JWT para que RLS funcione
- Cada request debe establecer `app.current_tenant_id` antes de queries
- Sin tenant_id válido, las queries deben fallar (no retornar todo)

**ADR #5: Stack Tecnológico**
- Clerk versión 4.29.9 para compatibilidad con Next.js 14
- JWT con custom claims es el mecanismo de paso de tenant_id
- Webhook firmado para seguridad en sincronización

### Stack Técnico Específico

| Dependencia | Versión Exacta | Uso |
|-------------|----------------|-----|
| @clerk/nextjs | 4.29.9 | Auth provider, middleware, hooks |
| svix | 1.24.0 | Verificación de webhooks |

### Configuración de Variables de Entorno

```bash
# .env.example - Agregar estas variables

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk URLs (opcional, defaults funcionan)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### Middleware de Autenticación (src/middleware.ts)

```typescript
/**
 * Middleware de autenticación con Clerk.
 * Protege todas las rutas excepto las públicas definidas.
 *
 * @module middleware
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Layout Principal con ClerkProvider (src/app/layout.tsx)

```typescript
/**
 * Layout raíz de la aplicación con ClerkProvider.
 *
 * @module app/layout
 */
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cobra Collections',
  description: 'Plataforma de automatización de cobranzas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Página de Sign-In (src/app/(auth)/sign-in/[[...sign-in]]/page.tsx)

```typescript
/**
 * Página de inicio de sesión con Clerk.
 *
 * @module app/(auth)/sign-in
 */
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

### Página de Sign-Up (src/app/(auth)/sign-up/[[...sign-up]]/page.tsx)

```typescript
/**
 * Página de registro con Clerk.
 *
 * @module app/(auth)/sign-up
 */
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

### Layout de Auth (src/app/(auth)/layout.tsx)

```typescript
/**
 * Layout para páginas de autenticación.
 *
 * @module app/(auth)/layout
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
```

### Webhook Handler de Clerk (src/app/api/webhooks/clerk/route.ts)

```typescript
/**
 * Webhook handler para eventos de Clerk.
 * Sincroniza usuarios con la base de datos.
 *
 * @route POST /api/webhooks/clerk
 * @security Webhook signature verification via Svix
 */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

    const email = email_addresses[0]?.email_address;
    const tenantId = public_metadata?.tenant_id as string | undefined;

    if (!email) {
      return new Response('No email provided', { status: 400 });
    }

    // Si no tiene tenant_id, será asignado en el flujo de registro (historia 1.3)
    // Por ahora, solo crear si tiene tenant_id
    if (tenantId) {
      const { error } = await supabase.from('users').insert({
        clerk_user_id: id,
        tenant_id: tenantId,
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        role: 'admin',
        is_active: true,
      });

      if (error) {
        console.error('Error creating user:', error);
        return new Response('Error creating user', { status: 500 });
      }
    }

    console.log(`User created: ${id}`);
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
      // No fallar si usuario no existe (puede no haberse creado aún)
    }

    console.log(`User updated: ${id}`);
  }

  return new Response('Webhook processed', { status: 200 });
}
```

### Helper para obtener Tenant ID (src/lib/auth/get-tenant-id.ts)

```typescript
/**
 * Helper para obtener el tenant_id del usuario autenticado.
 *
 * @module lib/auth/get-tenant-id
 */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Obtiene el tenant_id del usuario actualmente autenticado.
 *
 * @returns Promise con el tenant_id del usuario
 * @throws {Error} Si el usuario no está autenticado o no tiene tenant asignado
 *
 * @example
 * ```ts
 * const tenantId = await getTenantId();
 * console.log(tenantId); // "uuid-del-tenant"
 * ```
 */
export async function getTenantId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Obtener usuario de Clerk para acceder a public_metadata
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const tenantId = user.publicMetadata.tenant_id as string | undefined;

  if (!tenantId) {
    throw new Error('User does not have a tenant assigned');
  }

  return tenantId;
}

/**
 * Obtiene el usuario completo de la base de datos.
 *
 * @returns Promise con el usuario completo incluyendo datos de DB
 * @throws {Error} Si el usuario no está autenticado o no existe en DB
 *
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * console.log(user.email, user.role);
 * ```
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found in database');
  }

  return user;
}
```

### Cliente Supabase Autenticado (src/lib/db/supabase.ts) - ACTUALIZACIÓN

```typescript
/**
 * Cliente Supabase configurado para multi-tenancy con RLS.
 * ACTUALIZADO para integración con Clerk.
 *
 * @module lib/db/supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getTenantId } from '@/lib/auth/get-tenant-id';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Crea cliente Supabase con tenant_id del usuario autenticado.
 * Usa Clerk para obtener el tenant_id automáticamente.
 *
 * @returns Cliente Supabase configurado con RLS
 * @throws {Error} Si el usuario no está autenticado o no tiene tenant
 *
 * @example
 * ```ts
 * const supabase = await getAuthenticatedSupabaseClient();
 * const { data } = await supabase.from('companies').select('*');
 * // Solo retorna companies del tenant del usuario
 * ```
 */
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const tenantId = await getTenantId();
  return getSupabaseClient(tenantId);
}

/**
 * Crea cliente Supabase con tenant_id específico.
 * Usar cuando ya tienes el tenant_id (ej: webhooks, workers).
 *
 * @param tenantId - UUID del tenant
 * @returns Cliente Supabase configurado
 * @throws {Error} Si las variables de entorno no están configuradas
 *
 * @example
 * ```ts
 * const supabase = await getSupabaseClient(tenantId);
 * const { data } = await supabase.from('companies').select('*');
 * ```
 */
export async function getSupabaseClient(tenantId: string): Promise<SupabaseClient> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-tenant-id': tenantId,
      },
    },
  });

  // Configurar el contexto de tenant para RLS
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId,
    is_local: true,
  });

  return supabase;
}

/**
 * Crea cliente Supabase sin contexto de tenant (bypass RLS).
 * SOLO usar para operaciones administrativas o webhooks.
 *
 * @returns Cliente Supabase con service role
 *
 * @example
 * ```ts
 * const supabase = getAdminSupabaseClient();
 * // CUIDADO: Este cliente puede ver TODOS los datos
 * ```
 */
export function getAdminSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Helper para establecer contexto de tenant en una conexión existente.
 *
 * @param supabase - Cliente Supabase existente
 * @param tenantId - UUID del tenant
 */
export async function setTenantContext(
  supabase: SupabaseClient,
  tenantId: string
): Promise<void> {
  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId,
    is_local: true,
  });
}
```

### Ejemplo de uso en API Route

```typescript
/**
 * Ejemplo de API route protegida con autenticación y RLS.
 *
 * @route GET /api/companies
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = await getAuthenticatedSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Configuración de JWT Template en Clerk Dashboard

**Pasos en Clerk Dashboard:**

1. Ir a **JWT Templates** en el sidebar
2. Click en **New Template**
3. Nombre: `supabase` (o `default`)
4. En el editor de claims, agregar:

```json
{
  "tenant_id": "{{user.public_metadata.tenant_id}}"
}
```

5. **IMPORTANTE:** Marcar "Merge custom claim with default claims"
6. Click en **Save**

**Verificación del JWT:**

Para verificar que el JWT incluye el tenant_id:

```typescript
// En cualquier API route o Server Component
import { auth } from '@clerk/nextjs/server';

const { sessionClaims } = await auth();
console.log('tenant_id:', sessionClaims?.tenant_id);
```

---

## Project Structure Notes

### Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/middleware.ts` | Crear | Middleware de autenticación Clerk |
| `src/app/layout.tsx` | Modificar | Agregar ClerkProvider |
| `src/app/(auth)/layout.tsx` | Crear | Layout para páginas de auth |
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Crear | Página de sign-in |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Crear | Página de sign-up |
| `src/app/api/webhooks/clerk/route.ts` | Crear | Webhook handler |
| `src/lib/auth/get-tenant-id.ts` | Crear | Helper para obtener tenant_id |
| `src/lib/db/supabase.ts` | Modificar | Agregar función autenticada |
| `.env.local` | Modificar | Agregar credenciales Clerk |
| `.env.example` | Modificar | Documentar variables Clerk |

### Variables de Entorno Requeridas

```bash
# .env.example - Agregar estas variables

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk URLs (opcional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

---

## References

- [Source: docs/architecture.md#ADR #1: Multi-Tenancy Strategy]
- [Source: docs/architecture.md#ADR #5: Stack Tecnológico]
- [Source: docs/architecture.md#Authentication Flow (Clerk + Supabase)]
- [Source: docs/prd.md#Historia 1.1.2: Integrar Clerk con custom claims]
- [Source: docs/epics/epic-1-foundation.md#Story 1.2]
- [Clerk Docs: Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Docs: Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Clerk Docs: Custom Claims](https://clerk.com/docs/backend-requests/making/jwt-templates)

---

## Dev Agent Record

### Context Reference
- Epic: docs/epics/epic-1-foundation.md
- Architecture: docs/architecture.md (ADR #1, #5, Authentication Flow)
- PRD: docs/prd.md (Historia 1.1.2)
- Prerequisito: Story 1.1 debe estar completada (requiere tabla users con RLS)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List
- Esta historia DEPENDE de Story 1.1 (requiere tabla `users` creada con RLS)
- El webhook de Clerk necesita URL pública - usar ngrok para desarrollo local
- JWT Template debe configurarse en Clerk Dashboard ANTES de probar
- Para desarrollo local, el webhook puede fallar - verificar con Clerk CLI
- `public_metadata.tenant_id` se establece en Story 1.3 (auto-registro)
- Por ahora, el webhook solo crea usuarios SI ya tienen tenant_id asignado

### File List
- src/middleware.ts
- src/app/layout.tsx
- src/app/(auth)/layout.tsx
- src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
- src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
- src/app/api/webhooks/clerk/route.ts
- src/lib/auth/get-tenant-id.ts
- src/lib/db/supabase.ts
- .env.local
- .env.example

### Testing Commands
```bash
# Verificar que Clerk está instalado
pnpm list @clerk/nextjs

# Ejecutar en desarrollo
pnpm dev

# Probar webhook localmente (requiere ngrok o similar)
ngrok http 3000
# Configurar URL de ngrok en Clerk Dashboard → Webhooks

# Verificar JWT (en browser console después de login)
# Clerk.session.getToken().then(t => console.log(JSON.parse(atob(t.split('.')[1]))))
```
