# cobra-bmad - Índice de Épicas e Historias

**Autor:** Emilio
**Fecha:** 2025-12-01
**Proyecto:** cobra-bmad - Plataforma SaaS B2B de Automatización de Cobranzas

---

## Resumen Ejecutivo

Este directorio contiene el desglose completo de épicas e historias de usuario para cobra-bmad, derivado del PRD e incorporando el contexto técnico de Architecture.md y los patrones de UX de ux-design.md.

**Total de Épicas:** 6
**Total de Stories:** 35
**Cobertura de FRs:** 100% (38 FRs del PRD)

✅ **Estado:** COMPLETO - Listo para Sprint Planning

---

## Estructura de Archivos

| Archivo | Épica | Stories | FRs | Estado |
|---------|-------|---------|-----|--------|
| [epic-1-foundation.md](./epic-1-foundation.md) | Foundation Setup | 4 | FR1-4 | 🔜 Pendiente |
| [epic-2-crm.md](./epic-2-crm.md) | CRM y Gestión de Clientes | 8 | FR5-13 | 🔜 Pendiente |
| [epic-3-motor-cobranzas.md](./epic-3-motor-cobranzas.md) | Motor de Cobranzas | 7 | FR14-20 | 🔜 Pendiente |
| [epic-4-comunicacion.md](./epic-4-comunicacion.md) | Comunicación Multicanal | 4 | FR21-24 | 🔜 Pendiente |
| [epic-5-respuestas-ia.md](./epic-5-respuestas-ia.md) | Loop de Respuestas e IA | 7 | FR25-31 | 🔜 Pendiente |
| [epic-6-dashboard.md](./epic-6-dashboard.md) | Dashboard y Analytics | 5 | FR32-38 | 🔜 Pendiente |

---

## Mapa de Dependencias

```
Epic 1: Foundation Setup
    │
    ▼
Epic 2: CRM y Gestión ──────────────────┐
    │                                    │
    ▼                                    ▼
Epic 3: Motor de Cobranzas        Epic 6: Dashboard
    │                              (parcialmente independiente)
    ▼
Epic 4: Comunicación Multicanal
    │
    ▼
Epic 5: Loop de Respuestas e IA
```

---

## Matriz de Cobertura FR → Epic → Story

| FR | Descripción | Epic | Story |
|----|-------------|------|-------|
| FR1 | Configurar Supabase con RLS multi-tenant | 1 | 1.1 |
| FR2 | Integrar Clerk con custom claims tenant_id | 1 | 1.2 |
| FR3 | Auto-registro con creación de tenant | 1 | 1.3 |
| FR4 | Seed data de tenant demo | 1 | 1.4 |
| FR5 | CRUD de empresas cliente | 2 | 2.1, 2.2 |
| FR6 | Validación tax_id único por tenant | 2 | 2.1 |
| FR7 | CRUD de contactos | 2 | 2.3, 2.4 |
| FR8 | Validación 1 primary contact por empresa | 2 | 2.3 |
| FR9 | Validación 1 escalation contact por empresa | 2 | 2.3 |
| FR10 | CRUD de facturas | 2 | 2.5, 2.6 |
| FR11 | Estados bidimensionales de factura | 2 | 2.6 |
| FR12 | Importación CSV de facturas | 2 | 2.7 |
| FR13 | Dashboard básico con KPIs | 2 | 2.8 |
| FR14 | Schema de Playbooks | 3 | 3.1 |
| FR15 | Builder de Playbooks | 3 | 3.2 |
| FR16 | Playbooks pre-configurados | 3 | 3.3 |
| FR17 | Schema de Collections | 3 | 3.4 |
| FR18 | Crear cobranza desde factura | 3 | 3.5 |
| FR19 | Worker de procesamiento automático | 3 | 3.6 |
| FR20 | Control manual de cobranzas | 3 | 3.7 |
| FR21 | Envío de emails transaccionales | 4 | 4.1 |
| FR22 | Envío de WhatsApp | 4 | 4.2 |
| FR23 | Historial de mensajes enviados | 4 | 4.3 |
| FR24 | Webhooks de delivery status | 4 | 4.4 |
| FR25 | Captura de respuestas email (N8N) | 5 | 5.1 |
| FR26 | Captura de respuestas WhatsApp (N8N) | 5 | 5.2 |
| FR27 | Endpoint webhook customer-response | 5 | 5.3 |
| FR28 | Bandeja de respuestas pendientes | 5 | 5.4 |
| FR29 | Aprobar sugerencia de IA | 5 | 5.5 |
| FR30 | Acción manual override | 5 | 5.6 |
| FR31 | Panel de contexto completo | 5 | 5.7 |
| FR32 | Dashboard operativo completo | 6 | 6.1 |
| FR33 | Exportación de reportes | 6 | 6.2 |
| FR34 | Notificaciones in-app | 6 | 6.3 |
| FR35 | Notificaciones por email | 6 | 6.4 |
| FR36 | Escalamiento manual | 6 | 6.5 |
| FR37 | Gráficos de tendencias | 6 | 6.1 |
| FR38 | Auto-refresh dashboard | 6 | 6.1 |

**Cobertura Total: 38/38 FRs = 100%** ✅

---

## Resumen por Épica

### Epic 1: Foundation Setup 🏗️
**Valor:** Infraestructura segura multi-tenant lista para recibir datos
**ADRs:** #1 (RLS Multi-Tenancy), #5 (Stack Tecnológico)
**Stories:** 4

### Epic 2: CRM y Gestión de Clientes 👥
**Valor:** Miguel puede gestionar empresas, contactos y facturas
**Contexto:** Schema companies/contacts/invoices, shadcn/ui DataTable
**Stories:** 8

### Epic 3: Motor de Cobranzas Automatizado ⚙️
**Valor:** Cobranzas automáticas según playbooks configurables
**ADRs:** #2 (Híbrido Determinístico+IA), #3 (Cobranza 1:1)
**Stories:** 7

### Epic 4: Comunicación Multicanal 📧
**Valor:** Mensajes por email y WhatsApp con tracking de entrega
**Integraciones:** SendGrid, Twilio WhatsApp Business API
**Stories:** 4

### Epic 5: Loop de Respuestas e IA 🤖
**Valor:** Respuestas interpretadas por IA, procesadas con 1 click
**ADRs:** #2 (IA sugiere, humano aprueba), #4 (N8N Orquestador)
**Stories:** 7

### Epic 6: Dashboard Operativo y Analytics 📊
**Valor:** Visibilidad ejecutiva completa con métricas y exportación
**Contexto:** Recharts, Supabase Realtime, Export CSV/Excel
**Stories:** 5

---

## Instrucciones para Scrum Master Agent

1. **Cargar una épica a la vez** - Cada archivo es independiente
2. **Respetar dependencias** - Ver mapa de dependencias arriba
3. **Stories están dimensionadas** - Para sesión de dev agent
4. **Acceptance Criteria en BDD** - Given/When/Then
5. **Notas técnicas incluidas** - Rutas, APIs, componentes específicos

---

## Referencias

- [PRD](../prd.md) - Product Requirements Document
- [Architecture](../architecture.md) - Decisiones arquitectónicas
- [UX Design](../ux-design.md) - Sistema de diseño

---

**Generado:** 2025-12-01
**Estado:** ✅ COMPLETO - LISTO PARA SPRINT PLANNING
