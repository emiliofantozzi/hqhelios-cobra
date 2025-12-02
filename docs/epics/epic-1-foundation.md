---
id: epic-1
title: "Foundation Setup"
status: pending
priority: critical
dependencies: []
stories_count: 4
frs_covered: [FR1, FR2, FR3, FR4]
---

# Epic 1: Foundation Setup 🏗️

## Objetivo
Configurar la infraestructura segura multi-tenant lista para recibir datos.

## Valor para el Usuario
Sistema seguro donde cada organización tiene sus datos completamente aislados, con autenticación enterprise y registro self-service.

## FRs Cubiertos
- **FR1:** Configurar Supabase con RLS multi-tenant
- **FR2:** Integrar Clerk con custom claims tenant_id
- **FR3:** Auto-registro con creación de tenant
- **FR4:** Seed data de tenant demo

## Contexto Técnico

### ADRs Aplicables
- **ADR #1:** RLS en Supabase con tenant_id en todas las tablas
- **ADR #5:** Stack Next.js 14 + Supabase + Clerk + Vercel

### Stack Relevante
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14.2.13 | App Router |
| Supabase | 2.45.0 | DB + RLS |
| Clerk | 4.29.9 | Auth + JWT |
| Prisma | 5.18.0 | Migrations |

### Schema (Prisma)
```prisma
model Tenant {
  id              String    @id @default(uuid()) @db.Uuid
  name            String    @db.VarChar(255)
  slug            String    @unique @db.VarChar(100)
  timezone        String    @default("America/Mexico_City")
  defaultCurrency String    @default("USD")
  planType        String    @default("trial")
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  users     User[]
  companies Company[]
  // ... otras relaciones
}

model User {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @db.Uuid
  clerkUserId String   @unique
  email       String
  firstName   String
  lastName    String
  role        String   @default("admin")
  isActive    Boolean  @default(true)

  tenant Tenant @relation(fields: [tenantId], references: [id])
}
```

---

## Stories

### Story 1.1: Configurar Supabase con RLS Multi-Tenant

**Como** desarrollador,
**Quiero** configurar Supabase con Row Level Security,
**Para que** los datos de cada tenant estén completamente aislados.

#### Criterios de Aceptación

**Scenario: Migraciones ejecutadas correctamente**
```gherkin
Given el proyecto Supabase está creado
When se ejecutan las migraciones de Prisma
Then las tablas tenants y users existen con estructura correcta
And RLS está habilitado en ambas tablas
```

**Scenario: Aislamiento de datos funciona**
```gherkin
Given existen 2 tenants: A y B
And usuario de tenant A está autenticado
When ejecuta query SELECT en cualquier tabla
Then solo ve datos de tenant A
And datos de tenant B son invisibles
```

**Scenario: Queries sin tenant fallan**
```gherkin
Given RLS está habilitado
When se ejecuta query sin app.current_tenant_id configurado
Then la query retorna 0 resultados o error
```

#### Notas Técnicas
- **Archivo principal:** `prisma/schema.prisma`
- **Migraciones:** `prisma/migrations/`
- **RLS SQL:**
```sql
-- Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy de aislamiento
CREATE POLICY "tenant_isolation" ON tenants
FOR ALL USING (id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON users
FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```
- **Testing obligatorio:** Crear script que verifica aislamiento entre 2 tenants

#### Prerequisitos
Ninguno (primera story)

---

### Story 1.2: Integrar Clerk con Custom Claims

**Como** desarrollador,
**Quiero** integrar Clerk con custom claims de tenant_id en JWT,
**Para que** Supabase RLS pueda filtrar queries automáticamente.

#### Criterios de Aceptación

**Scenario: JWT incluye tenant_id**
```gherkin
Given Clerk está configurado
When un usuario hace login
Then el JWT incluye custom claim tenant_id
And el claim es un UUID válido
```

**Scenario: Webhook sincroniza usuarios**
```gherkin
Given usuario se registra en Clerk
When Clerk envía webhook user.created
Then se crea registro en tabla users
And user.clerkUserId = clerk_user_id
And user.tenantId = tenant del registro
```

**Scenario: Middleware protege rutas**
```gherkin
Given usuario no autenticado
When intenta acceder a /dashboard
Then es redirigido a /sign-in
```

**Scenario: Supabase recibe tenant_id**
```gherkin
Given usuario autenticado con tenant_id en JWT
When se crea cliente Supabase
Then app.current_tenant_id está configurado
And queries respetan RLS automáticamente
```

#### Notas Técnicas
- **Configuración Clerk:** Dashboard > JWT Templates > Add claim `tenant_id`
- **Variables de entorno:**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET`
- **Archivos:**
  - `src/middleware.ts` - Auth middleware
  - `src/app/api/webhooks/clerk/route.ts` - Webhook handler
  - `src/lib/db/supabase.ts` - Cliente con tenant_id
- **Cliente Supabase con RLS:**
```typescript
export async function getSupabaseClient() {
  const { userId } = auth();
  if (!userId) throw new Error('Not authenticated');

  const user = await clerkClient.users.getUser(userId);
  const tenantId = user.publicMetadata.tenant_id as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId
  });

  return supabase;
}
```

#### Prerequisitos
- Story 1.1 completada

---

### Story 1.3: Auto-Registro con Creación de Tenant

**Como** nuevo usuario,
**Quiero** registrarme y que se cree automáticamente mi organización,
**Para que** pueda empezar a usar el sistema inmediatamente.

#### Criterios de Aceptación

**Scenario: Registro exitoso crea tenant**
```gherkin
Given estoy en /sign-up
When completo el formulario con email y password
Then se crea un registro en tenants automáticamente
And tenant.slug es único (basado en email)
And mi usuario se crea con role = 'admin'
And soy redirigido a /dashboard
```

**Scenario: Email duplicado muestra error**
```gherkin
Given ya existe usuario con email@test.com
When intento registrarme con email@test.com
Then veo error "Email ya registrado"
And no se crea tenant duplicado
```

**Scenario: Slugs son únicos**
```gherkin
Given existe tenant con slug "emilio-abc123"
When otro usuario con email emilio@otro.com se registra
Then su slug es diferente "emilio-xyz789"
And no hay colisión
```

#### Notas Técnicas
- **Rutas:**
  - `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
  - `src/app/(auth)/layout.tsx`
- **Lógica de creación:** En webhook de Clerk o Server Action post-signup
- **Generación de slug:**
```typescript
function generateSlug(email: string): string {
  const base = email.split('@')[0].toLowerCase();
  const suffix = nanoid(6);
  return `${base}-${suffix}`;
}
```
- **Flujo:**
  1. Usuario completa signup en Clerk
  2. Webhook `user.created` llega a nuestra API
  3. Creamos tenant + user en transacción
  4. Actualizamos `publicMetadata.tenant_id` en Clerk

#### Prerequisitos
- Story 1.2 completada

---

### Story 1.4: Seed Data de Tenant Demo

**Como** desarrollador,
**Quiero** seed data de tenant de prueba,
**Para que** pueda desarrollar y testear sin registrarme cada vez.

#### Criterios de Aceptación

**Scenario: Seed crea tenant demo**
```gherkin
Given ejecuto pnpm prisma db seed
When el script completa
Then existe tenant "Demo Corp" con slug "demo"
And existe usuario admin@demo.com
And existen 3 empresas de ejemplo con contactos
And existen 10 facturas en estados variados
```

**Scenario: Seed es idempotente**
```gherkin
Given el seed ya se ejecutó una vez
When ejecuto el seed nuevamente
Then no hay errores de duplicados
And los datos existentes se actualizan (upsert)
```

**Scenario: Estados variados de facturas**
```gherkin
Given el seed completó
When reviso las facturas creadas
Then hay facturas en estado pendiente
And hay facturas vencidas (due_date < hoy)
And hay facturas pagadas
And hay al menos 1 factura con confirmed_payment_date
```

#### Notas Técnicas
- **Archivo:** `prisma/seed.ts`
- **Configuración package.json:**
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```
- **Datos de seed:**
  - Tenant: Demo Corp
  - Usuario: admin@demo.com (crear también en Clerk dev)
  - Empresas: 3 (Acme Corp, Tech Solutions, Global Trade)
  - Contactos: 2 por empresa (1 primary, 1 escalation)
  - Facturas: 10 con fechas y estados variados
- **Usar `upsert`** para idempotencia

#### Prerequisitos
- Story 1.3 completada

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] RLS probado con 2 tenants diferentes
- [ ] Webhook de Clerk funcionando en desarrollo
- [ ] Seed data ejecutable sin errores
- [ ] Documentación de setup en README
- [ ] Variables de entorno documentadas en .env.example

---

**Última actualización:** 2025-12-01
**Estado:** 🔜 Pendiente
