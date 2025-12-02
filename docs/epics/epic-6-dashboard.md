---
id: epic-6
title: "Dashboard Operativo y Analytics"
status: pending
priority: medium
dependencies: [epic-2]
stories_count: 5
frs_covered: [FR32, FR33, FR34, FR35, FR36, FR37, FR38]
---

# Epic 6: Dashboard Operativo y Analytics 📊

## Objetivo
Proveer visibilidad completa del proceso de cobranzas con métricas, alertas y exportación.

## Valor para el Usuario
Carlos (CFO) tiene dashboard ejecutivo con KPIs en tiempo real. Miguel recibe alertas y notificaciones de eventos importantes.

## FRs Cubiertos
- **FR32:** Dashboard operativo completo
- **FR33:** Exportación de reportes
- **FR34:** Notificaciones in-app
- **FR35:** Notificaciones por email
- **FR36:** Escalamiento manual
- **FR37:** Gráficos de tendencias
- **FR38:** Auto-refresh dashboard

## Contexto Técnico

### Stack de Visualización
| Tecnología | Uso |
|------------|-----|
| Recharts | Gráficos (Bar, Line, Area) |
| shadcn/ui Chart | Wrapper con theming |
| Supabase Realtime | Updates en vivo |

### Métricas Clave
| KPI | Cálculo | Objetivo |
|-----|---------|----------|
| DSO | Avg(days_to_payment) | < 45 días |
| Tasa de Recuperación | Pagadas / Total vencidas | > 80% |
| Tiempo de Respuesta | Avg(time_to_first_response) | < 24h |
| Mensajes por Cobro | Avg(messages_sent_count) | < 3 |

### Performance Targets
```typescript
const dashboardPerformance = {
  initialLoad: 2000,     // < 2 segundos
  dataRefresh: 500,      // < 500ms
  autoRefresh: 30000,    // cada 30 segundos
};
```

---

## Stories

### Story 6.1: Dashboard Operativo Completo

**Como** Carlos (CFO),
**Quiero** un dashboard con KPIs completos de cobranzas,
**Para que** tenga visibilidad ejecutiva del proceso.

#### Criterios de Aceptación

**Scenario: KPI Cards - Facturas**
```gherkin
Given estoy en /dashboard
When la página carga
Then veo 4 cards de facturas:
  | KPI | Cálculo |
  | Pendientes | COUNT WHERE status IN ('pendiente', 'fecha_confirmada') |
  | Vencidas | COUNT WHERE status = 'pendiente' AND due_date < hoy |
  | Pagadas (Mes) | COUNT WHERE status = 'pagada' AND paid_date >= inicio_mes |
  | Monto Pendiente | SUM(amount) WHERE status NOT IN ('pagada', 'cancelada') |
```

**Scenario: KPI Cards - Cobranzas**
```gherkin
Given veo sección de cobranzas
Then veo cards:
  | KPI | Cálculo |
  | Activas | COUNT collections WHERE status = 'active' |
  | Pendientes Revisión | COUNT WHERE status = 'pending_review' |
  | Completadas (Mes) | COUNT WHERE status = 'completed' AND completed_at >= inicio_mes |
```

**Scenario: KPI Cards - Actividad**
```gherkin
Given veo sección de actividad
Then veo cards:
  | KPI | Cálculo |
  | Mensajes Hoy | COUNT sent_messages WHERE sent_at >= hoy |
  | Tasa Entrega | delivered / sent * 100 |
  | Tasa Respuesta | responses / sent * 100 |
```

**Scenario: Gráfico de facturas vencidas**
```gherkin
Given hay facturas vencidas
Then veo BarChart con segmentos:
  | Segmento | Color |
  | 0-7 días | chart-1 |
  | 8-15 días | chart-2 |
  | 16-30 días | chart-3 |
  | 30+ días | chart-4 (rojo) |
```

**Scenario: Gráfico de tendencia DSO**
```gherkin
Given hay datos históricos
Then veo LineChart con:
  - Eje X: últimos 3 meses por semana
  - Eje Y: DSO promedio
  - Línea de objetivo (45 días)
```

**Scenario: Gráfico de actividad**
```gherkin
Given hay mensajes enviados
Then veo AreaChart con:
  - Últimos 7 días
  - Mensajes enviados por día
  - Respuestas recibidas por día
```

**Scenario: Alertas críticas**
```gherkin
Given hay situaciones críticas
Then veo lista de alertas:
  | Alerta | Condición |
  | Facturas > 30 días | Vencidas sin cobranza activa |
  | Respuestas > 24h | pending_review hace > 24 horas |
  | Errores de envío | sent_messages con status = 'failed' |
```

**Scenario: Filtros de dashboard**
```gherkin
Given estoy en dashboard
Then puedo filtrar por:
  | Filtro | Tipo |
  | Empresa | Select múltiple |
  | Período | Date range |
And todos los KPIs se recalculan
```

**Scenario: Auto-refresh**
```gherkin
Given dashboard está visible
When pasan 30 segundos
Then datos se refrescan automáticamente
And no hay flash/reload visible
```

**Scenario: Performance**
```gherkin
Given hay 1000 facturas
When cargo el dashboard
Then carga completa en < 2 segundos
And refresh en < 500ms
```

#### Notas Técnicas
- **Ruta:** `src/app/(dashboard)/page.tsx`
- **Queries:** `src/lib/db/queries/dashboard.ts`
- **Componentes:**
  - `src/components/dashboard/kpi-card.tsx`
  - `src/components/dashboard/overdue-chart.tsx`
  - `src/components/dashboard/dso-trend-chart.tsx`
  - `src/components/dashboard/activity-chart.tsx`
  - `src/components/dashboard/alerts-list.tsx`
- **React Query config:**
```typescript
const { data } = useQuery({
  queryKey: ['dashboard', filters],
  queryFn: fetchDashboardData,
  refetchInterval: 30000, // 30 segundos
});
```
- **Queries SQL optimizadas:**
```sql
-- Facturas vencidas por segmento
SELECT
  CASE
    WHEN CURRENT_DATE - due_date BETWEEN 1 AND 7 THEN '0-7'
    WHEN CURRENT_DATE - due_date BETWEEN 8 AND 15 THEN '8-15'
    WHEN CURRENT_DATE - due_date BETWEEN 16 AND 30 THEN '16-30'
    ELSE '30+'
  END as segment,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM invoices
WHERE tenant_id = $1
  AND payment_status = 'pendiente'
  AND due_date < CURRENT_DATE
GROUP BY 1
ORDER BY 1;
```

#### Prerequisitos
- Epic 2 completada (datos de facturas)

---

### Story 6.2: Exportación de Reportes

**Como** Carlos,
**Quiero** exportar reportes de cobranzas,
**Para que** pueda analizarlos en Excel o compartir con directivos.

#### Criterios de Aceptación

**Scenario: Botón de exportar**
```gherkin
Given estoy en dashboard
When veo el header
Then hay botón "Exportar" con dropdown
```

**Scenario: Opciones de formato**
```gherkin
Given hago click en "Exportar"
Then veo opciones:
  | Formato | Descripción |
  | CSV | Datos separados por comas |
  | Excel | Archivo .xlsx con formato |
```

**Scenario: Contenido del reporte**
```gherkin
Given exporto el reporte
Then el archivo incluye:

Hoja 1: Resumen
  - Fecha de generación
  - Período del reporte
  - KPIs principales

Hoja 2: Facturas
  | Columna |
  | Empresa |
  | Número Factura |
  | Monto |
  | Moneda |
  | Fecha Emisión |
  | Fecha Vencimiento |
  | Estado |
  | Días Vencida |
  | Última Actividad |
```

**Scenario: Aplicar filtros actuales**
```gherkin
Given tengo filtro de empresa "Acme Corp" activo
When exporto
Then el reporte solo incluye facturas de "Acme Corp"
```

**Scenario: Nombre de archivo**
```gherkin
Given exporto el reporte
Then el nombre es: cobranzas-YYYY-MM-DD.csv o .xlsx
```

#### Notas Técnicas
- **Implementación CSV:**
```typescript
function exportToCsv(data: Invoice[]): string {
  const headers = ['Empresa', 'Número', 'Monto', ...];
  const rows = data.map(inv => [
    inv.company.name,
    inv.invoiceNumber,
    inv.amount,
    ...
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```
- **Implementación Excel:** Usar `xlsx` library
```typescript
import * as XLSX from 'xlsx';

function exportToExcel(data: ExportData): Blob {
  const wb = XLSX.utils.book_new();

  // Hoja de resumen
  const summaryWs = XLSX.utils.json_to_sheet([data.summary]);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  // Hoja de facturas
  const invoicesWs = XLSX.utils.json_to_sheet(data.invoices);
  XLSX.utils.book_append_sheet(wb, invoicesWs, 'Facturas');

  return XLSX.write(wb, { type: 'blob', bookType: 'xlsx' });
}
```
- **Descarga:** Crear blob URL y simular click

#### Prerequisitos
- Story 6.1 completada

---

### Story 6.3: Notificaciones In-App

**Como** Miguel,
**Quiero** recibir notificaciones cuando hay eventos importantes,
**Para que** no pierda respuestas o cambios críticos.

#### Criterios de Aceptación

**Scenario: Icono de notificaciones en header**
```gherkin
Given estoy en cualquier página
When veo el header
Then hay icono de campana
And si hay notificaciones no leídas, veo badge con contador
```

**Scenario: Dropdown de notificaciones**
```gherkin
Given hago click en icono de campana
Then veo dropdown con notificaciones recientes:
  | Columna | Descripción |
  | Icono | Según tipo de evento |
  | Mensaje | Descripción corta |
  | Tiempo | "hace X minutos" |
```

**Scenario: Tipos de notificaciones**
```gherkin
Given ocurren eventos
Then se generan notificaciones:
  | Evento | Mensaje | Icono |
  | Nueva respuesta | "Nueva respuesta de {empresa}" | MessageSquare |
  | Factura pagada | "Factura {número} marcada como pagada" | CheckCircle |
  | Collection completada | "Cobranza de {factura} completada" | Check |
  | Error de envío | "Error al enviar mensaje a {contacto}" | AlertTriangle |
```

**Scenario: Click navega al recurso**
```gherkin
Given hago click en notificación de respuesta
Then navego a /responses con esa respuesta destacada
```

**Scenario: Marcar como leídas**
```gherkin
Given abro el dropdown
Then todas las notificaciones visibles se marcan como leídas
And el badge desaparece
```

**Scenario: Ver todas**
```gherkin
Given el dropdown está abierto
When hago click en "Ver todas"
Then navego a /notifications con historial completo
```

#### Notas Técnicas
- **Componente:** `src/components/layout/notification-dropdown.tsx`
- **Storage:** Tabla `notifications` o usar Supabase Realtime
- **Schema básico:**
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'response' | 'payment' | 'completion' | 'error';
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  read: boolean;
  createdAt: Date;
}
```
- **Polling vs Realtime:**
  - MVP: Polling cada 30s con React Query
  - Futuro: Supabase Realtime subscriptions
- **UI:** DropdownMenu de shadcn/ui

#### Prerequisitos
- Story 5.3 (respuestas generan notificaciones)

---

### Story 6.4: Notificaciones por Email (Nice to Have)

**Como** Miguel,
**Quiero** recibir emails de eventos críticos,
**Para que** no pierda nada importante si no estoy en el sistema.

#### Criterios de Aceptación

**Scenario: Alert de respuestas pendientes**
```gherkin
Given hay respuestas pending_review hace > 24 horas
When cron job de alertas ejecuta (cada hora)
Then se envía email a admins del tenant:
  Subject: "⚠️ Tienes {N} respuestas pendientes de revisar"
  Body: Lista de respuestas con links
```

**Scenario: Alert de facturas críticas**
```gherkin
Given hay facturas vencidas > 30 días sin cobranza activa
When cron ejecuta
Then se envía email:
  Subject: "🔴 Facturas críticas requieren atención"
  Body: Lista con empresa, monto, días vencida
```

**Scenario: No spam de emails**
```gherkin
Given ya se envió alert hoy por mismo motivo
When cron evalúa nuevamente
Then no envía email duplicado
And registra "alert ya enviado"
```

**Scenario: Configuración de usuario**
```gherkin
Given estoy en /settings
Then puedo configurar:
  | Setting | Opciones |
  | Emails de alertas | Activado / Desactivado |
  | Frecuencia | Inmediato / Diario / Nunca |
```

#### Notas Técnicas
- **Cron:** `src/app/api/cron/alerts/route.ts`
- **vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/alerts",
    "schedule": "0 * * * *"
  }]
}
```
- **Tracking de alerts enviados:** Guardar en tabla o cache
- **Email template:** Reusar servicio de Epic 4

#### Prerequisitos
- Story 6.3 completada
- Story 4.1 (envío de emails)

---

### Story 6.5: Escalamiento Manual

**Como** Miguel,
**Quiero** escalar facturas manualmente,
**Para que** pueda involucrar al contacto de escalación cuando sea necesario.

#### Criterios de Aceptación

**Scenario: Botón de escalar en factura**
```gherkin
Given estoy en detalle de factura pendiente o fecha_confirmada
And empresa tiene escalation_contact definido
Then veo botón "Escalar"
```

**Scenario: Confirmación de escalamiento**
```gherkin
Given hago click en "Escalar"
Then veo Dialog con:
  | Campo | Valor |
  | Contacto de escalación | escalation_contact.name |
  | Email | escalation_contact.email |
  | Mensaje | "Se enviará comunicación formal..." |
```

**Scenario: Ejecutar escalamiento**
```gherkin
Given confirmo el escalamiento
Then:
  - Invoice.payment_status = 'escalada'
  - Si hay collection activa, status = 'escalated'
  - Se crea nueva collection con playbook "Escalamiento"
  - Email se envía con CC a escalation_contact
```

**Scenario: Sin contacto de escalación**
```gherkin
Given empresa no tiene escalation_contact
When veo detalle de factura
Then botón "Escalar" está deshabilitado
And tooltip: "Defina un contacto de escalación primero"
And link a página de contactos de empresa
```

**Scenario: Email de escalamiento**
```gherkin
Given escalamiento se ejecuta
Then email incluye:
  - TO: primary_contact.email
  - CC: escalation_contact.email
  - Subject: "ESCALAMIENTO: Factura {número} - {empresa}"
  - Body: Comunicación formal con historial
```

#### Notas Técnicas
- **Validación:** Verificar escalation_contact antes de mostrar botón
- **Playbook de escalamiento:**
  - El seed crea playbook "Escalamiento" con trigger_type = 'manual'
  - Mensaje incluye referencia al contacto de escalación
- **CC en email:** Modificar sendEmail para soportar CC
```typescript
async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options?: { cc?: string }
): Promise<string> {
  await sgMail.send({
    to,
    cc: options?.cc,
    // ...
  });
}
```

#### Prerequisitos
- Story 2.3 (contacto de escalación)
- Story 3.3 (playbook de escalamiento)
- Story 4.1 (envío de emails)

---

## Definition of Done (Epic)

- [ ] Todas las stories completadas
- [ ] Dashboard con todos los KPIs funcionando
- [ ] Gráficos renderizando correctamente
- [ ] Auto-refresh cada 30 segundos
- [ ] Export CSV y Excel funcionando
- [ ] Notificaciones in-app con dropdown
- [ ] Emails de alerta (opcional)
- [ ] Escalamiento manual funcionando
- [ ] Performance < 2 segundos en carga inicial
- [ ] Tests de componentes de dashboard

---

**Última actualización:** 2025-12-01
**Estado:** 🔜 Pendiente
