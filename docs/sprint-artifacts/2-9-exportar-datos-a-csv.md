# Story 2.9: Exportar Datos a CSV

**ID:** 2-9
**Epic:** Epic 2 - CRM y Gestión de Clientes
**Módulo:** Data Export (CSV)
**Prioridad:** Alta (Requerido para MVP según FR11)
**Estimación:** 3-4 horas
**Estado:** ready-for-dev
**Dependencias:** Story 2.1 (Companies), Story 2.3 (Contacts), Story 2.5 (Invoices)

---

## 📋 Descripción

### User Story
**Como** Miguel (Coordinador de Cobranzas),
**Quiero** exportar datos de empresas, contactos y facturas a formato CSV,
**Para que** pueda analizar la información en herramientas externas (Excel, Google Sheets) y mantener respaldos de los datos.

### Contexto de Negocio
Esta story resuelve la **necesidad de análisis externo** y **backup de datos**:
- **Análisis en Excel:** Usuarios prefieren pivot tables y gráficos en Excel
- **Integración con BI:** Exportar datos para Power BI, Tableau, etc.
- **Cumplimiento de FR11:** Requerimiento funcional del PRD
- **Respaldo selectivo:** Exportar subconjuntos de datos basados en filtros

El proceso es **client-side** para máxima performance:
- Sin carga en el servidor
- Exportación instantánea (< 1 segundo)
- Respeta filtros activos en la UI
- UTF-8 con BOM para compatibilidad con Excel

---

## ✅ Criterios de Aceptación

### AC1: Exportar Empresas a CSV
**Scenario:** Descargar todas las empresas
```gherkin
Given estoy en /dashboard/empresas
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "empresas-{timestamp}.csv"
And el archivo contiene headers:
  | Header             | Descripción                |
  | Nombre de Empresa  | Nombre completo            |
  | RUT/NIF            | Tax ID                     |
  | Email              | Email de contacto          |
  | Teléfono           | Teléfono principal         |
  | Dirección          | Dirección completa         |
  | Ciudad             | Ciudad                     |
  | País               | País                       |
  | Estado             | Activa/Inactiva            |
  | Fecha de Creación  | YYYY-MM-DD                 |
And todas las empresas de mi tenant están incluidas
```

### AC2: Exportar Contactos a CSV
**Scenario:** Descargar todos los contactos
```gherkin
Given estoy en /dashboard/contactos
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "contactos-{timestamp}.csv"
And el archivo contiene headers:
  | Header                  | Descripción                |
  | Nombre Completo         | Nombre del contacto        |
  | Email                   | Email de contacto          |
  | Teléfono                | Teléfono principal         |
  | Cargo                   | Puesto en la empresa       |
  | Empresa                 | Nombre de empresa          |
  | Estado                  | Activo/Inactivo            |
  | Es Contacto Principal   | Sí/No                      |
  | Fecha de Creación       | YYYY-MM-DD                 |
And todos los contactos de mi tenant están incluidos
```

### AC3: Exportar Facturas a CSV
**Scenario:** Descargar todas las facturas
```gherkin
Given estoy en /dashboard/facturas
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "facturas-{timestamp}.csv"
And el archivo contiene headers:
  | Header                | Descripción                    |
  | Número de Factura     | Invoice number                 |
  | Empresa               | Nombre de empresa              |
  | Contacto              | Nombre del contacto            |
  | Monto                 | Amount (decimal con 2 dígitos) |
  | Fecha de Emisión      | YYYY-MM-DD                     |
  | Fecha de Vencimiento  | YYYY-MM-DD                     |
  | Estado                | Payment status                 |
  | Descripción           | Descripción (opcional)         |
  | Fecha de Creación     | YYYY-MM-DD                     |
And todas las facturas de mi tenant están incluidas
```

### AC4: Filtros Aplicados al Export
**Scenario:** Export respeta filtros activos
```gherkin
Given estoy en /dashboard/facturas
And he aplicado filtro: estado = "pendiente"
And he aplicado filtro: empresa = "Empresa A"
When hago clic en "Exportar a CSV"
Then el CSV contiene SOLO las facturas que coinciden con los filtros
And NO contiene facturas con otros estados o empresas
```

**Scenario:** Export sin filtros exporta todo
```gherkin
Given estoy en /dashboard/empresas
And NO tengo filtros activos
When hago clic en "Exportar a CSV"
Then el CSV contiene TODAS las empresas de mi tenant
```

### AC5: Manejo de Datos Vacíos
**Scenario:** Campos opcionales vacíos
```gherkin
Given empresa tiene:
  | Campo       | Valor |
  | email       | null  |
  | telefono    | null  |
  | direccion   | ""    |
When exporto a CSV
Then campos vacíos se representan como cadenas vacías
And NO como "null" o "undefined"
```

### AC6: Codificación UTF-8 con BOM
**Scenario:** Caracteres especiales se exportan correctamente
```gherkin
Given tengo empresa con nombre "Peñaloza & Asociados"
And contacto con cargo "Gerente de Administración"
When exporto a CSV
Then abro el archivo en Excel
And los caracteres ñ, á, é se visualizan correctamente
And NO veo caracteres corruptos
```

**Technical Note:** Se usa UTF-8 con BOM (`\uFEFF`) para que Excel reconozca el encoding automáticamente.

### AC7: Multi-tenancy Enforcement
**Scenario:** Solo exporto datos de MI tenant
```gherkin
Given soy usuario del tenant "tenant-A"
And existen empresas en tenant "tenant-B"
When exporto empresas a CSV
Then el CSV contiene SOLO empresas de "tenant-A"
And NO contiene datos de otros tenants
```

---

## 🛠️ Especificación Técnica

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer (Client-side Export - No Server)             │
├─────────────────────────────────────────────────────────────┤
│ /dashboard/empresas/page.tsx                                │
│ /dashboard/contactos/page.tsx                               │
│ /dashboard/facturas/page.tsx                                │
│                                                              │
│ ┌────────────────────────────────────────────────┐         │
│ │ Export Button Component                         │         │
│ │ - Botón "Exportar a CSV" con icon Download     │         │
│ │ - onClick llama a handler de exportación        │         │
│ └────────────────────────────────────────────────┘         │
│                 ↓ Click                                      │
│ ┌────────────────────────────────────────────────┐         │
│ │ Export Handler (src/lib/exports/...)            │         │
│ │ - exportEmpresasToCSV(empresas)                 │         │
│ │ - exportContactosToCSV(contactos)               │         │
│ │ - exportFacturasToCSV(facturas)                 │         │
│ └────────────────────────────────────────────────┘         │
│                 ↓ Llama a                                    │
│ ┌────────────────────────────────────────────────┐         │
│ │ CSV Export Utility (src/lib/utils/csv-export.ts)│         │
│ │ - exportToCSV<T>(config)                        │         │
│ │   1. Construye headers                          │         │
│ │   2. Mapea datos a filas                        │         │
│ │   3. Formatea valores (escape de comas, etc.)   │         │
│ │   4. Genera Blob con UTF-8 BOM                  │         │
│ │   5. Trigger browser download                   │         │
│ └────────────────────────────────────────────────┘         │
│                 ↓ Download                                   │
│         Browser descarga archivo CSV                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decision:** Export es 100% client-side
- ✅ No carga en servidor
- ✅ Instantáneo (< 1 segundo para 1000 registros)
- ✅ Funciona offline (datos ya en cliente)
- ✅ Respeta RLS (datos ya filtrados por tenant)
- ⚠️ Limitado a datos ya cargados en UI (paginación)

---

### 1. CSV Export Utility (Core)

```typescript
// src/lib/utils/csv-export.ts (CREATE NEW)
import { format } from 'date-fns';

/**
 * Configuración para exportar datos a CSV
 *
 * @template T - Tipo de los objetos a exportar
 */
export interface ExportConfig<T> {
  /** Array de datos a exportar */
  data: T[];

  /** Nombre base del archivo (sin extensión) */
  filename: string;

  /** Definición de columnas CSV */
  columns: Array<{
    /** Header de la columna */
    header: string;

    /** Función para extraer valor del objeto */
    accessor: (row: T) => string | number | null | undefined;
  }>;
}

/**
 * Exporta datos a archivo CSV con UTF-8 BOM
 *
 * Features:
 * - UTF-8 con BOM para compatibilidad con Excel
 * - Escape automático de comas, comillas, newlines
 * - Timestamp en nombre de archivo
 * - Download inmediato vía browser
 *
 * @template T - Tipo de los objetos a exportar
 * @param config - Configuración de exportación
 *
 * @example
 * ```typescript
 * exportToCSV({
 *   data: empresas,
 *   filename: 'empresas',
 *   columns: [
 *     { header: 'Nombre', accessor: (e) => e.nombre },
 *     { header: 'RUT', accessor: (e) => e.rut_nif },
 *   ],
 * });
 * ```
 */
export function exportToCSV<T>(config: ExportConfig<T>): void {
  const { data, filename, columns } = config;

  // 1. Build CSV header row
  const headers = columns.map(col => col.header);

  // 2. Build CSV data rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = col.accessor(row);
      return formatCSVValue(value);
    })
  );

  // 3. Combine headers + rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // 4. Add UTF-8 BOM for Excel compatibility
  // BOM = Byte Order Mark
  // \uFEFF le indica a Excel que el archivo es UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  // 5. Trigger browser download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Formatea un valor para CSV
 *
 * Reglas:
 * - null/undefined → cadena vacía
 * - Valores con comas, comillas o newlines → wrapped en comillas
 * - Comillas dentro del valor → escaped como ""
 *
 * @param value - Valor a formatear
 * @returns String formateado para CSV
 */
function formatCSVValue(value: string | number | null | undefined): string {
  // Null/undefined → empty string
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Si contiene caracteres especiales, wrap en comillas y escape comillas internas
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
```

---

### 2. Export Handlers por Entidad

#### Empresas Export

```typescript
// src/lib/exports/export-empresas.ts (CREATE NEW)
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';
import type { Empresa } from '@/types/empresa';

/**
 * Exporta empresas a CSV
 *
 * Columnas exportadas:
 * - Nombre de Empresa
 * - RUT/NIF
 * - Email
 * - Teléfono
 * - Dirección
 * - Ciudad
 * - País
 * - Estado (Activa/Inactiva)
 * - Fecha de Creación
 *
 * @param empresas - Array de empresas a exportar
 */
export function exportEmpresasToCSV(empresas: Empresa[]): void {
  exportToCSV({
    data: empresas,
    filename: 'empresas',
    columns: [
      {
        header: 'Nombre de Empresa',
        accessor: (e) => e.nombre
      },
      {
        header: 'RUT/NIF',
        accessor: (e) => e.rut_nif
      },
      {
        header: 'Email',
        accessor: (e) => e.email || ''
      },
      {
        header: 'Teléfono',
        accessor: (e) => e.telefono || ''
      },
      {
        header: 'Dirección',
        accessor: (e) => e.direccion || ''
      },
      {
        header: 'Ciudad',
        accessor: (e) => e.ciudad || ''
      },
      {
        header: 'País',
        accessor: (e) => e.pais || ''
      },
      {
        header: 'Estado',
        accessor: (e) => e.activa ? 'Activa' : 'Inactiva'
      },
      {
        header: 'Fecha de Creación',
        accessor: (e) => format(new Date(e.created_at), 'yyyy-MM-dd')
      },
    ],
  });
}
```

#### Contactos Export

```typescript
// src/lib/exports/export-contactos.ts (CREATE NEW)
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';
import type { Contacto } from '@/types/contacto';

/**
 * Exporta contactos a CSV
 *
 * Columnas exportadas:
 * - Nombre Completo
 * - Email
 * - Teléfono
 * - Cargo
 * - Empresa (nombre)
 * - Estado (Activo/Inactivo)
 * - Es Contacto Principal (Sí/No)
 * - Fecha de Creación
 *
 * @param contactos - Array de contactos a exportar
 */
export function exportContactosToCSV(contactos: Contacto[]): void {
  exportToCSV({
    data: contactos,
    filename: 'contactos',
    columns: [
      {
        header: 'Nombre Completo',
        accessor: (c) => c.nombre_completo
      },
      {
        header: 'Email',
        accessor: (c) => c.email
      },
      {
        header: 'Teléfono',
        accessor: (c) => c.telefono || ''
      },
      {
        header: 'Cargo',
        accessor: (c) => c.cargo || ''
      },
      {
        header: 'Empresa',
        accessor: (c) => c.empresa?.nombre || ''
      },
      {
        header: 'Estado',
        accessor: (c) => c.activo ? 'Activo' : 'Inactivo'
      },
      {
        header: 'Es Contacto Principal',
        accessor: (c) => c.es_contacto_principal ? 'Sí' : 'No'
      },
      {
        header: 'Fecha de Creación',
        accessor: (c) => format(new Date(c.created_at), 'yyyy-MM-dd')
      },
    ],
  });
}
```

#### Facturas Export

```typescript
// src/lib/exports/export-facturas.ts (CREATE NEW)
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';
import type { Factura } from '@/types/factura';

/**
 * Exporta facturas a CSV
 *
 * Columnas exportadas:
 * - Número de Factura
 * - Empresa (nombre)
 * - Contacto (nombre)
 * - Monto (con 2 decimales)
 * - Fecha de Emisión
 * - Fecha de Vencimiento
 * - Estado
 * - Descripción
 * - Fecha de Creación
 *
 * @param facturas - Array de facturas a exportar
 */
export function exportFacturasToCSV(facturas: Factura[]): void {
  exportToCSV({
    data: facturas,
    filename: 'facturas',
    columns: [
      {
        header: 'Número de Factura',
        accessor: (f) => f.numero_factura
      },
      {
        header: 'Empresa',
        accessor: (f) => f.empresa?.nombre || ''
      },
      {
        header: 'Contacto',
        accessor: (f) => f.contacto?.nombre_completo || ''
      },
      {
        header: 'Monto',
        accessor: (f) => f.monto.toFixed(2)
      },
      {
        header: 'Fecha de Emisión',
        accessor: (f) => format(new Date(f.fecha_emision), 'yyyy-MM-dd')
      },
      {
        header: 'Fecha de Vencimiento',
        accessor: (f) => format(new Date(f.fecha_vencimiento), 'yyyy-MM-dd')
      },
      {
        header: 'Estado',
        accessor: (f) => f.estado
      },
      {
        header: 'Descripción',
        accessor: (f) => f.descripcion || ''
      },
      {
        header: 'Fecha de Creación',
        accessor: (f) => format(new Date(f.created_at), 'yyyy-MM-dd')
      },
    ],
  });
}
```

---

### 3. UI Integration

#### Botón de Export (Reutilizable)

Los botones se agregan a las páginas existentes:

**Empresas Page** (`src/app/dashboard/empresas/page.tsx`)
```typescript
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportEmpresasToCSV } from '@/lib/exports/export-empresas';

// ... en el componente
<Button onClick={() => exportEmpresasToCSV(empresas)}>
  <Download className="mr-2 h-4 w-4" />
  Exportar a CSV
</Button>
```

**Contactos Page** (`src/app/dashboard/contactos/page.tsx`)
```typescript
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportContactosToCSV } from '@/lib/exports/export-contactos';

// ... en el componente
<Button onClick={() => exportContactosToCSV(contactos)}>
  <Download className="mr-2 h-4 w-4" />
  Exportar a CSV
</Button>
```

**Facturas Page** (`src/app/dashboard/facturas/page.tsx`)
```typescript
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportFacturasToCSV } from '@/lib/exports/export-facturas';

// ... en el componente
<Button onClick={() => exportFacturasToCSV(facturas)}>
  <Download className="mr-2 h-4 w-4" />
  Exportar a CSV
</Button>
```

---

### 4. Types

```typescript
// src/types/empresa.ts (ALREADY EXISTS)
export interface Empresa {
  id: string;
  tenant_id: string;
  nombre: string;
  rut_nif: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/contacto.ts (ALREADY EXISTS)
export interface Contacto {
  id: string;
  tenant_id: string;
  empresa_id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  cargo: string | null;
  activo: boolean;
  es_contacto_principal: boolean;
  created_at: string;
  updated_at: string;
  empresa?: {
    nombre: string;
  };
}

// src/types/factura.ts (ALREADY EXISTS)
export interface Factura {
  id: string;
  tenant_id: string;
  empresa_id: string;
  contacto_id: string | null;
  numero_factura: string;
  monto: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  empresa?: {
    nombre: string;
  };
  contacto?: {
    nombre_completo: string;
  };
}
```

---

## 📦 Files to Create/Modify

### New Files (4 total)
```
src/
├── lib/
│   ├── utils/
│   │   └── csv-export.ts (CREATE) ✨
│   └── exports/
│       ├── export-empresas.ts (CREATE) ✨
│       ├── export-contactos.ts (CREATE) ✨
│       └── export-facturas.ts (CREATE) ✨
```

### Modified Files (3)
```
src/app/dashboard/
├── empresas/page.tsx (ADD export button) ✏️
├── contactos/page.tsx (ADD export button) ✏️
└── facturas/page.tsx (ADD export button) ✏️
```

### Dependencies
**No new dependencies required!** ✅
- `date-fns` - Already in project
- Native browser APIs - `Blob`, `URL.createObjectURL`, `document.createElement`

---

## 🧪 Testing Strategy

### Unit Tests - CSV Formatting

```typescript
// __tests__/lib/utils/csv-export.test.ts
import { describe, it, expect, vi } from 'vitest';
import { exportToCSV } from '@/lib/utils/csv-export';

describe('CSV Export Utility', () => {
  // Mock browser download
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    document.createElement = vi.fn((tag) => {
      if (tag === 'a') {
        return {
          setAttribute: vi.fn(),
          click: vi.fn(),
          style: {},
        } as any;
      }
      return {} as any;
    });
  });

  it('escapes commas in values', () => {
    const data = [{ name: 'Smith, John' }];

    exportToCSV({
      data,
      filename: 'test',
      columns: [
        { header: 'Name', accessor: (d) => d.name },
      ],
    });

    // Verify CSV content contains escaped value
    // (check Blob content in real test)
  });

  it('handles null values as empty strings', () => {
    const data = [{ email: null }];

    exportToCSV({
      data,
      filename: 'test',
      columns: [
        { header: 'Email', accessor: (d) => d.email },
      ],
    });

    // Verify empty string in CSV
  });

  it('escapes double quotes', () => {
    const data = [{ description: 'He said "hello"' }];

    exportToCSV({
      data,
      filename: 'test',
      columns: [
        { header: 'Description', accessor: (d) => d.description },
      ],
    });

    // Verify quotes are escaped as ""
  });

  it('includes UTF-8 BOM', () => {
    const data = [{ name: 'Peñaloza' }];

    exportToCSV({
      data,
      filename: 'test',
      columns: [
        { header: 'Name', accessor: (d) => d.name },
      ],
    });

    // Verify Blob starts with BOM \uFEFF
  });
});
```

### Integration Tests - Export Handlers

```typescript
// __tests__/lib/exports/export-empresas.test.ts
import { describe, it, expect } from 'vitest';
import { exportEmpresasToCSV } from '@/lib/exports/export-empresas';
import type { Empresa } from '@/types/empresa';

describe('Export Empresas', () => {
  it('exports all columns correctly', () => {
    const empresas: Empresa[] = [
      {
        id: '1',
        tenant_id: 't1',
        nombre: 'Empresa Test',
        rut_nif: 'RFC-123',
        email: 'test@test.com',
        telefono: '+1234567890',
        direccion: 'Calle 123',
        ciudad: 'Santiago',
        pais: 'Chile',
        activa: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportEmpresasToCSV(empresas);

    // Verify download was triggered
    // Verify CSV content matches expected format
  });

  it('handles empty optional fields', () => {
    const empresas: Empresa[] = [
      {
        id: '1',
        tenant_id: 't1',
        nombre: 'Empresa Test',
        rut_nif: 'RFC-123',
        email: null,
        telefono: null,
        direccion: null,
        ciudad: null,
        pais: null,
        activa: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportEmpresasToCSV(empresas);

    // Verify empty strings for null fields
  });
});
```

### Manual Testing Checklist

- [ ] Exportar empresas → verificar contenido en Excel
- [ ] Exportar contactos → verificar caracteres especiales (ñ, á, é)
- [ ] Exportar facturas → verificar formato de montos (2 decimales)
- [ ] Aplicar filtros → exportar → verificar solo datos filtrados
- [ ] Exportar 1000+ registros → verificar performance (< 2 segundos)
- [ ] Abrir CSV en Excel → verificar UTF-8 encoding correcto
- [ ] Abrir CSV en Google Sheets → verificar compatibilidad

---

## 🎯 Definition of Done

### Funcional
- [ ] Botón "Exportar a CSV" visible en página de Empresas
- [ ] Botón "Exportar a CSV" visible en página de Contactos
- [ ] Botón "Exportar a CSV" visible en página de Facturas
- [ ] Click en botón descarga archivo CSV con timestamp
- [ ] CSV contiene todas las columnas especificadas
- [ ] CSV respeta filtros activos en UI
- [ ] Campos vacíos se exportan como empty strings
- [ ] Caracteres especiales (ñ, á, é) funcionan en Excel

### Técnico
- [ ] `csv-export.ts` utility creado
- [ ] Export handlers creados para empresas, contactos, facturas
- [ ] UTF-8 con BOM implementado
- [ ] Escape de comas y comillas funcional
- [ ] Unit tests escritos y passing (>80% coverage)
- [ ] Integration tests escritos y passing
- [ ] No new npm dependencies

### Seguridad
- [ ] Solo se exportan datos del tenant del usuario (RLS)
- [ ] Export es client-side (no expone datos en server)
- [ ] No information leakage entre tenants

### UX/Performance
- [ ] Export es instantáneo (< 1 segundo para 100 registros)
- [ ] Nombre de archivo incluye timestamp legible
- [ ] Icon de Download en botón
- [ ] Loading state si hay > 1000 registros

---

## 🚀 Implementation Steps

### Phase 1: CSV Export Utility (30 min)
1. Crear `src/lib/utils/csv-export.ts`
2. Implementar `exportToCSV<T>()` con BOM
3. Implementar `formatCSVValue()` con escaping
4. Escribir unit tests

### Phase 2: Export Handlers (45 min)
1. Crear `src/lib/exports/export-empresas.ts`
2. Crear `src/lib/exports/export-contactos.ts`
3. Crear `src/lib/exports/export-facturas.ts`
4. Escribir integration tests

### Phase 3: UI Integration (30 min)
1. Agregar botón export a empresas page
2. Agregar botón export a contactos page
3. Agregar botón export a facturas page
4. Verificar que respeta filtros

### Phase 4: Testing & Polish (30 min)
1. Test manual en Excel
2. Test manual en Google Sheets
3. Test con datos especiales (ñ, comillas, comas)
4. Test con 1000+ registros (performance)

**Total estimado:** 3-4 horas

---

## 📌 Notes

### Important Considerations
- **Client-side ONLY:** No API routes necesarias, todo es browser-side
- **UTF-8 BOM:** Crítico para Excel - sin BOM los acentos se corrompen
- **Paginación:** Solo exporta datos ya cargados en UI (limitación aceptable)
- **Filtros:** Usar datos filtrados del estado de React
- **Performance:** Instantáneo hasta 5000 registros (browser native)

### Future Enhancements (Not in this Story)
- Exportar TODAS las filas (no solo las cargadas) via API endpoint
- Soporte para Excel (.xlsx) con formato
- Progress bar para exports grandes (> 10,000 registros)
- Columnas configurables (user elige qué exportar)
- Export programado (scheduled) con email

---

**Última actualización:** 2025-12-02
**Estado:** ✅ Ready for Dev
**Estimación:** 3-4 horas
**Complejidad:** Media-Baja
