---
stepsCompleted: [1]
workflowType: 'ux-design'
status: 'in_progress'
project_name: 'cobra-bmad'
user_name: 'Emilio'
date: '2025-12-01'
---

# UX/UI Design Specification - cobra-bmad

**Author:** Emilio
**Date:** 2025-12-01
**Version:** 1.0

---

## Design System Overview

### Stack de UI

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Tailwind CSS** | 3.4.x | Framework CSS utility-first |
| **shadcn/ui** | Latest | Componentes accesibles (Radix UI + Tailwind) |
| **Recharts** | 2.x | Gráficos y visualización de datos |
| **next-themes** | Latest | Soporte dark/light mode |
| **Lucide React** | Latest | Iconografía consistente |

### Principio Fundamental

> **REGLA DE ORO:** Utilizar EXCLUSIVAMENTE componentes de shadcn/ui. NO crear componentes custom de UI. Si se necesita funcionalidad que no existe en shadcn/ui, buscar en el ecosistema de shadcn/ui (blocks, extensiones) antes de crear algo nuevo.

---

## Sistema de Temas (Theme System)

### Arquitectura del Theme

El sistema de temas se basa en **CSS Custom Properties (Variables)** definidas en `app/globals.css`. Los colores se generan desde **TweakCN** y se pegan directamente en el archivo.

### Archivo de Theme: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ============================================
   * TEMA COBRA-BMAD - Generado desde TweakCN
   * Pegar aquí el código exportado de TweakCN
   * ============================================ */

  :root {
    /* === Core Colors === */
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);

    /* === Card & Popover === */
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);

    /* === Primary (Acción principal - Botones, Links activos) === */
    --primary: oklch(0.546 0.245 262.881);
    --primary-foreground: oklch(0.97 0.014 254.604);

    /* === Secondary (Acciones secundarias) === */
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);

    /* === Muted (Texto secundario, backgrounds sutiles) === */
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);

    /* === Accent (Highlights, hover states) === */
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);

    /* === Destructive (Errores, eliminar, peligro) === */
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.985 0 0);

    /* === Borders & Inputs === */
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);

    /* === Radius (Consistencia en bordes redondeados) === */
    --radius: 0.625rem;

    /* === Chart Colors (Para Recharts) === */
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);

    /* === Sidebar (Dashboard navigation) === */
    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.546 0.245 262.881);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);

    /* === Status Colors (Específicos de cobra-bmad) === */
    --status-pending: oklch(0.828 0.189 84.429);
    --status-overdue: oklch(0.577 0.245 27.325);
    --status-paid: oklch(0.6 0.118 184.704);
    --status-escalated: oklch(0.769 0.188 70.08);
    --status-active: oklch(0.546 0.245 262.881);
  }

  .dark {
    /* === Core Colors (Dark) === */
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);

    /* === Card & Popover (Dark) === */
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.269 0 0);
    --popover-foreground: oklch(0.985 0 0);

    /* === Primary (Dark) === */
    --primary: oklch(0.707 0.165 254.624);
    --primary-foreground: oklch(0.205 0 0);

    /* === Secondary (Dark) === */
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);

    /* === Muted (Dark) === */
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);

    /* === Accent (Dark) === */
    --accent: oklch(0.371 0 0);
    --accent-foreground: oklch(0.985 0 0);

    /* === Destructive (Dark) === */
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.985 0 0);

    /* === Borders & Inputs (Dark) === */
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);

    /* === Chart Colors (Dark) === */
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);

    /* === Sidebar (Dark) === */
    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.707 0.165 254.624);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.439 0 0);

    /* === Status Colors (Dark) === */
    --status-pending: oklch(0.828 0.189 84.429);
    --status-overdue: oklch(0.704 0.191 22.216);
    --status-paid: oklch(0.696 0.17 162.48);
    --status-escalated: oklch(0.769 0.188 70.08);
    --status-active: oklch(0.707 0.165 254.624);
  }
}

/* === Base Styles === */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Proceso de Actualización del Theme

1. **Ir a TweakCN:** https://tweakcn.com
2. **Personalizar colores** según identidad visual de cobra-bmad
3. **Exportar código CSS**
4. **Pegar en `app/globals.css`** reemplazando las variables existentes
5. **Mantener las variables custom** (`--status-*`) que son específicas de cobra-bmad

---

## Componentes shadcn/ui Requeridos

### Instalación Base

```bash
# Inicializar shadcn/ui en el proyecto
npx shadcn@latest init

# Instalar componentes necesarios
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add popover
npx shadcn@latest add command
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add progress
npx shadcn@latest add sidebar
npx shadcn@latest add chart
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
```

### Mapeo de Componentes por Funcionalidad

| Funcionalidad | Componente shadcn/ui | Uso en cobra-bmad |
|---------------|---------------------|-------------------|
| **Navegación** | Sidebar | Dashboard navigation |
| **Formularios** | Form, Input, Label, Select, Checkbox, Textarea, DatePicker | CRUD de empresas, contactos, facturas |
| **Tablas** | Table, DataTable | Listas de facturas, empresas, cobranzas |
| **Acciones** | Button, DropdownMenu | Botones de acción, menús contextuales |
| **Feedback** | Toast/Sonner, Alert, Progress | Notificaciones, alertas, estados de carga |
| **Modales** | Dialog, Sheet, AlertDialog | Confirmaciones, paneles laterales |
| **KPIs** | Card | Dashboard cards de métricas |
| **Gráficos** | Chart (Recharts wrapper) | Gráficos de facturas, DSO, actividad |
| **Estados** | Badge | Estados de facturas, cobranzas |
| **Usuarios** | Avatar | Identificación de usuarios |

---

## Patrones de UI por Dominio

### 1. Dashboard Principal

**Componentes:**
- `Card` para KPI cards
- `Chart` (BarChart, LineChart, AreaChart) para visualizaciones
- `Table` para listas recientes
- `Badge` para estados

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar │           Header (user, notifications)        │
│         ├───────────────────────────────────────────────┤
│ [Nav]   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐ │
│         │  │ KPI 1   │ │ KPI 2   │ │ KPI 3   │ │KPI 4│ │
│         │  │ Card    │ │ Card    │ │ Card    │ │Card │ │
│         │  └─────────┘ └─────────┘ └─────────┘ └─────┘ │
│         │  ┌───────────────────┐ ┌───────────────────┐ │
│         │  │   Chart           │ │   Chart           │ │
│         │  │   (Facturas)      │ │   (Actividad)     │ │
│         │  └───────────────────┘ └───────────────────┘ │
│         │  ┌─────────────────────────────────────────┐ │
│         │  │   Table (Facturas vencidas recientes)  │ │
│         │  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2. Listas (Empresas, Facturas, Cobranzas)

**Componentes:**
- `DataTable` con sorting, filtering, pagination
- `Button` para acciones (Crear nuevo)
- `DropdownMenu` para acciones por fila
- `Badge` para estados
- `Input` + `Select` para filtros

**Patrón de Tabla:**
```tsx
// Usar DataTable de shadcn/ui con TanStack Table
<DataTable
  columns={columns}
  data={data}
  filterableColumns={[
    { id: "status", title: "Estado" },
    { id: "company", title: "Empresa" }
  ]}
  searchableColumns={[
    { id: "invoiceNumber", title: "Número" }
  ]}
/>
```

### 3. Formularios (CRUD)

**Componentes:**
- `Form` (react-hook-form + zod)
- `Input`, `Textarea`, `Select`, `Checkbox`
- `DatePicker` para fechas
- `Button` para submit/cancel
- `Card` como contenedor

**Patrón de Form:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Nueva Empresa</CardTitle>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <FormField name="name" render={...} />
      <FormField name="taxId" render={...} />
      {/* ... */}
    </Form>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancelar</Button>
    <Button type="submit">Guardar</Button>
  </CardFooter>
</Card>
```

### 4. Bandeja de Respuestas (Supervisión)

**Componentes:**
- `Card` para cada respuesta
- `Badge` para intent/sugerencia IA
- `Button` para aprobar/rechazar
- `Sheet` para panel lateral de contexto
- `Tabs` para historial/detalles

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Bandeja de Respuestas (12 pendientes)            [Badge]│
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Card: Respuesta de Empresa X                        │ │
│ │ ┌──────────┐ "Les pago el viernes..."              │ │
│ │ │ Badge:   │                                        │ │
│ │ │ CONFIRM  │ [Aprobar] [Acción Manual] [Ver más]   │ │
│ │ └──────────┘                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Card: Respuesta de Empresa Y                        │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

[Sheet lateral al hacer click "Ver más"]
┌────────────────────────────┐
│ Contexto de Respuesta      │
├────────────────────────────┤
│ Tabs: [Factura] [Historial]│
│                            │
│ Detalle de factura...      │
│ Timeline de mensajes...    │
│                            │
│ [Aprobar] [Manual]         │
└────────────────────────────┘
```

### 5. Detalle de Collection (Timeline)

**Componentes:**
- `Card` como contenedor
- `Tabs` para secciones (Info, Mensajes, Respuestas)
- Custom timeline usando `Separator` + iconos
- `Badge` para estados de entrega

---

## Gráficos con Recharts + shadcn/ui

### Configuración de Chart

```tsx
// src/components/ui/chart.tsx - Ya viene con shadcn/ui
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Configuración de colores usando CSS variables
const chartConfig = {
  pending: {
    label: "Pendientes",
    color: "var(--status-pending)",
  },
  overdue: {
    label: "Vencidas",
    color: "var(--status-overdue)",
  },
  paid: {
    label: "Pagadas",
    color: "var(--status-paid)",
  },
} satisfies ChartConfig
```

### Tipos de Gráficos Permitidos

| Gráfico | Uso en cobra-bmad | Recharts Component |
|---------|-------------------|-------------------|
| **Bar Chart** | Facturas por estado, DSO por mes | `<BarChart>` |
| **Line Chart** | Tendencia de DSO | `<LineChart>` |
| **Area Chart** | Actividad de mensajes | `<AreaChart>` |
| **Pie Chart** | Distribución de estados (opcional) | `<PieChart>` |

### Ejemplo de Implementación

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { segment: "0-7 días", count: 12 },
  { segment: "8-15 días", count: 8 },
  { segment: "16-30 días", count: 5 },
  { segment: "30+ días", count: 3 },
]

const chartConfig = {
  count: {
    label: "Facturas",
    color: "var(--chart-1)",
  },
}

export function OverdueInvoicesChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="segment"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

---

## Badges de Estado

### Definición de Estados con Badge

```tsx
// src/lib/constants/statuses.ts

export const invoiceStatusConfig = {
  pendiente: {
    label: "Pendiente",
    variant: "outline" as const,
    className: "border-status-pending text-status-pending",
  },
  fecha_confirmada: {
    label: "Fecha Confirmada",
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  pagada: {
    label: "Pagada",
    variant: "default" as const,
    className: "bg-status-paid text-white",
  },
  escalada: {
    label: "Escalada",
    variant: "destructive" as const,
  },
  suspendida: {
    label: "Suspendida",
    variant: "outline" as const,
    className: "border-gray-400 text-gray-600",
  },
  cancelada: {
    label: "Cancelada",
    variant: "outline" as const,
    className: "border-gray-300 text-gray-400 line-through",
  },
}

export const collectionStatusConfig = {
  active: {
    label: "Activa",
    variant: "default" as const,
    className: "bg-status-active",
  },
  paused: {
    label: "Pausada",
    variant: "secondary" as const,
  },
  awaiting_response: {
    label: "Esperando Respuesta",
    variant: "outline" as const,
    className: "border-status-pending text-status-pending",
  },
  pending_review: {
    label: "Pendiente Revisión",
    variant: "destructive" as const,
  },
  completed: {
    label: "Completada",
    variant: "outline" as const,
    className: "border-status-paid text-status-paid",
  },
  escalated: {
    label: "Escalada",
    variant: "destructive" as const,
  },
}
```

### Uso de Badge

```tsx
import { Badge } from "@/components/ui/badge"
import { invoiceStatusConfig } from "@/lib/constants/statuses"

function InvoiceStatusBadge({ status }: { status: string }) {
  const config = invoiceStatusConfig[status]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
```

---

## Responsive Design

### Breakpoints (Tailwind Default)

| Breakpoint | Min Width | Uso |
|------------|-----------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Patrones Responsive

**Sidebar:**
- `lg+`: Sidebar fija visible
- `<lg`: Sidebar colapsable (Sheet)

**Tablas:**
- `lg+`: Todas las columnas
- `md`: Columnas prioritarias
- `<md`: Vista de cards en lugar de tabla

**Dashboard KPIs:**
- `xl+`: 4 cards en fila
- `lg`: 2 cards en fila
- `<lg`: 1 card en fila (stack)

---

## Accesibilidad (a11y)

### Requisitos Mínimos

1. **Contraste:** Todos los colores cumplen WCAG AA (4.5:1 para texto normal)
2. **Focus visible:** Usar `ring` de shadcn/ui para focus states
3. **Keyboard navigation:** Todos los componentes navegables con teclado
4. **Screen readers:** Labels descriptivos en formularios
5. **ARIA:** Los componentes de Radix UI incluyen ARIA por defecto

### Implementación

```tsx
// Los componentes de shadcn/ui ya incluyen accesibilidad
// Solo asegurar labels correctos:

<FormField
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email del contacto</FormLabel>
      <FormControl>
        <Input
          placeholder="contacto@empresa.com"
          {...field}
          aria-describedby="email-description"
        />
      </FormControl>
      <FormDescription id="email-description">
        Email principal para comunicaciones de cobranza
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Iconografía

### Librería: Lucide React

```bash
npm install lucide-react
```

### Iconos por Funcionalidad

| Funcionalidad | Icono | Import |
|---------------|-------|--------|
| Dashboard | `LayoutDashboard` | `lucide-react` |
| Empresas | `Building2` | `lucide-react` |
| Contactos | `Users` | `lucide-react` |
| Facturas | `FileText` | `lucide-react` |
| Cobranzas | `Send` | `lucide-react` |
| Respuestas | `MessageSquare` | `lucide-react` |
| Playbooks | `Workflow` | `lucide-react` |
| Configuración | `Settings` | `lucide-react` |
| Agregar | `Plus` | `lucide-react` |
| Editar | `Pencil` | `lucide-react` |
| Eliminar | `Trash2` | `lucide-react` |
| Ver | `Eye` | `lucide-react` |
| Email | `Mail` | `lucide-react` |
| WhatsApp | `MessageCircle` | `lucide-react` |
| Aprobar | `Check` | `lucide-react` |
| Rechazar | `X` | `lucide-react` |
| Alerta | `AlertTriangle` | `lucide-react` |
| Éxito | `CheckCircle` | `lucide-react` |
| Error | `XCircle` | `lucide-react` |

---

## Configuración de components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## Restricciones de Implementación

### ❌ NO HACER

1. **NO crear componentes UI custom** - Usar solo shadcn/ui
2. **NO usar otras librerías de componentes** (Material UI, Chakra, Ant Design, etc.)
3. **NO crear gráficos con SVG manual** - Usar Recharts con wrapper de shadcn/ui
4. **NO hardcodear colores** - Usar CSS variables del theme
5. **NO ignorar dark mode** - Todos los componentes deben funcionar en ambos modos
6. **NO crear estilos inline** - Usar Tailwind classes

### ✅ SÍ HACER

1. **Usar shadcn/ui para todo** - Componentes probados y accesibles
2. **Extender con cn()** - Para variantes específicas
3. **Usar CSS variables** - Para colores y spacing consistente
4. **Consultar Context7** - Para documentación actualizada de shadcn/ui
5. **Pegar theme de TweakCN** - Para personalización de colores
6. **Mantener consistencia** - Mismo patrón en todas las pantallas

---

## Flujo de Trabajo para Desarrolladores

### Al crear una nueva pantalla:

1. **Identificar componentes necesarios** de la lista de shadcn/ui
2. **Instalar si no existen:** `npx shadcn@latest add [component]`
3. **Usar el patrón correspondiente** de esta guía
4. **Aplicar estados con Badge** según configuración
5. **Usar iconos de Lucide** según mapeo
6. **Verificar dark mode** funcione correctamente
7. **Verificar responsive** en todos los breakpoints

### Al actualizar el theme:

1. Ir a **TweakCN**
2. Ajustar colores
3. Exportar CSS
4. Pegar en `app/globals.css`
5. Mantener variables `--status-*` custom
6. Verificar que charts usen las nuevas variables

---

## Referencias

- **shadcn/ui Docs:** https://ui.shadcn.com
- **TweakCN:** https://tweakcn.com
- **Recharts:** https://recharts.org
- **Tailwind CSS:** https://tailwindcss.com
- **Lucide Icons:** https://lucide.dev
- **Radix UI:** https://radix-ui.com

---

**Documento Actualizado:** 2025-12-01
**Estado:** ✅ COMPLETO - LISTO PARA IMPLEMENTACIÓN
