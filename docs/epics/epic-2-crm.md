---
id: epic-2
title: "CRM y Gestión de Clientes"
status: ready-for-dev
priority: high
dependencies: [epic-1]
stories_count: 9
stories_drafted: 9
frs_covered: [FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13]
last_updated: 2025-12-02
---

# Epic 2: CRM y Gestión de Clientes 👥

## Objetivo
Permitir a Miguel gestionar empresas, contactos y facturas en el sistema.

## Valor para el Usuario
Toda la información de clientes y facturas centralizada, con validaciones de negocio automáticas que garantizan integridad de datos.

## FRs Cubiertos
- **FR5:** CRUD de empresas cliente
- **FR6:** Validación tax_id único por tenant
- **FR7:** CRUD de contactos
- **FR8:** Validación 1 primary contact por empresa
- **FR9:** Validación 1 escalation contact por empresa
- **FR10:** CRUD de facturas
- **FR11:** Estados bidimensionales de factura
- **FR12:** Importación CSV de facturas
- **FR13:** Dashboard básico con KPIs

## Contexto Técnico

### Schema Prisma
```prisma
model Company {
  id               String   @id @default(uuid()) @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  name             String   @db.VarChar(255)
  taxId            String   @map("tax_id") @db.VarChar(50)
  email            String?
  phone            String?
  address          String?
  industry         String?
  paymentTermsDays Int      @default(30)
  riskLevel        String   @default("medio") // bajo, medio, alto
  isActive         Boolean  @default(true)

  tenant   Tenant    @relation(fields: [tenantId], references: [id])
  contacts Contact[]
  invoices Invoice[]

  @@unique([tenantId, taxId])
}

model Contact {
  id                  String  @id @default(uuid()) @db.Uuid
  tenantId            String  @db.Uuid
  companyId           String  @db.Uuid
  firstName           String
  lastName            String
  email               String
  phone               String?
  position            String?
  isPrimaryContact    Boolean @default(false)
  isEscalationContact Boolean @default(false)
  isActive            Boolean @default(true)

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  company Company @relation(fields: [companyId], references: [id])
}

model Invoice {
  id                   String    @id @default(uuid()) @db.Uuid
  tenantId             String    @db.Uuid
  companyId            String    @db.Uuid
  invoiceNumber        String
  amount               Decimal   @db.Decimal(15, 2)
  currency             String    @default("USD")
  issueDate            DateTime  @db.Date
  dueDate              DateTime  @db.Date
  confirmedPaymentDate DateTime? @db.Date
  paidDate             DateTime? @db.Date
  paymentStatus        String    @default("pendiente")
  paymentReference     String?
  description          String?
  notes                String?

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  company Company @relation(fields: [companyId], references: [id])

  @@unique([tenantId, invoiceNumber])
}
```

### Estados de Factura
| Estado | Descripción |
|--------|-------------|
| `pendiente` | Esperando pago |
| `fecha_confirmada` | Cliente confirmó fecha de pago |
| `pagada` | Pago recibido y confirmado |
| `escalada` | Enviada a nivel superior |
| `suspendida` | Pausada temporalmente |
| `cancelada` | Anulada |

### UI Components (shadcn/ui)
- DataTable con TanStack Table
- Form con react-hook-form + Zod
- Card, Badge, Dialog, Sheet
- DatePicker para fechas

---

## Stories

### Story 2.1: Crear Empresas Cliente

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** agregar nuevas empresas cliente al sistema,
**Para que** pueda gestionar sus facturas y cobranzas.

#### Criterios de Aceptación

**Scenario: Crear empresa exitosamente**
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

**Scenario: Guardar empresa crea registro**
```gherkin
Given lleno el formulario con datos válidos
When hago click en "Guardar"
Then la empresa aparece en la lista
And tiene tenant_id de mi organización
And is_active = true
```

**Scenario: Tax ID duplicado muestra error**
```gherkin
Given ya existe empresa con taxId "RFC123456"
When intento crear otra empresa con taxId "RFC123456"
Then veo error "RFC/Tax ID ya registrado"
And el formulario no se limpia
```

#### Notas Técnicas
- **Rutas:**
  - `src/app/(dashboard)/companies/page.tsx` - Lista
  - `src/app/(dashboard)/companies/new/page.tsx` - Crear
- **API:** `POST /api/companies`
- **Componentes:**
  - `src/components/forms/company-form.tsx`
- **Validación:** `src/lib/validations/company-schema.ts`
```typescript
export const companySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  taxId: z.string().min(1, "Tax ID requerido"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  paymentTermsDays: z.number().min(1).default(30),
  riskLevel: z.enum(["bajo", "medio", "alto"]).default("medio"),
});
```

#### Prerequisitos
- Epic 1 completada

---

### Story 2.2: Listar y Editar Empresas

**Como** Miguel,
**Quiero** ver todas mis empresas y editarlas,
**Para que** pueda mantener la información actualizada.

#### Criterios de Aceptación

**Scenario: Lista de empresas con DataTable**
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

**Scenario: Ver detalle de empresa**
```gherkin
Given estoy en lista de empresas
When hago click en una empresa
Then navego a /companies/[id]
And veo tabs: Info General, Contactos, Facturas
```

**Scenario: Editar empresa**
```gherkin
Given estoy en detalle de empresa
When hago click en "Editar"
Then veo formulario pre-llenado
And puedo modificar campos
And al guardar, los cambios se reflejan
```

**Scenario: Desactivar empresa (soft delete)**
```gherkin
Given estoy en detalle de empresa
When hago click en "Desactivar"
And confirmo en el dialog
Then empresa.is_active = false
And ya no aparece en lista por defecto
And puedo ver con filtro "Mostrar inactivos"
```

#### Notas Técnicas
- **Rutas:**
  - `src/app/(dashboard)/companies/[companyId]/page.tsx`
  - `src/app/(dashboard)/companies/[companyId]/edit/page.tsx`
- **API:**
  - `GET /api/companies` - Lista con paginación
  - `GET /api/companies/[id]` - Detalle
  - `PATCH /api/companies/[id]` - Actualizar
- **Componentes:**
  - `src/components/tables/companies-table.tsx`
- **Soft delete:** No DELETE físico, solo `is_active = false`

#### Prerequisitos
- Story 2.1 completada

---

### Story 2.3: Gestionar Contactos de Empresa

**Como** Miguel,
**Quiero** agregar contactos a cada empresa con roles específicos,
**Para que** sepa a quién contactar para cobranzas.

#### Criterios de Aceptación

**Scenario: Agregar contacto a empresa**
```gherkin
Given estoy en detalle de empresa, tab "Contactos"
When hago click en "Agregar Contacto"
Then veo Dialog con formulario:
  | Campo | Tipo | Requerido |
  | firstName | text | sí |
  | lastName | text | sí |
  | email | email | sí |
  | phone | tel | no |
  | position | text | no |
  | isPrimaryContact | checkbox | no |
  | isEscalationContact | checkbox | no |
```

**Scenario: Marcar como primary remueve anterior**
```gherkin
Given empresa tiene contacto A como primary
When creo contacto B y lo marco como primary
Then contacto B es primary
And contacto A ya no es primary
And operación es atómica (transacción)
```

**Scenario: Debe existir un primary**
```gherkin
Given empresa tiene solo 1 contacto marcado como primary
When intento desmarcar isPrimaryContact
Then veo error "Debe haber un contacto principal"
And el cambio no se guarda
```

**Scenario: Escalation contact es opcional pero único**
```gherkin
Given empresa tiene contacto A como escalation
When marco contacto B como escalation
Then contacto B es escalation
And contacto A ya no es escalation
```

#### Notas Técnicas
- **API:** `POST /api/contacts`, `PATCH /api/contacts/[id]`
- **Componentes:**
  - `src/components/forms/contact-form.tsx`
  - Dialog de shadcn/ui para modal
- **Validación de unicidad:**
```typescript
// En contact-service.ts
async function setPrimaryContact(companyId: string, contactId: string) {
  await supabase.rpc('swap_primary_contact', {
    p_company_id: companyId,
    p_new_primary_id: contactId
  });
}
```
- **Transacción SQL:**
```sql
CREATE OR REPLACE FUNCTION swap_primary_contact(
  p_company_id UUID,
  p_new_primary_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE contacts SET is_primary_contact = false
  WHERE company_id = p_company_id AND is_primary_contact = true;

  UPDATE contacts SET is_primary_contact = true
  WHERE id = p_new_primary_id;
END;
$$ LANGUAGE plpgsql;
```

#### Prerequisitos
- Story 2.1 completada

---

### Story 2.4: Editar y Desactivar Contactos

**Como** Miguel,
**Quiero** editar contactos y cambiar roles,
**Para que** la información esté siempre correcta.

#### Criterios de Aceptación

**Scenario: Editar contacto**
```gherkin
Given estoy viendo contactos de una empresa
When hago click en "Editar" de un contacto
Then veo Dialog con datos pre-llenados
And puedo modificar cualquier campo
```

**Scenario: Desactivar contacto no-primary**
```gherkin
Given contacto no es primary ni escalation
When hago click en "Desactivar"
Then contact.is_active = false
And ya no aparece en lista por defecto
```

**Scenario: No puedo desactivar único primary**
```gherkin
Given contacto es el único primary de la empresa
When intento desactivar
Then veo error "Asigne otro contacto principal primero"
```

#### Notas Técnicas
- **API:** `PATCH /api/contacts/[id]`
- **Validación:** Antes de desactivar, verificar que no sea único primary

#### Prerequisitos
- Story 2.3 completada

---

### Story 2.5: Crear Facturas Manualmente

**Como** Miguel,
**Quiero** crear facturas en el sistema,
**Para que** pueda iniciar cobranzas sobre ellas.

#### Criterios de Aceptación

**Scenario: Crear factura desde empresa**
```gherkin
Given estoy en detalle de empresa, tab "Facturas"
When hago click en "Nueva Factura"
Then veo formulario con company pre-seleccionada
```

**Scenario: Crear factura desde /invoices**
```gherkin
Given estoy en /invoices/new
When cargo la página
Then veo selector de empresa
And los demás campos del formulario
```

**Scenario: Campos del formulario**
```gherkin
Given estoy en formulario de nueva factura
Then veo campos:
  | Campo | Tipo | Requerido | Validación |
  | companyId | select | sí | empresa activa |
  | invoiceNumber | text | sí | único por tenant |
  | amount | number | sí | > 0 |
  | currency | select | no | default USD |
  | issueDate | date | sí | - |
  | dueDate | date | sí | >= issueDate |
  | description | textarea | no | - |
  | notes | textarea | no | - |
```

**Scenario: Guardar factura**
```gherkin
Given lleno el formulario correctamente
When hago click en "Guardar"
Then factura se crea con payment_status = 'pendiente'
And navego a detalle de factura
```

**Scenario: Invoice number duplicado**
```gherkin
Given ya existe factura con invoiceNumber "FAC-001"
When intento crear otra con "FAC-001"
Then veo error "Número de factura ya existe"
```

#### Notas Técnicas
- **Rutas:**
  - `src/app/(dashboard)/invoices/new/page.tsx`
  - `src/app/(dashboard)/companies/[id]/invoices/new/page.tsx` (redirect)
- **API:** `POST /api/invoices`
- **Componentes:**
  - `src/components/forms/invoice-form.tsx`
- **Validación:** `src/lib/validations/invoice-schema.ts`
- **DatePicker:** Usar shadcn/ui calendar + popover

#### Prerequisitos
- Story 2.1 completada

---

### Story 2.6: Gestionar Estados de Facturas

**Como** Miguel,
**Quiero** actualizar el estado de facturas,
**Para que** refleje la realidad del cobro.

#### Criterios de Aceptación

**Scenario: Marcar como pagada**
```gherkin
Given estoy en detalle de factura pendiente
When hago click en "Marcar como Pagada"
Then veo Dialog solicitando:
  | Campo | Requerido |
  | paymentReference | sí |
  | paidDate | sí (default hoy) |
And paidDate no puede ser < issueDate
```

**Scenario: Confirmar pago actualiza estado**
```gherkin
Given completé el dialog de pago
When confirmo
Then payment_status = 'pagada'
And paidDate y paymentReference se guardan
And si hay Collection activa, se completa
```

**Scenario: Marcar fecha confirmada**
```gherkin
Given factura está pendiente
When selecciono "Confirmar Fecha de Pago"
Then veo DatePicker para confirmedPaymentDate
And al guardar, payment_status = 'fecha_confirmada'
```

**Scenario: Escalar factura**
```gherkin
Given factura está pendiente o fecha_confirmada
When hago click en "Escalar"
Then payment_status = 'escalada'
And Collection activa (si existe) se pausa
```

**Scenario: Historial de cambios visible**
```gherkin
Given factura ha tenido cambios de estado
When veo el detalle
Then veo timeline con cambios:
  | Fecha | Estado Anterior | Estado Nuevo | Usuario |
```

#### Notas Técnicas
- **API:** `PATCH /api/invoices/[id]/status`
- **Payload:**
```typescript
interface UpdateStatusPayload {
  status: 'pendiente' | 'fecha_confirmada' | 'pagada' | 'escalada' | 'suspendida' | 'cancelada';
  confirmedPaymentDate?: Date;
  paidDate?: Date;
  paymentReference?: string;
}
```
- **Audit log:** Campo JSONB `status_history` en invoice o tabla separada
- **Sincronización con Collection:** Llamar collection-service si aplica

#### Prerequisitos
- Story 2.5 completada

---

### Story 2.7: Importar Facturas desde CSV

**Como** Miguel,
**Quiero** importar facturas masivamente desde CSV,
**Para que** pueda cargar datos desde mi ERP rápidamente.

#### Criterios de Aceptación

**Scenario: Descargar template**
```gherkin
Given estoy en /invoices/import
When hago click en "Descargar Template"
Then descargo CSV con headers:
  company_tax_id,invoice_number,amount,currency,issue_date,due_date,description
```

**Scenario: Subir y previsualizar**
```gherkin
Given selecciono un archivo CSV
When el archivo se procesa
Then veo preview de primeras 10 filas
And cada fila muestra estado de validación (✅/❌)
```

**Scenario: Validaciones por fila**
```gherkin
Given CSV tiene errores
Then veo errores específicos:
  | Error | Ejemplo |
  | company_tax_id no encontrado | "RFC999 no existe" |
  | invoice_number duplicado | "FAC-001 ya existe" |
  | amount inválido | "Monto debe ser > 0" |
  | due_date < issue_date | "Vencimiento antes de emisión" |
```

**Scenario: Importación transaccional**
```gherkin
Given preview muestra 10 filas válidas
When hago click en "Importar"
Then se importan todas o ninguna (transacción)
And veo reporte: "10 facturas importadas exitosamente"
```

**Scenario: Importación parcial no permitida**
```gherkin
Given CSV tiene 8 válidas y 2 inválidas
When intento importar
Then veo error "Corrija los errores antes de importar"
And ninguna factura se importa
```

#### Notas Técnicas
- **Ruta:** `src/app/(dashboard)/invoices/import/page.tsx`
- **API:** `POST /api/invoices/import`
- **Procesamiento:**
  1. Parse CSV en frontend (papaparse)
  2. Validar estructura
  3. Enviar a API para validación de negocio
  4. Preview con errores
  5. Confirmar → batch insert
- **Lookup de company:** Por tax_id dentro del tenant
- **Transacción:** Usar Supabase transaction

#### Prerequisitos
- Story 2.5 completada

---

### Story 2.8: Dashboard Básico con KPIs

**Como** Carlos (CFO),
**Quiero** ver un dashboard con el estado de facturas,
**Para que** tenga visibilidad del proceso de cobranzas.

#### Criterios de Aceptación

**Scenario: KPI Cards**
```gherkin
Given estoy en /dashboard
When la página carga
Then veo 4 cards con KPIs:
  | KPI | Cálculo |
  | Facturas Pendientes | COUNT WHERE status IN ('pendiente', 'fecha_confirmada') |
  | Facturas Vencidas | COUNT WHERE status = 'pendiente' AND due_date < hoy |
  | Pagadas Este Mes | COUNT WHERE status = 'pagada' AND paid_date >= inicio_mes |
  | Monto Pendiente | SUM(amount) WHERE status NOT IN ('pagada', 'cancelada') |
```

**Scenario: Gráfico de facturas vencidas**
```gherkin
Given hay facturas vencidas
When veo el dashboard
Then veo BarChart con segmentos:
  | Segmento | Filtro |
  | 0-7 días | 0 < days_overdue <= 7 |
  | 8-15 días | 7 < days_overdue <= 15 |
  | 16-30 días | 15 < days_overdue <= 30 |
  | 30+ días | days_overdue > 30 |
```

**Scenario: Lista de facturas críticas**
```gherkin
Given hay facturas vencidas
When veo el dashboard
Then veo tabla con top 10 facturas vencidas
And ordenadas por días de retraso DESC
And puedo hacer click para ir al detalle
```

**Scenario: Filtros de dashboard**
```gherkin
Given estoy en dashboard
Then puedo filtrar por:
  | Filtro | Tipo |
  | Empresa | select múltiple |
  | Rango de fechas | date range |
And los KPIs se recalculan
```

**Scenario: Performance**
```gherkin
Given hay 1000 facturas en el sistema
When cargo el dashboard
Then carga en < 2 segundos
```

#### Notas Técnicas
- **Ruta:** `src/app/(dashboard)/page.tsx`
- **Queries:** `src/lib/db/queries/dashboard.ts`
- **Componentes:**
  - `src/components/dashboard/kpi-card.tsx`
  - `src/components/dashboard/overdue-chart.tsx`
  - `src/components/dashboard/critical-invoices-table.tsx`
- **Charts:** Recharts + shadcn/ui ChartContainer
- **Índices DB:**
  - `(payment_status, due_date)`
  - `(tenant_id, payment_status)`
- **Queries optimizadas:**
```sql
-- KPI: Monto pendiente
SELECT SUM(amount) as total
FROM invoices
WHERE tenant_id = $1
  AND payment_status NOT IN ('pagada', 'cancelada');

-- Vencidas por segmento
SELECT
  CASE
    WHEN CURRENT_DATE - due_date <= 7 THEN '0-7'
    WHEN CURRENT_DATE - due_date <= 15 THEN '8-15'
    WHEN CURRENT_DATE - due_date <= 30 THEN '16-30'
    ELSE '30+'
  END as segment,
  COUNT(*) as count
FROM invoices
WHERE tenant_id = $1
  AND payment_status = 'pendiente'
  AND due_date < CURRENT_DATE
GROUP BY 1;
```

#### Prerequisitos
- Story 2.6 completada

---

### Story 2.9: Exportar Datos a CSV

**Como** Miguel (Coordinador de Cobranzas),
**Quiero** exportar datos de empresas, contactos y facturas a formato CSV,
**Para que** pueda analizar la información en herramientas externas (Excel, Google Sheets) y mantener respaldos de los datos.

#### Criterios de Aceptación

**Scenario: Exportar empresas a CSV**
```gherkin
Given estoy en /dashboard/empresas
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "empresas-{timestamp}.csv"
And el archivo contiene todas las empresas de mi tenant
And caracteres especiales (ñ, á, é) se visualizan correctamente en Excel
```

**Scenario: Exportar contactos a CSV**
```gherkin
Given estoy en /dashboard/contactos
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "contactos-{timestamp}.csv"
And el archivo incluye nombre, email, teléfono, cargo, empresa, estado
```

**Scenario: Exportar facturas a CSV**
```gherkin
Given estoy en /dashboard/facturas
When hago clic en botón "Exportar a CSV"
Then se descarga archivo "facturas-{timestamp}.csv"
And el archivo incluye número, empresa, contacto, monto, fechas, estado
```

**Scenario: Export respeta filtros**
```gherkin
Given he aplicado filtros en la página (por estado, empresa, etc.)
When exporto a CSV
Then solo se exportan los registros que coinciden con los filtros activos
```

**Scenario: Campos vacíos se manejan correctamente**
```gherkin
Given existen campos opcionales sin datos
When se exporta a CSV
Then los campos vacíos se representan como cadenas vacías
And NO como "null" o "undefined"
```

**Scenario: UTF-8 con BOM para Excel**
```gherkin
Given datos contienen caracteres especiales (ñ, á, é)
When se exporta a CSV
Then el archivo usa UTF-8 con BOM
And se visualiza correctamente al abrir en Excel
```

**Scenario: Multi-tenancy enforcement**
```gherkin
Given soy usuario de un tenant específico
When exporto cualquier tipo de dato
Then solo se exportan registros de MI tenant (RLS enforcement)
```

#### Notas Técnicas
- **Implementación:** 100% client-side (no API routes necesarias)
- **Utilidades:**
  - `src/lib/utils/csv-export.ts` - Core export functionality
  - `src/lib/exports/export-empresas.ts`
  - `src/lib/exports/export-contactos.ts`
  - `src/lib/exports/export-facturas.ts`
- **Encoding:** UTF-8 con BOM (`\uFEFF`) para compatibilidad con Excel
- **Escape:** Automático de comas, comillas y newlines en valores
- **Timestamp:** Formato `YYYY-MM-DD-HHmmss` en nombre de archivo
- **Performance:** Instantáneo hasta 5000 registros (browser native APIs)
- **Dependencies:** `date-fns` (already in project)

#### Prerequisitos
- Story 2.1 completada (Empresas)
- Story 2.3 completada (Contactos)
- Story 2.5 completada (Facturas)

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] CRUD de empresas funcionando
- [ ] CRUD de contactos con validación primary/escalation
- [ ] CRUD de facturas con estados
- [ ] Import CSV funcionando
- [ ] Dashboard con KPIs y gráfico
- [ ] Tests de integración para validaciones
- [ ] RLS verificado en todas las tablas

---

**Última actualización:** 2025-12-01
**Estado:** 🔜 Pendiente
