# Cobra Collections Platform

SaaS B2B de automatización de cobranzas con IA.

## Stack Tecnológico

- **Framework:** Next.js 14.2.13 (App Router)
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Clerk (Multi-tenant JWT)
- **ORM:** Prisma 5.x
- **UI:** shadcn/ui + Tailwind CSS
- **Deployment:** Vercel

## Setup Inicial

### 1. Instalar Dependencias
```bash
pnpm install
```

### 2. Configurar Variables de Entorno
Crear `.env.local` basado en `.env.example`:
```bash
cp .env.example .env.local
```

Configurar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

### 3. Aplicar Migraciones de Base de Datos
```bash
pnpm prisma migrate dev
```

### 4. Ejecutar Seed de Datos Demo (Opcional)
```bash
pnpm prisma db seed
```

Esto crea:
- Tenant "Demo Corp" (slug: `demo`)
- Usuario admin: `admin@demo.com`

### 5. Iniciar Servidor de Desarrollo
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Gestión de Base de Datos

| Comando | Descripción |
|---------|-------------|
| `pnpm prisma migrate dev` | Aplicar migraciones en desarrollo |
| `pnpm prisma db seed` | Ejecutar seed de datos demo (idempotente) |
| `pnpm prisma migrate reset` | Reset completo (elimina datos, re-aplica migraciones + seed) |
| `pnpm prisma studio` | Abrir Prisma Studio (GUI para DB) |
| `pnpm prisma generate` | Regenerar Prisma Client |

## Estructura del Proyecto

```
cobra-bmad/
├── docs/                    # Documentación técnica
│   ├── prd.md              # Product Requirements Document
│   ├── architecture.md     # ADRs y decisiones técnicas
│   ├── ux-design.md        # Sistema de diseño
│   ├── epics/              # Épicas e historias de usuario
│   └── sprint-artifacts/   # Stories en desarrollo
├── prisma/
│   ├── schema.prisma       # Schema de base de datos
│   └── seed.ts             # Script de seed
├── src/
│   ├── app/                # App Router (Next.js 14)
│   ├── lib/                # Utilidades y helpers
│   │   ├── auth/           # Autenticación (Clerk + Tenant)
│   │   ├── db/             # Supabase client (RLS)
│   │   ├── config/         # Configuración
│   │   └── utils/          # Helpers generales
│   └── types/              # TypeScript types
└── .bmad/                  # BMAD workflow config
```

## Scripts Comunes

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo (puerto 3000)
pnpm build            # Build de producción
pnpm start            # Servidor de producción
pnpm lint             # Ejecutar ESLint
pnpm type-check       # Verificar tipos TypeScript

# Base de Datos
pnpm prisma migrate dev       # Nueva migración
pnpm prisma db seed          # Ejecutar seed
pnpm prisma studio           # GUI de base de datos
```

## Arquitectura Multi-Tenant

### Row Level Security (RLS)
Todas las queries usan RLS para filtrar por `tenant_id`:
```typescript
import { getSupabaseClient } from '@/lib/db/supabase';
import { getTenantId } from '@/lib/auth/get-tenant-id';

const tenantId = await getTenantId(); // Desde Clerk JWT
const supabase = await getSupabaseClient(tenantId); // RLS aplicado
const { data } = await supabase.from('companies').select('*');
```

### Autenticación
- **Clerk** maneja autenticación de usuarios
- **Custom JWT Claim** `tenant_id` en sesión
- **Webhook** auto-crea tenant al registrarse nuevo usuario
- **Middleware** protege rutas (`/dashboard/*`)

## Documentación Técnica

- **[PRD](docs/prd.md)** - Requisitos del producto
- **[Architecture](docs/architecture.md)** - ADRs y decisiones técnicas
- **[UX Design](docs/ux-design.md)** - Sistema de diseño
- **[Epics Index](docs/epics/index.md)** - Todas las historias de usuario

## Deployment

- **Platform:** Vercel
- **Repository:** GitHub
- **Branch Strategy:** `master` → production
- **Environment:** Variables configuradas en Vercel Dashboard

Ver [docs/deployment.md](docs/deployment.md) para detalles.

## Support

Para issues o preguntas, ver [docs/epics/](docs/epics/) para contexto de historias.
