---
stepsCompleted: [1, 2]
inputDocuments:
  - 'C:\Users\emili\dev\cobra-bmad\docs\analysis\product-brief-cobra-bmad-2025-12-01.md'
  - 'C:\Users\emili\dev\cobra-bmad\docs\analysis\brainstorming-session-2025-12-01.md'
workflowType: 'prd'
lastStep: 2
project_name: 'cobra-bmad'
user_name: 'Emilio'
date: '2025-12-01'
classification:
  project_type: 'saas_b2b'
  domain: 'fintech'
  complexity: 'high'
---

# Product Requirements Document - cobra-bmad

**Author:** Emilio
**Date:** 2025-12-01

---

## Executive Summary

**cobra-bmad** es una plataforma SaaS B2B de automatización de cobranzas que transforma un proceso operativo manual, inconsistente y costoso en un sistema disciplinado, trazable y eficiente. La plataforma se integra con ERPs existentes para gestionar automáticamente el ciclo completo de cobranzas: desde el envío inteligente de recordatorios multicanal (email + WhatsApp) hasta el seguimiento sistemático de cada factura, liberando hasta 70-80% del tiempo operativo de equipos de cobranza.

El sistema combina automatización determinística (motor de reglas que decide qué hacer y cuándo) con capacidades de IA (generación de contenido personalizado y comprensión de respuestas) bajo supervisión humana, resultando en reducción comprobable en días promedio de cobro (DSO), mejora en flujo de caja, y visibilidad total del proceso a través de un dashboard operativo centralizado.

### What Makes This Special

**1. Purpose-Built para Cobranzas (No es un CRM ni ERP)**

Mientras ERPs solo registran facturas y CRMs gestionan relaciones comerciales, cobra-bmad está diseñado exclusivamente para el proceso operativo de cobranzas. Cada feature, cada flujo, cada decisión arquitectónica optimizada para un solo objetivo: cobrar más rápido con menos esfuerzo.

**2. Arquitectura Híbrida: Determinístico + IA**

- **Motor Determinístico:** Decisiones de negocio (qué hacer, cuándo actuar) basadas en reglas claras, predecibles, auditables
- **IA como Asistente:** Genera contenido natural, interpreta respuestas, sugiere acciones
- **Supervisión Humana:** Siempre en decisiones críticas
- **Ventaja:** Confiabilidad de sistemas rule-based + inteligencia de IA

**3. Modelo de Cobranza Factura-Céntrico (Simplicidad del MVP)**

A diferencia de sistemas complejos, cobra-bmad gestiona cobranzas **directamente desde la factura**:
- ⚡ Sin entidades adicionales - la factura ES el centro de la cobranza
- 🛡️ Historial de comunicaciones integrado en cada factura (mensajes in/out)
- ✅ Playbooks opcionales para automatizar la cadencia de mensajes
- 📈 Bandeja de comunicaciones por factura - todo el contexto en un solo lugar

**4. Arquitectura Multi-Tenant con Seguridad Enterprise**

- Aislamiento completo de datos por cliente (Row Level Security en Supabase)
- Autenticación robusta (Clerk con JWT)
- Imposible acceder datos de otro tenant incluso con bugs de código
- **Ventaja:** Confianza de enterprise, precio de SaaS accesible

**5. Trazabilidad Total + Dashboard Operativo**

CFOs y Gerentes de Cobranzas ven en tiempo real:
- Facturas por estado (pendientes, vencidas, cobradas)
- Días promedio de cobro (DSO) y tendencias
- Facturas con playbook activo vs cerradas
- Mensajes enviados y tasa de respuesta
- Bandeja de excepciones que requieren atención

**6. Integración sin Fricción**

No reemplaza el ERP ni el CRM - se integra como **capa especializada** en cobranzas. Las empresas mantienen sus sistemas existentes, cobra-bmad solo consume datos de facturas y ejecuta el proceso operativo.

## Project Classification

**Technical Type:** SaaS B2B Platform
**Domain:** Fintech (Collections Management)
**Complexity:** High

**Justificación de Clasificación:**

El proyecto califica como **SaaS B2B de alta complejidad** por las siguientes razones:

- **Multi-tenancy:** Aislamiento completo de datos por organización con RLS
- **Arquitectura Híbrida:** Combinación de motor determinístico + IA + supervisión humana
- **Integraciones Críticas:** ERP (datos), WhatsApp Business API, Email providers, N8N (orquestación)
- **Workflow Engine:** Sistema de playbooks con secuencias multi-mensaje y cadencia temporal
- **Dominio Financiero:** Manejo de cobranzas, tracking de pagos, impacto en flujo de caja empresarial
- **Tiempo Real:** Dashboard operativo, notificaciones, estado de mensajes

**Implicaciones para el PRD:**

- Requiere arquitectura técnica detallada antes de implementación
- Orden de construcción crítico: fundamentos → CRM → motor → comunicación → respuestas
- Testing exhaustivo de aislamiento multi-tenant
- Seguridad y compliance prioritarios desde día 1

---

## Success Criteria & Metrics

### MVP Validation Criteria

**El MVP es exitoso SI:**

1. ✅ **Al menos 3-5 facturas se cobran automáticamente** en 30 días de prueba piloto sin redacción manual de mensajes
2. ✅ **Miguel (usuario operativo) reporta ahorro de 50%+ en tiempo** dedicado a seguimiento de cobranzas
3. ✅ **Carlos (CFO) tiene visibilidad en tiempo real** del estado de cobranzas sin depender de Excel manual
4. ✅ **Sistema es estable:** 95%+ uptime, sin data leaks entre tenants
5. ✅ **UX aprobada:** Miguel puede usar el sistema sin capacitación extensa

### Key Metrics to Track

**Operacionales:**
- Facturas por estado (Pendientes, Vencidas, Pagadas, Escaladas)
- Facturas en gestión activa vs completadas
- Mensajes enviados automáticamente por día
- Tasa de respuesta de clientes (% que responden)

**Efectividad:**
- Tiempo promedio hasta primera respuesta
- Tiempo promedio hasta pago (desde creación de cobranza)
- Reducción en DSO (Days Sales Outstanding)

**Técnicos:**
- Uptime del sistema
- Latencia de dashboard (<2 seg)
- Tasa de entrega de mensajes (email/WhatsApp)

---

## User Personas & Stories

### Primary Persona: Miguel - Coordinador de Cobranzas

**Perfil:**
- **Edad:** 27 años
- **Experiencia:** 2-3 años en cobranzas
- **Rol:** Coordinador/Analista de Cobranzas
- **Responsabilidades:** Gestión operativa diaria de cobranzas a clientes

**Un Día Actual (Proceso Manual):**

Miguel llega y abre Excel - su herramienta de trabajo completa. Revisa columna por columna: facturas pendientes, fechas de vencimiento, última comunicación, estado de respuesta. Debe recordar manualmente a quién escribió, quién no respondió, quién prometió pagar y cuándo.

Su jornada se fragmenta en:
- Identificar en Excel qué facturas requieren seguimiento hoy
- Redactar correos personalizados uno por uno
- Copiar-pegar mensajes a WhatsApp para clientes que no responden
- Actualizar manualmente el Excel con cada acción
- Buscar en cadenas de correos el historial con cada cliente
- Escalar manualmente cuando clientes no responden

**Frustraciones Principales:**
- Falta de respuesta sin visibilidad (¿leyó el mensaje?)
- Información desactualizada (solo lo que recuerda registrar)
- Sin herramientas de apoyo (todo manual)
- Carga mental constante (todo vive en su cabeza)

**Visión de Éxito con cobra-bmad:**

Miguel entra al dashboard y ve de un vistazo: facturas pendientes, vencidas, bandeja de respuestas pendientes. El sistema envió automáticamente 15 recordatorios hoy. Solo debe revisar cuando clientes responden - la IA sugiere acción, él aprueba con 1 click. Tiempo liberado: 70-80% de su jornada.

### Secondary Persona: Carlos - CFO/Gerente de Cobranzas

**Perfil:**
- **Rol:** CFO o Gerente de Finanzas/Cobranzas
- **Responsabilidades:** Asegurar liquidez, supervisar equipo de cobranzas, reportar a directorio

**El Problema de Carlos:**

Vive con preocupación constante: **¿tendremos efectivo cuando llegue fin de mes?** Entre "facturado" y "cobrado" existe un gap temporal que debe financiar. Cada día de demora significa gastos financieros por líneas de crédito.

**Qué Necesita:**
- Indicadores claros: ¿Cuántas facturas vencidas? ¿Cuánto dinero en riesgo? ¿DSO actual vs anterior?
- Confianza en el proceso: ninguna factura "cayendo entre grietas"
- Visibilidad sin micromanagement: dashboard que muestre estado en 30 segundos

**ROI que Evalúa:**
1. Reducir DSO en 5-7 días → ahorro directo en gastos financieros
2. Liberar 70-80% del tiempo de Miguel → reducir headcount o reasignar
3. Disciplina en seguimiento → menos facturas olvidadas

**Uso del Sistema:**

Carlos entra semanalmente para ver dashboard: facturas pendientes/vencidas/cobradas, tendencia de DSO, actividad del sistema, bandeja de excepciones. Su momento "ajá": ver que una factura vencida cambió a "Pagada" después de que el sistema envió 3 mensajes automáticamente sin intervención de Miguel.

---

## User Stories & Acceptance Criteria

### FASE 1: FUNDAMENTOS MULTI-TENANT (Semanas 1-2)

#### Epic 1.1: Configuración de Infraestructura Base

**Historia 1.1.1: Como desarrollador, necesito configurar Supabase con RLS para garantizar aislamiento multi-tenant**

**Contexto Técnico:** Esta es la base de seguridad de todo el sistema. Sin RLS correctamente configurado, hay riesgo de data leaks entre tenants.

**Acceptance Criteria:**
- [ ] Proyecto Supabase creado y configurado
- [ ] Schema de base de datos con tablas: `tenants`, `users`
- [ ] RLS policies creadas para ambas tablas
- [ ] Testing: Usuario de tenant A no puede ver datos de tenant B
- [ ] Testing: Queries sin tenant_id fallan automáticamente
- [ ] Documentación de políticas RLS

**Dependencias:** Ninguna (primera historia)

**Historia 1.1.2: Como desarrollador, necesito integrar Clerk con custom claims de tenant_id**

**Contexto Técnico:** Clerk maneja autenticación, debe incluir tenant_id en JWT para que Supabase RLS funcione.

**Acceptance Criteria:**
- [ ] Clerk configurado con aplicación
- [ ] Custom claim `tenant_id` agregado al JWT
- [ ] Webhook de Clerk sincroniza usuarios a tabla `users` en Supabase
- [ ] Testing: JWT contiene tenant_id correcto
- [ ] Testing: Login exitoso establece sesión con tenant_id
- [ ] Documentación de flujo de autenticación

**Dependencias:** Historia 1.1.1 (requiere tabla users)

**Historia 1.1.3: Como nuevo usuario, necesito poder registrarme y que se cree automáticamente mi tenant**

**Contexto Técnico:** Auto-registro simplifica onboarding. Usuario se registra → Tenant creado → Usuario asignado como admin.

**Acceptance Criteria:**
- [ ] UI de registro funcional
- [ ] Al registrarse, se crea registro en `tenants` automáticamente
- [ ] `tenant.slug` generado único a partir de email o nombre
- [ ] Usuario creado con `role = 'admin'` en su tenant
- [ ] Usuario puede hacer login y ver dashboard vacío
- [ ] Testing: Múltiples usuarios pueden registrarse sin colisión
- [ ] Validación: slug único, email único

**Dependencias:** Historia 1.1.2 (requiere Clerk + sincronización)

**Historia 1.1.4: Como desarrollador, necesito seed data de tenant de prueba para desarrollo**

**Contexto Técnico:** Facilita desarrollo local sin tener que registrarse cada vez.

**Acceptance Criteria:**
- [ ] Script de seed que crea tenant "Demo Corp" con slug "demo"
- [ ] Usuario admin creado: `admin@demo.com`
- [ ] Seed incluye 2-3 empresas de ejemplo
- [ ] Seed incluye 5-10 facturas en estados variados
- [ ] Documentación de cómo ejecutar seed
- [ ] Testing: Seed es idempotente (puede ejecutarse múltiples veces)

**Dependencias:** Historia 1.1.3 (requiere modelo completo de tenants)

---

### FASE 2: CRM BASE (Semanas 2-3)

#### Epic 2.1: Gestión de Empresas Cliente

**Historia 2.1.1: Como Miguel, necesito agregar nuevas empresas cliente al sistema**

**Contexto Técnico:** Company es la entidad raíz del CRM. Todo (contactos, facturas) cuelga de aquí.

**Acceptance Criteria:**
- [ ] Schema de `companies` creado con campos: name, tax_id, email, phone, address, industry, payment_terms_days, risk_level
- [ ] RLS policies para `companies` (filtrado por tenant_id)
- [ ] UI: Formulario de creación de empresa
- [ ] Validaciones: name requerido, tax_id único por tenant
- [ ] Testing: Empresa creada aparece solo para su tenant
- [ ] Testing: tax_id duplicado dentro del mismo tenant es rechazado
- [ ] UI: Lista de empresas con búsqueda y filtros

**Dependencias:** Epic 1.1 completo (requiere tenant funcionando)

**Historia 2.1.2: Como Miguel, necesito editar y ver detalles de empresas existentes**

**Acceptance Criteria:**
- [ ] UI: Vista de detalle de empresa con tabs (Info General, Contactos, Facturas)
- [ ] UI: Formulario de edición de empresa
- [ ] Validaciones: tax_id sigue siendo único al editar
- [ ] Testing: Cambios se guardan correctamente
- [ ] Testing: Aislamiento multi-tenant en edición
- [ ] UI: Botón para desactivar empresa (soft delete con `is_active = false`)

**Dependencias:** Historia 2.1.1

#### Epic 2.2: Gestión de Contactos

**Historia 2.2.1: Como Miguel, necesito agregar contactos a cada empresa**

**Contexto Técnico:** Contactos son destinatarios de mensajes. Cada empresa debe tener al menos 1 contacto primary.

**Acceptance Criteria:**
- [ ] Schema de `contacts` creado con campos: company_id, first_name, last_name, email, phone, position, is_primary_contact, is_escalation_contact
- [ ] RLS policies para `contacts`
- [ ] UI: Formulario de creación de contacto desde vista de empresa
- [ ] Validación: Exactamente 1 contacto con `is_primary_contact = true` por empresa
- [ ] Validación: Máximo 1 contacto con `is_escalation_contact = true` por empresa
- [ ] Validación: email requerido, phone opcional
- [ ] Testing: Intentar crear segunda primary falla con mensaje claro
- [ ] UI: Lista de contactos dentro de vista de empresa

**Dependencias:** Historia 2.1.1 (requiere companies)

**Historia 2.2.2: Como Miguel, necesito editar contactos y cambiar quién es el contacto principal**

**Acceptance Criteria:**
- [ ] UI: Formulario de edición de contacto
- [ ] Lógica: Al marcar nuevo contacto como primary, anterior se desmarca automáticamente
- [ ] Lógica: Al marcar nuevo contacto como escalation, anterior se desmarca automáticamente
- [ ] Validación: No se puede desmarcar primary si no hay otro marcado
- [ ] Testing: Cambio de primary contact funciona transaccionalmente
- [ ] UI: Soft delete de contactos (is_active = false)

**Dependencias:** Historia 2.2.1

#### Epic 2.3: Gestión de Facturas

**Historia 2.3.1: Como Miguel, necesito crear facturas manualmente en el sistema**

**Contexto Técnico:** Facturas tienen estado bidimensional (Pago + Temporal). Estado temporal se calcula dinámicamente.

**Acceptance Criteria:**
- [ ] Schema de `invoices` con campos: company_id, invoice_number, amount, currency, issue_date, due_date, confirmed_payment_date, paid_date, payment_status, payment_reference, description, notes
- [ ] RLS policies para `invoices`
- [ ] UI: Formulario de creación de factura desde vista de empresa
- [ ] Validación: invoice_number único por tenant
- [ ] Validación: due_date >= issue_date
- [ ] Validación: amount > 0
- [ ] Campo calculado en frontend: days_until_due y days_overdue
- [ ] Estados de payment_status: pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada
- [ ] Testing: Factura creada aparece en lista de empresa
- [ ] UI: Lista de facturas con filtros por estado y empresa

**Dependencias:** Historia 2.1.1 (requiere companies)

**Historia 2.3.2: Como Miguel, necesito actualizar el estado de facturas (marcar como pagada, escalada, etc.)**

**Acceptance Criteria:**
- [ ] UI: Vista de detalle de factura
- [ ] UI: Botones de acción rápida: "Marcar como Pagada", "Escalar", "Suspender"
- [ ] Al marcar como Pagada: solicitar payment_reference y paid_date
- [ ] Validación: paid_date no puede ser anterior a issue_date
- [ ] Al cambiar estado a pagada: si tiene Collection activa, completarla automáticamente
- [ ] Testing: Cambios de estado se registran correctamente
- [ ] UI: Historial de cambios de estado (audit log básico)

**Dependencias:** Historia 2.3.1

**Historia 2.3.3: Como Miguel, necesito importar facturas desde CSV**

**Contexto Técnico:** Facilita carga inicial masiva de facturas desde ERP.

**Acceptance Criteria:**
- [ ] UI: Componente de upload CSV
- [ ] Template CSV descargable con headers: company_tax_id, invoice_number, amount, currency, issue_date, due_date, description
- [ ] Parser CSV que valida formato y datos
- [ ] Lookup de company_id por tax_id
- [ ] Validación: Si company_tax_id no existe, mostrar error con línea específica
- [ ] Validación: Detectar invoice_number duplicados antes de insertar
- [ ] Preview de datos antes de importar (tabla con 10 primeras filas)
- [ ] Importación transaccional (todo o nada)
- [ ] Reporte de resultados: X exitosas, Y fallidas con razones
- [ ] Testing: Importar 50 facturas correctamente

**Dependencias:** Historia 2.3.1

**Historia 2.3.4: Como Carlos, necesito ver un dashboard con facturas por estado**

**Contexto Técnico:** Primera versión del dashboard operativo.

**Acceptance Criteria:**
- [ ] UI: Dashboard principal con KPIs:
  - Total facturas pendientes
  - Total facturas vencidas (payment_status = pendiente AND due_date < today)
  - Total facturas pagadas este mes
  - Monto total pendiente de cobro
- [ ] UI: Gráfico de facturas vencidas por segmento de días (0-7, 8-15, 16-30, 30+)
- [ ] UI: Lista de facturas vencidas ordenadas por días de retraso
- [ ] Filtros: Por empresa, por estado, por rango de fechas
- [ ] Testing: Dashboard se actualiza en tiempo real al cambiar estados
- [ ] Performance: Dashboard carga en <2 segundos con 1000 facturas

**Dependencias:** Historia 2.3.2 (requiere estados funcionando)

---

### FASE 3: MOTOR DE COBRANZAS (Semanas 4-5)

#### Epic 3.1: Sistema de Playbooks

**Historia 3.1.1: Como desarrollador, necesito el schema de Playbooks y PlaybookMessages**

**Contexto Técnico:** Playbooks son templates de workflows. Definen secuencias de mensajes con cadencia.

**Acceptance Criteria:**
- [ ] Schema de `playbooks` con campos: name, description, trigger_type, trigger_days, is_active, is_default, created_by_user_id
- [ ] Schema de `playbook_messages` con campos: playbook_id, sequence_order, channel, temperature, subject_template, body_template, use_ai_generation, ai_instructions, wait_days, send_only_if_no_response
- [ ] RLS policies para ambas tablas
- [ ] Constraint: Unique index en (tenant_id, trigger_type, is_default = true)
- [ ] Constraint: Unique index en (playbook_id, sequence_order)
- [ ] Testing: No puede haber 2 playbooks default para mismo trigger_type

**Dependencias:** Epic 2 completo (requiere CRM base)

**Historia 3.1.2: Como Miguel, necesito crear playbooks de cobranza con secuencias de mensajes**

**Contexto Técnico:** MVP usa templates simples sin IA para controlar costos.

**Acceptance Criteria:**
- [ ] UI: Formulario de creación de playbook
- [ ] UI: Builder de secuencia de mensajes (lista ordenada)
- [ ] UI: Agregar mensaje a playbook con campos: canal, temperatura, template, días de espera
- [ ] Variables disponibles en template: {{company_name}}, {{contact_first_name}}, {{invoice_number}}, {{amount}}, {{currency}}, {{due_date}}, {{days_overdue}}
- [ ] Preview de mensaje con variables reemplazadas (datos de ejemplo)
- [ ] Validación: sequence_order se asigna automáticamente
- [ ] Validación: Al menos 1 mensaje por playbook
- [ ] Testing: Crear playbook "Cobranza Post-Vencimiento" con 3 mensajes

**Dependencias:** Historia 3.1.1

**Historia 3.1.3: Como sistema, necesito playbooks pre-configurados para casos comunes**

**Contexto Técnico:** Seed data para acelerar onboarding de nuevos tenants.

**Acceptance Criteria:**
- [ ] Seed script crea 3 playbooks default por tenant:
  1. "Recordatorio Pre-Vencimiento" (trigger: 7 días antes, 1 email amigable)
  2. "Cobranza Post-Vencimiento" (trigger: 3 días después, secuencia: Email → WhatsApp → Email firme)
  3. "Escalamiento" (manual, Email con CC a escalation contact)
- [ ] Templates en español natural y profesional
- [ ] Testing: Tenant nuevo tiene los 3 playbooks automáticamente

**Dependencias:** Historia 3.1.2

#### Epic 3.2: Sistema de Collections (Orquestación)

**Historia 3.2.1: Como desarrollador, necesito el schema de Collections**

**Contexto Técnico:** Collection es la instancia de workflow activa. 1 Collection = 1 Invoice.

**Acceptance Criteria:**
- [ ] Schema de `collections` con campos: invoice_id, company_id, primary_contact_id, playbook_id, current_message_index, status, messages_sent_count, last_message_sent_at, customer_responded, last_response_at, started_at, next_action_at, completed_at
- [ ] RLS policies
- [ ] Constraint: Unique index en (invoice_id) WHERE status != 'completed'
- [ ] Enum de status: active, paused, awaiting_response, pending_review, completed, escalated
- [ ] Testing: No puede haber 2 collections activas para misma invoice

**Dependencias:** Historia 3.1.1 y Historia 2.3.1 (requiere playbooks e invoices)

**Historia 3.2.2: Como Miguel, necesito activar un playbook en una factura para automatizar el seguimiento**

**Contexto Técnico:** Activar playbook crea un registro interno de estado (InvoicePlaybookState/Collection) que el motor procesa automáticamente.

**Acceptance Criteria:**
- [ ] UI: Botón "Activar Playbook" en vista de detalle de factura
- [ ] UI: Selector de playbook disponible + confirmación de contacto primary
- [ ] Al activar: La factura muestra badge "Playbook Activo: [nombre]"
- [ ] Validación: Solo facturas con payment_status = pendiente o fecha_confirmada
- [ ] Validación: No activar si ya existe un playbook activo para esa factura
- [ ] Al crear: status = 'active', current_message_index = 0, started_at = now
- [ ] Calcular next_action_at según playbook (inmediato para mensaje 0)
- [ ] Testing: Registro interno creado correctamente con referencias a invoice, company, contact, playbook

**Dependencias:** Historia 3.2.1

**Historia 3.2.3: Como sistema, necesito un worker que evalúe collections y envíe mensajes automáticamente**

**Contexto Técnico:** Este es el motor de automatización. Cron job que ejecuta cada X minutos.

**Acceptance Criteria:**
- [ ] Worker (puede ser Supabase Edge Function o script Node.js)
- [ ] Query: Seleccionar collections con status = 'active' AND next_action_at <= NOW()
- [ ] Para cada collection:
  - Obtener playbook_message según current_message_index
  - Generar mensaje (reemplazar variables del template)
  - Enviar mensaje (llamar servicio de envío)
  - Crear registro en sent_messages
  - Incrementar messages_sent_count
  - Actualizar current_message_index
  - Calcular next_action_at (current time + wait_days del siguiente mensaje)
  - Si no hay más mensajes: status = 'completed'
- [ ] Logging: Registrar cada acción del worker
- [ ] Error handling: Si envío falla, reintentar o marcar para revisión manual
- [ ] Testing: Crear collection, esperar trigger, verificar mensaje enviado
- [ ] Performance: Procesar 100 collections en <30 segundos

**Dependencias:** Historia 3.2.2 + Historia 3.3.1 (requiere envío de mensajes)

**Historia 3.2.4: Como Miguel, necesito pausar/reanudar/completar el playbook activo de una factura**

**Contexto Técnico:** Controles manuales en la vista de detalle de factura para casos excepcionales.

**Acceptance Criteria:**
- [ ] UI: Controles en sección "Playbook Activo" dentro de la factura: "Pausar", "Reanudar", "Completar"
- [ ] Al pausar: status = 'paused', badge cambia a "Playbook Pausado", no procesar en worker
- [ ] Al reanudar: status = 'active', next_action_at = now (enviar siguiente mensaje inmediatamente)
- [ ] Al completar: status = 'completed', completed_at = now, badge desaparece
- [ ] Historial de comunicaciones se mantiene visible aunque playbook esté completado
- [ ] Testing: Playbook pausado no envía mensajes
- [ ] Testing: Playbook reanudado envía siguiente mensaje correctamente

**Dependencias:** Historia 3.2.3

#### Epic 3.3: Envío de Mensajes

**Historia 3.3.1: Como sistema, necesito enviar emails transaccionales**

**Contexto Técnico:** Integración con SendGrid o Postmark para envío de emails.

**Acceptance Criteria:**
- [ ] Integración con SendGrid o Postmark (via API)
- [ ] API keys configuradas en variables de entorno
- [ ] Función `sendEmail(to, subject, body)` que llama provider
- [ ] Schema de `sent_messages` con campos: collection_id, playbook_message_id, contact_id, channel, subject, body, delivery_status, sent_at, delivered_at, was_ai_generated, temperature_used, external_message_id
- [ ] RLS policies para `sent_messages`
- [ ] Al enviar: crear registro con delivery_status = 'pending'
- [ ] Callback de webhook para actualizar delivery_status a 'sent', 'delivered', 'bounced'
- [ ] Testing: Enviar email de prueba y verificar entrega
- [ ] Testing: Webhook actualiza estado correctamente

**Dependencias:** Historia 3.2.1 (requiere collections y sent_messages schema)

**Historia 3.3.2: Como sistema, necesito enviar mensajes de WhatsApp**

**Contexto Técnico:** Integración con WhatsApp Business API (via Twilio o similar).

**Acceptance Criteria:**
- [ ] Integración con Twilio WhatsApp Business API
- [ ] Función `sendWhatsApp(to, body)` que llama API
- [ ] Validación: Número de teléfono en formato internacional
- [ ] Al enviar: crear registro en sent_messages con channel = 'whatsapp'
- [ ] Webhook para estados de entrega de WhatsApp
- [ ] Testing: Enviar WhatsApp de prueba y verificar entrega
- [ ] Manejo de errores: Número inválido, mensaje rechazado

**Dependencias:** Historia 3.3.1 (mismo patrón de envío)

**Historia 3.3.3: Como Miguel, necesito ver la bandeja de comunicaciones de una factura**

**Contexto Técnico:** Trazabilidad - ver qué se envió Y recibió, cuándo, y estado de entrega. Todo en la vista de factura.

**Acceptance Criteria:**
- [ ] UI: Tab "Comunicaciones" en vista de detalle de factura
- [ ] UI: Timeline unificado de mensajes enviados (📤) Y respuestas recibidas (📥)
- [ ] Ordenado cronológicamente (más reciente arriba o abajo - configurable)
- [ ] Mostrar: Fecha/hora, canal, subject (si email), preview de body, estado de entrega
- [ ] Iconos: ✅ Entregado, ⏳ Pendiente, ❌ Rebotado, 📥 Respuesta recibida
- [ ] Click en mensaje: Ver contenido completo en modal/expansión
- [ ] Las respuestas del cliente aparecen integradas en el mismo timeline
- [ ] Testing: Bandeja muestra todos los mensajes enviados y recibidos de la factura

**Dependencias:** Historia 3.3.1, 3.3.2

---

### FASE 4: LOOP DE RESPUESTAS (Semanas 6-7)

#### Epic 4.1: Captura de Respuestas con N8N

**Historia 4.1.1: Como desarrollador, necesito configurar N8N para capturar respuestas de email**

**Contexto Técnico:** N8N recibe webhook cuando cliente responde email, llama IA para interpretar, envía a nuestra app.

**Acceptance Criteria:**
- [ ] N8N instance configurada y accesible
- [ ] Workflow N8N: Email Webhook Trigger → Parse email → Call OpenAI → Send to App Webhook
- [ ] Configurar inbox de email para recibir respuestas (ej: cobranzas@tudominio.com)
- [ ] Parser extrae: from_email, subject, body, in_reply_to (para identificar sent_message)
- [ ] Call OpenAI con prompt: "Interpretar esta respuesta de cliente sobre cobranza: [body]. Retornar JSON con intent, suggested_action, extracted_data"
- [ ] Webhook a nuestra app: POST /api/webhooks/customer-response con payload completo
- [ ] Testing: Enviar respuesta de prueba, verificar que llega a nuestra app

**Dependencias:** Historia 3.3.1 (requiere mensajes siendo enviados)

**Historia 4.1.2: Como desarrollador, necesito configurar N8N para capturar respuestas de WhatsApp**

**Contexto Técnico:** Similar a email pero desde WhatsApp Business API webhooks.

**Acceptance Criteria:**
- [ ] N8N Workflow: WhatsApp Webhook Trigger → Parse message → Call OpenAI → Send to App Webhook
- [ ] Configurar webhook de Twilio para recibir mensajes entrantes
- [ ] Parser extrae: from_phone, body, timestamp
- [ ] Lookup de contact por phone number
- [ ] Lookup de collection activa para ese contact
- [ ] Call OpenAI (mismo prompt que email)
- [ ] Webhook a nuestra app con payload
- [ ] Testing: Responder por WhatsApp, verificar captura

**Dependencias:** Historia 3.3.2 y 4.1.1 (requiere WhatsApp enviándose y patrón de N8N)

**Historia 4.1.3: Como sistema, necesito endpoint para recibir respuestas desde N8N**

**Contexto Técnico:** API endpoint que procesa webhook de N8N y crea CustomerResponse.

**Acceptance Criteria:**
- [ ] Schema de `customer_responses` con campos: collection_id, sent_message_id, channel, raw_content, ai_interpretation, admin_action_taken, admin_notes, processed_by_user_id, processed_at, status, received_at, external_message_id
- [ ] RLS policies
- [ ] Endpoint: POST /api/webhooks/customer-response (sin auth - webhook firmado)
- [ ] Validación de firma de N8N para seguridad
- [ ] Crear registro en customer_responses con status = 'pending_review'
- [ ] Actualizar collection: customer_responded = true, status = 'pending_review', last_response_at = now
- [ ] Pausar playbook (no enviar siguiente mensaje hasta que admin revise)
- [ ] Testing: Simular webhook de N8N, verificar creación de response

**Dependencias:** Historia 4.1.1, 4.1.2

#### Epic 4.2: Bandeja de Supervisión

**Historia 4.2.1: Como Miguel, necesito ver una bandeja de respuestas pendientes de revisión**

**Contexto Técnico:** UI central donde Miguel ve todas las respuestas que requieren su atención.

**Acceptance Criteria:**
- [ ] UI: Vista "Bandeja de Respuestas" accesible desde menú principal
- [ ] Query: customer_responses WHERE status = 'pending_review' ORDER BY received_at ASC
- [ ] UI: Lista de cards de respuestas con:
  - Empresa, Factura, Monto
  - Contacto que respondió
  - Preview del mensaje del cliente
  - Sugerencia de IA destacada (badge con intent + action)
  - Botones de acción
- [ ] Badge de "Pendientes" en menú con contador
- [ ] Testing: Respuesta nueva aparece en bandeja inmediatamente

**Dependencias:** Historia 4.1.3

**Historia 4.2.2: Como Miguel, necesito procesar respuestas aprobando la sugerencia de IA**

**Contexto Técnico:** Flow principal: IA sugiere acción, Miguel aprueba con 1 click.

**Acceptance Criteria:**
- [ ] UI: Botón "Aprobar Sugerencia" en card de respuesta
- [ ] Según ai_interpretation.suggested_action:
  - "marcar_fecha_confirmada": Actualizar invoice con confirmed_payment_date extraída
  - "marcar_pagada": Solicitar payment_reference y marcar invoice como pagada
  - "escalar": Cambiar invoice a status 'escalada'
  - "revisar_manual": Solo marcar como procesada sin acción automática
- [ ] Al aprobar:
  - Actualizar customer_response: status = 'processed', admin_action_taken = 'approved_ai_suggestion', processed_by_user_id, processed_at
  - Ejecutar acción sobre invoice
  - Actualizar collection según caso (completar si pagada, pausar si escalada)
- [ ] Testing: Aprobar sugerencia "marcar_fecha_confirmada" actualiza invoice correctamente

**Dependencias:** Historia 4.2.1

**Historia 4.2.3: Como Miguel, necesito procesar respuestas manualmente si la sugerencia de IA no es correcta**

**Contexto Técnico:** Override manual para casos donde IA no interpreta bien.

**Acceptance Criteria:**
- [ ] UI: Botón "Acción Manual" abre modal
- [ ] Modal con opciones:
  - Marcar factura como Fecha Confirmada (selector de fecha)
  - Marcar factura como Pagada (input payment_reference)
  - Escalar factura
  - Solo marcar respuesta como procesada sin cambios
  - Reanudar playbook (continuar enviando mensajes)
- [ ] Campo de texto para admin_notes
- [ ] Al guardar:
  - Actualizar customer_response: status = 'processed', admin_action_taken = 'manual_override'
  - Ejecutar acción seleccionada
- [ ] Testing: Override manual funciona correctamente

**Dependencias:** Historia 4.2.2

**Historia 4.2.4: Como Miguel, necesito ver el contexto completo al procesar una respuesta**

**Contexto Técnico:** Panel lateral con toda la información relevante.

**Acceptance Criteria:**
- [ ] UI: Click en respuesta abre panel lateral con:
  - Datos de factura (número, monto, fecha vencimiento, estado actual)
  - Datos de empresa y contacto
  - Historial completo de mensajes enviados
  - Mensaje completo del cliente (raw_content)
  - Interpretación de IA detallada (JSON formateado)
  - Confidence score de IA
- [ ] UI: Desde panel se puede ejecutar acción sin volver a lista
- [ ] Testing: Contexto completo visible

**Dependencias:** Historia 4.2.1

---

### FASE 5: DASHBOARD Y REFINAMIENTO (Semana 8)

#### Epic 5.1: Dashboard Operativo Completo

**Historia 5.1.1: Como Carlos, necesito ver KPIs de cobranzas en tiempo real**

**Contexto Técnico:** Dashboard enriquecido con métricas de automatización.

**Acceptance Criteria:**
- [ ] UI: Dashboard con 4 secciones principales:
  1. **Facturas:** Total pendientes, vencidas, pagadas (del mes), monto pendiente
  2. **Cobranzas:** Total activas, pausadas, completadas, pendientes de revisión
  3. **Actividad:** Mensajes enviados hoy/semana, tasa de entrega, tasa de respuesta
  4. **Alertas:** Facturas críticas (vencidas >30 días), respuestas sin procesar >24h
- [ ] Gráficos:
  - Facturas vencidas por segmento de días (barras)
  - Tendencia de DSO últimos 3 meses (línea)
  - Actividad de mensajes últimos 7 días (área)
- [ ] Filtros: Por rango de fechas, por empresa
- [ ] Auto-refresh cada 30 segundos
- [ ] Testing: Dashboard refleja cambios en tiempo real

**Dependencias:** Todas las historias anteriores (dashboard integra todo)

**Historia 5.1.2: Como Carlos, necesito exportar reportes de cobranzas**

**Acceptance Criteria:**
- [ ] UI: Botón "Exportar" en dashboard
- [ ] Formatos: CSV, Excel
- [ ] Reporte incluye: Lista de facturas con estado, monto, días vencidas, última actividad
- [ ] Reporte incluye: Resumen de KPIs al inicio
- [ ] Testing: Exportar CSV con 100 facturas correctamente

**Dependencias:** Historia 5.1.1

#### Epic 5.2: Notificaciones y Alertas

**Historia 5.2.1: Como Miguel, necesito recibir notificaciones cuando hay respuestas nuevas**

**Acceptance Criteria:**
- [ ] Sistema de notificaciones in-app (badge + lista)
- [ ] Crear notificación cuando:
  - Nueva respuesta de cliente (pending_review)
  - Factura marcada como pagada
  - Collection completada automáticamente
- [ ] UI: Dropdown de notificaciones en header
- [ ] Notificaciones marcan como leídas al abrir
- [ ] Testing: Notificación aparece al crear respuesta

**Dependencias:** Historia 4.2.1

**Historia 5.2.2: Como Miguel, necesito recibir notificaciones por email de eventos críticos (opcional - nice to have)**

**Acceptance Criteria:**
- [ ] Email cuando hay respuesta pendiente >24h sin procesar
- [ ] Email cuando factura crítica (>30 días vencida) sin cobranza activa
- [ ] Configuración de usuario: activar/desactivar emails
- [ ] Testing: Email enviado correctamente

**Dependencias:** Historia 5.2.1 y 3.3.1 (usa mismo sistema de email)

#### Epic 5.3: Escalamiento Manual

**Historia 5.3.1: Como Miguel, necesito escalar facturas manualmente**

**Contexto Técnico:** Activar playbook de escalamiento que incluye CC a escalation contact.

**Acceptance Criteria:**
- [ ] UI: Botón "Escalar" en vista de factura e invoice
- [ ] Al escalar:
  - Cambiar invoice.payment_status = 'escalada'
  - Si tiene collection activa: pausarla
  - Crear nueva collection con playbook "Escalamiento"
  - Playbook de escalamiento envía email con CC a escalation_contact
- [ ] Validación: Empresa debe tener escalation_contact definido
- [ ] Testing: Escalamiento envía email correctamente con CC

**Dependencias:** Historia 3.1.3 (requiere playbook de escalamiento), Historia 2.2.1 (requiere escalation contact)

---

## Technical Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  CRM UI  │  │Collections│  │ Bandeja  │   │
│  │   KPIs   │  │Companies │  │ Playbooks │  │Respuestas│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ API Calls (authenticated with JWT)
┌───────────────────────▼─────────────────────────────────────┐
│                  API LAYER (Next.js API Routes)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Tenants  │  │   CRM    │  │Collections│  │Responses │   │
│  │  Users   │  │  CRUD    │  │  Engine   │  │ Webhook  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Supabase Client (with tenant_id from JWT)
┌───────────────────────▼─────────────────────────────────────┐
│              SUPABASE (PostgreSQL + RLS)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TABLES: tenants, users, companies, contacts,         │  │
│  │         invoices, collections, playbooks,            │  │
│  │         playbook_messages, sent_messages,            │  │
│  │         customer_responses                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ RLS POLICIES: All tables filtered by tenant_id      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                BACKGROUND WORKERS                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ COLLECTION WORKER (Cron every 5 min)                 │  │
│  │ - Query collections with next_action_at <= NOW()    │  │
│  │ - Generate message from template                     │  │
│  │ - Call message sending service                       │  │
│  │ - Update collection state                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────┬───────────────┬─────────────────────────┘
                    │               │
         ┌──────────▼──────┐   ┌───▼──────────┐
         │  SendGrid/      │   │   Twilio     │
         │  Postmark       │   │  WhatsApp    │
         │  (Email)        │   │  Business    │
         └─────────────────┘   └──────────────┘
                    │               │
                    └───────┬───────┘
                            │ Webhooks (delivery status, replies)
                    ┌───────▼────────┐
                    │      N8N       │
                    │  ORCHESTRATOR  │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────▼────┐  ┌────▼─────┐  ┌───▼─────────┐
    │Email Webhook │  │ WhatsApp │  │   OpenAI    │
    │   Capture    │  │ Webhook  │  │ Interpret   │
    └─────────┬────┘  └────┬─────┘  └───┬─────────┘
              │             │             │
              └─────────────┼─────────────┘
                            │ Send interpreted response
                    ┌───────▼────────┐
                    │  Our API       │
                    │ /webhooks/     │
                    │ customer-      │
                    │ response       │
                    └────────────────┘
```

### Authentication Flow (Clerk + Supabase)

```
1. User signs up/logs in via Clerk
   ↓
2. Clerk generates JWT with custom claim: tenant_id
   ↓
3. Frontend includes JWT in all API requests
   ↓
4. API routes verify JWT with Clerk
   ↓
5. Extract tenant_id from JWT
   ↓
6. Supabase client initialized with tenant_id in context
   ↓
7. RLS policies automatically filter all queries by tenant_id
   ↓
8. Response only contains data for that tenant
```

**Security Guarantees:**
- User CANNOT access data from other tenants (RLS enforced at DB level)
- Even if frontend has bugs, RLS prevents data leaks
- Tenant isolation is cryptographically guaranteed via JWT

### Data Model (Detailed)

#### Core Entities

**Tenant** (Organization isolation)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  default_currency VARCHAR(3) DEFAULT 'USD',
  plan_type VARCHAR(20) DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User** (Authenticated users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_clerk ON users(clerk_user_id);
```

**Company** (Customer entities)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  industry VARCHAR(100),
  payment_terms_days INTEGER DEFAULT 30,
  risk_level VARCHAR(20) DEFAULT 'medio',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_tax_id_per_tenant UNIQUE(tenant_id, tax_id)
);

CREATE INDEX idx_companies_tenant ON companies(tenant_id);
```

**Contact** (People within companies)
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(100),
  is_primary_contact BOOLEAN DEFAULT false,
  is_escalation_contact BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);

-- Validation: Only 1 primary contact per company
-- Validation: Only 1 escalation contact per company
-- These are enforced at application level
```

**Invoice** (Invoices to collect)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL CHECK (due_date >= issue_date),
  confirmed_payment_date DATE,
  paid_date DATE,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  payment_reference VARCHAR(255),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_invoice_number_per_tenant UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status, due_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE payment_status IN ('pendiente', 'fecha_confirmada');
```

**Playbook** (Workflow templates)
```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_default_per_trigger UNIQUE(tenant_id, trigger_type, is_default)
    WHERE is_default = true
);

CREATE INDEX idx_playbooks_tenant ON playbooks(tenant_id);
```

**PlaybookMessage** (Messages in sequence)
```sql
CREATE TABLE playbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL,
  temperature VARCHAR(20) NOT NULL,
  subject_template VARCHAR(500),
  body_template TEXT NOT NULL,
  use_ai_generation BOOLEAN DEFAULT false,
  ai_instructions TEXT,
  wait_days INTEGER DEFAULT 0,
  send_only_if_no_response BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_sequence_per_playbook UNIQUE(playbook_id, sequence_order)
);

CREATE INDEX idx_playbook_messages_playbook ON playbook_messages(playbook_id, sequence_order);
```

**Collection** (Active collection workflow)
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  primary_contact_id UUID NOT NULL REFERENCES contacts(id),
  playbook_id UUID NOT NULL REFERENCES playbooks(id),
  current_message_index INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  messages_sent_count INTEGER DEFAULT 0,
  last_message_sent_at TIMESTAMP,
  customer_responded BOOLEAN DEFAULT false,
  last_response_at TIMESTAMP,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  next_action_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_active_collection_per_invoice UNIQUE(invoice_id)
    WHERE status != 'completed'
);

CREATE INDEX idx_collections_tenant ON collections(tenant_id);
CREATE INDEX idx_collections_status ON collections(status, next_action_at);
CREATE INDEX idx_collections_pending_review ON collections(tenant_id, status)
  WHERE status = 'pending_review';
```

**SentMessage** (Message delivery tracking)
```sql
CREATE TABLE sent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  playbook_message_id UUID REFERENCES playbook_messages(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  was_ai_generated BOOLEAN DEFAULT false,
  temperature_used VARCHAR(20),
  external_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sent_messages_tenant ON sent_messages(tenant_id);
CREATE INDEX idx_sent_messages_collection ON sent_messages(collection_id);
CREATE INDEX idx_sent_messages_external_id ON sent_messages(external_message_id);
```

**CustomerResponse** (Captured responses)
```sql
CREATE TABLE customer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  sent_message_id UUID REFERENCES sent_messages(id),
  channel VARCHAR(20) NOT NULL,
  raw_content TEXT NOT NULL,
  ai_interpretation JSONB,
  admin_action_taken VARCHAR(100),
  admin_notes TEXT,
  processed_by_user_id UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  external_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customer_responses_tenant ON customer_responses(tenant_id);
CREATE INDEX idx_customer_responses_collection ON customer_responses(collection_id);
CREATE INDEX idx_customer_responses_pending ON customer_responses(tenant_id, status)
  WHERE status = 'pending_review';
```

### Row Level Security (RLS) Policies

**Example for companies table:**
```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "tenant_isolation_companies_select"
ON companies FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for INSERT
CREATE POLICY "tenant_isolation_companies_insert"
ON companies FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for UPDATE
CREATE POLICY "tenant_isolation_companies_update"
ON companies FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for DELETE
CREATE POLICY "tenant_isolation_companies_delete"
ON companies FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Apply similar policies to ALL tables with tenant_id.**

**Setting tenant_id in session (from API route):**
```typescript
// In Next.js API route
const { userId } = auth(); // Clerk
const user = await getUserFromClerk(userId);
const tenantId = user.publicMetadata.tenant_id;

// Set in Supabase client
await supabase.rpc('set_config', {
  setting: 'app.current_tenant_id',
  value: tenantId
});

// All subsequent queries automatically filtered by tenant_id
const { data } = await supabase.from('companies').select('*');
// Returns only companies for this tenant
```

### Collection Worker Logic (Pseudo-code)

```typescript
// Runs every 5 minutes (cron job)
async function processCollections() {
  // Query collections ready to send next message
  const collections = await supabase
    .from('collections')
    .select(`
      *,
      invoice:invoices(*),
      company:companies(*),
      contact:contacts(*),
      playbook:playbooks(*, messages:playbook_messages(*))
    `)
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString());

  for (const collection of collections) {
    try {
      // Get current playbook message
      const playbookMessage = collection.playbook.messages
        .find(m => m.sequence_order === collection.current_message_index);

      if (!playbookMessage) {
        // No more messages, complete collection
        await completeCollection(collection.id);
        continue;
      }

      // Check condition: send_only_if_no_response
      if (playbookMessage.send_only_if_no_response && collection.customer_responded) {
        // Customer already responded, skip this message
        await moveToNextMessage(collection);
        continue;
      }

      // Generate message content
      const messageContent = generateMessage(
        playbookMessage,
        collection.invoice,
        collection.company,
        collection.contact
      );

      // Send message
      let deliveryResult;
      if (playbookMessage.channel === 'email') {
        deliveryResult = await sendEmail(
          collection.contact.email,
          messageContent.subject,
          messageContent.body
        );
      } else if (playbookMessage.channel === 'whatsapp') {
        deliveryResult = await sendWhatsApp(
          collection.contact.phone,
          messageContent.body
        );
      }

      // Record sent message
      await supabase.from('sent_messages').insert({
        tenant_id: collection.tenant_id,
        collection_id: collection.id,
        playbook_message_id: playbookMessage.id,
        contact_id: collection.contact.id,
        channel: playbookMessage.channel,
        subject: messageContent.subject,
        body: messageContent.body,
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        external_message_id: deliveryResult.messageId,
        temperature_used: playbookMessage.temperature
      });

      // Update collection
      await moveToNextMessage(collection);

    } catch (error) {
      console.error(`Failed to process collection ${collection.id}:`, error);
      // Mark for manual review or retry
    }
  }
}

function generateMessage(playbookMessage, invoice, company, contact) {
  // Template variable replacement
  const variables = {
    company_name: company.name,
    contact_first_name: contact.first_name,
    contact_name: `${contact.first_name} ${contact.last_name}`,
    invoice_number: invoice.invoice_number,
    amount: invoice.amount,
    currency: invoice.currency,
    due_date: formatDate(invoice.due_date),
    days_overdue: calculateDaysOverdue(invoice.due_date)
  };

  let subject = playbookMessage.subject_template || '';
  let body = playbookMessage.body_template;

  // Replace {{variable}} with actual values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

async function moveToNextMessage(collection) {
  const nextIndex = collection.current_message_index + 1;
  const nextMessage = collection.playbook.messages
    .find(m => m.sequence_order === nextIndex);

  if (!nextMessage) {
    // No more messages
    await completeCollection(collection.id);
    return;
  }

  // Calculate next_action_at
  const nextActionAt = new Date();
  nextActionAt.setDate(nextActionAt.getDate() + nextMessage.wait_days);

  await supabase
    .from('collections')
    .update({
      current_message_index: nextIndex,
      messages_sent_count: collection.messages_sent_count + 1,
      last_message_sent_at: new Date().toISOString(),
      next_action_at: nextActionAt.toISOString()
    })
    .eq('id', collection.id);
}

async function completeCollection(collectionId) {
  await supabase
    .from('collections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', collectionId);
}
```

### N8N Workflow for Response Interpretation

**Email Response Workflow:**
```
1. Email Webhook Trigger (configured with inbox email)
   ↓
2. Parse Email Node
   - Extract: from_email, subject, body, in_reply_to
   ↓
3. Lookup Sent Message (HTTP Request to our API)
   - Match by in_reply_to or from_email + recent timeframe
   ↓
4. Call OpenAI API
   - Prompt: "Interpret this customer response about invoice collection:
     [body]. Return JSON with:
     - intent: 'confirmar_pago' | 'solicitar_extension' | 'ya_pago' | 'disputa' | 'otro'
     - suggested_action: 'marcar_fecha_confirmada' | 'marcar_pagada' | 'escalar' | 'revisar_manual'
     - extracted_data: { payment_date?, amount_mentioned?, notes? }
     - confidence: 0-1"
   ↓
5. Send to Our API (HTTP Request POST /api/webhooks/customer-response)
   - Payload: {
       collection_id,
       sent_message_id,
       channel: 'email',
       raw_content: body,
       ai_interpretation: { ... }
     }
```

**WhatsApp Response Workflow:**
Similar structure but triggered by Twilio WhatsApp webhook.

### Technology Stack

#### Frontend Layer

**Framework & UI:**
- **Next.js 14 (App Router)** - Framework React full-stack con Server Components para performance óptima
- **TypeScript** - Type safety end-to-end, reducción de bugs en producción
- **Tailwind CSS** - Utility-first CSS para desarrollo rápido y consistente
- **shadcn/ui** - Componentes React accesibles y customizables (Radix UI + Tailwind)
  - Incluye: Dialog, DropdownMenu, Table, Form, Toast, Sheet, Command, etc.
  - Ventaja: Código copiable, no librería pesada

**State & Data Management:**
- **React Query (TanStack Query)** - Server state management, caching automático, refetch inteligente
- **Zustand** - Client state ligero para UI state (modales, sidebar, preferencias)
- **React Hook Form** - Formularios performantes con validación
- **Zod** - Schema validation para formularios y API responses

#### Backend Layer

**API & Server:**
- **Next.js API Routes** - Endpoints REST en `/app/api/*`
- **Server Actions** - Para mutaciones desde Server Components (alternativa a API routes)
- **Middleware** - Auth validation en edge con Clerk

**Database & ORM:**
- **Supabase (PostgreSQL)** - Base de datos principal con:
  - Row Level Security (RLS) para multi-tenancy
  - Realtime subscriptions para dashboard live
  - Storage para attachments (post-MVP)
  - Edge Functions para workers (alternativa a cron)
- **Prisma** - ORM y schema management
  - Uso: Migraciones, type generation, schema source of truth
  - **Importante:** Queries se harán con **Supabase Client** para aprovechar RLS automático
  - Prisma solo para: `prisma migrate`, `prisma generate`, type safety

**Justificación Arquitectura DB:**
- Supabase Client entiende RLS policies nativamente
- Prisma genera tipos TypeScript desde schema
- Best of both worlds: RLS security + Type safety

**Authentication:**
- **Clerk** - Auth as a service con:
  - JWT con custom claims (`tenant_id`)
  - User management UI pre-built
  - Webhooks para sincronización con Supabase
  - Multi-factor auth (post-MVP)
  - SSO enterprise (post-MVP)

#### External Services & Integrations

**Workflow Orchestration:**
- **N8N (Cloud o self-hosted)** - Low-code automation para:
  - Captura de respuestas email/WhatsApp
  - Llamadas a OpenAI para interpretación
  - Webhooks a nuestra API

**Communication Providers:**
- **SendGrid** o **Postmark** - Email transaccional
  - Webhooks para delivery tracking
  - Templates para emails (opcional)
- **Twilio WhatsApp Business API** - Mensajería WhatsApp
  - Sandbox para desarrollo
  - Production API con número verificado

**AI Services:**
- **OpenAI API (GPT-4)** - Interpretación de respuestas de clientes
  - Modelo: `gpt-4-turbo` para balance costo/calidad
  - Fallback: `gpt-3.5-turbo` si presupuesto limitado en MVP

#### Infrastructure & Deployment

**Hosting:**
- **Vercel** - Deployment de Next.js con:
  - Edge Functions para API routes
  - Automatic deployments desde GitHub
  - Preview deployments por PR
  - Environment variables por entorno
  - Analytics y Web Vitals monitoring

**Database Hosting:**
- **Supabase Cloud** - Managed PostgreSQL
  - Backups automáticos
  - Connection pooling
  - Dashboard para queries SQL

**Background Jobs:**
- **Vercel Cron Jobs** - Para Collection Worker (ejecuta cada 5 min)
  - Alternativa: Supabase Edge Functions con pg_cron

**Monitoring & Logging:**
- **Vercel Analytics** - Web vitals, performance
- **Sentry** - Error tracking y monitoring
  - Source maps para debugging producción
  - Performance monitoring
- **Supabase Logs** - Database query logs

#### Development Tools

**Version Control:**
- **GitHub** - Repositorio principal
  - Branch protection en `main`
  - PR reviews obligatorios
  - GitHub Actions para CI/CD (opcional - Vercel maneja CD)

**Code Quality:**
- **ESLint** - Linting con config Next.js + TypeScript
- **Prettier** - Code formatting automático
- **Husky** - Git hooks para pre-commit (lint + format)
- **TypeScript Strict Mode** - Type checking estricto

**Testing:**
- **Vitest** - Unit tests (más rápido que Jest)
- **React Testing Library** - Component tests
- **Playwright** - E2E tests
  - Testing multi-tenant isolation
  - Testing workflow completo de cobranzas

**Development Env:**
- **pnpm** - Package manager (más rápido que npm)
- **Docker** (opcional) - Para N8N local y Supabase local
- **Supabase CLI** - Migraciones locales y testing

#### Additional Tools

**UI Development:**
- **Storybook** (opcional para MVP) - Component library documentation
- **Figma** - Diseños UI/UX (si hay diseñador)

**API Documentation:**
- **OpenAPI / Swagger** (post-MVP) - Documentación de API routes

**Security:**
- **Rate Limiting** - Upstash Redis + Vercel Edge para API protection
- **CORS** - Configurado en Next.js middleware
- **Helmet** - Security headers (CSP, XSS protection)

---

### Justificación del Stack

**¿Por qué este stack específico?**

1. **Next.js 14 + Vercel:** Mejor DX para React, deployment zero-config, performance edge
2. **Tailwind + shadcn/ui:** Velocidad de desarrollo sin sacrificar customización
3. **Supabase + Clerk:** Multi-tenancy seguro desde día 1, menos código de auth custom
4. **Prisma + Supabase Client:** Type safety + RLS nativo = seguridad + DX
5. **N8N:** Evita escribir código custom para integraciones complejas (email, WhatsApp, AI)
6. **TypeScript end-to-end:** Reduce bugs, mejora refactoring, autocomplete en todo

**Trade-offs Conscientes:**

- **Supabase vs PostgreSQL self-hosted:** Sacrificamos control total por velocidad de setup y RLS built-in
- **Clerk vs Auth custom:** Pagamos por servicio pero ganamos 2-3 semanas de desarrollo
- **N8N vs código custom:** Low-code acelera MVP, podemos reemplazar después si es necesario
- **Vercel vs AWS/GCP:** Más caro a escala pero deployment instantáneo y zero DevOps en MVP

**Escalabilidad Futura:**

Este stack soporta crecimiento a:
- **100 tenants** - Sin cambios
- **1,000 tenants** - Optimización de queries, índices adicionales
- **10,000+ tenants** - Considerar sharding de DB, separar workers a infraestructura dedicada

**Costo Estimado MVP (mensual):**
- Vercel Pro: ~$20/mes
- Supabase Pro: ~$25/mes
- Clerk: ~$25/mes (hasta 5k MAU)
- N8N Cloud: ~$20/mes (starter)
- SendGrid/Twilio: Variable (~$50-100/mes piloto)
- OpenAI API: Variable (~$50-100/mes piloto)
- **Total: ~$200-300/mes** para MVP con 5-10 tenants en prueba piloto

---

## Implementation Roadmap

### Week 1: Setup & Fundamentos Multi-Tenant

**Objetivos:**
- Infraestructura base configurada
- Autenticación funcionando
- Aislamiento multi-tenant validado

**Historias a Completar:**
- Epic 1.1 completo (Historias 1.1.1 a 1.1.4)

**Entregables:**
- Supabase project configurado con RLS
- Clerk integrado con custom claims
- Usuario puede registrarse y login
- Seed data de tenant demo funcionando
- Testing de aislamiento multi-tenant pasando

**Validación de Semana:**
- [ ] Usuario de tenant A no puede ver datos de tenant B
- [ ] Registro crea tenant automáticamente
- [ ] Login exitoso redirige a dashboard vacío

---

### Week 2: CRM Base - Empresas y Contactos

**Objetivos:**
- CRUD completo de empresas y contactos
- Validaciones de contacto primary/escalation funcionando

**Historias a Completar:**
- Epic 2.1 completo (Historias 2.1.1 a 2.1.2)
- Epic 2.2 completo (Historias 2.2.1 a 2.2.2)

**Entregables:**
- UI de gestión de empresas (crear, editar, listar)
- UI de gestión de contactos por empresa
- Validación: 1 contacto primary por empresa
- Validación: Máximo 1 contacto escalation por empresa

**Validación de Semana:**
- [ ] Crear empresa, agregar 3 contactos
- [ ] Marcar uno como primary, intentar marcar segundo falla
- [ ] Cambiar quién es primary funciona correctamente
- [ ] Empresa con contactos se ve correctamente en detalle

---

### Week 3: CRM Base - Facturas y Dashboard

**Objetivos:**
- CRUD de facturas con estados bidimensionales
- Dashboard básico con KPIs
- Importación CSV de facturas

**Historias a Completar:**
- Epic 2.3 completo (Historias 2.3.1 a 2.3.4)

**Entregables:**
- UI de creación y edición de facturas
- Estados de factura funcionando (pendiente, pagada, escalada, etc.)
- Importador CSV con validaciones
- Dashboard con facturas por estado y monto pendiente
- Gráfico de facturas vencidas por segmento

**Validación de Semana:**
- [ ] Crear factura manualmente
- [ ] Importar 20 facturas desde CSV
- [ ] Marcar factura como pagada, aparece en dashboard
- [ ] Dashboard muestra KPIs correctos
- [ ] Filtrar facturas vencidas funciona

---

### Week 4: Motor de Cobranzas - Playbooks

**Objetivos:**
- Sistema de playbooks con secuencias de mensajes
- Builder de playbooks funcionando
- Playbooks pre-configurados seedeados

**Historias a Completar:**
- Epic 3.1 completo (Historias 3.1.1 a 3.1.3)

**Entregables:**
- Schema de playbooks y playbook_messages
- UI para crear y editar playbooks
- Builder de secuencia de mensajes (agregar, reordenar, editar)
- Preview de mensajes con variables
- 3 playbooks default seedeados

**Validación de Semana:**
- [ ] Crear playbook "Cobranza Suave" con 2 mensajes
- [ ] Preview muestra variables reemplazadas correctamente
- [ ] Playbooks default existen al crear nuevo tenant
- [ ] Variables {{invoice_number}}, {{amount}}, etc. funcionan

---

### Week 5: Motor de Cobranzas - Collections y Envío

**Objetivos:**
- Sistema de collections funcionando
- Worker enviando mensajes automáticamente
- Integración con SendGrid/Twilio

**Historias a Completar:**
- Epic 3.2 completo (Historias 3.2.1 a 3.2.4)
- Epic 3.3 completo (Historias 3.3.1 a 3.3.3)

**Entregables:**
- Schema de collections y sent_messages
- UI para crear cobranza desde factura
- Worker que procesa collections cada 5 min
- Integración SendGrid (email) funcionando
- Integración Twilio WhatsApp funcionando
- Historial de mensajes enviados visible

**Validación de Semana:**
- [ ] Crear collection para factura
- [ ] Worker envía primer mensaje automáticamente
- [ ] Email llega a destinatario
- [ ] WhatsApp llega a destinatario
- [ ] Historial muestra mensajes enviados con estados
- [ ] Pausar/reanudar collection funciona

---

### Week 6: Loop de Respuestas - N8N y Captura

**Objetivos:**
- N8N capturando respuestas de email y WhatsApp
- IA interpretando respuestas
- Webhook hacia nuestra app funcionando

**Historias a Completar:**
- Epic 4.1 completo (Historias 4.1.1 a 4.1.3)

**Entregables:**
- N8N workflow para email responses
- N8N workflow para WhatsApp responses
- Integración OpenAI para interpretación
- Schema de customer_responses
- Endpoint /api/webhooks/customer-response funcionando
- Collections se marcan como pending_review al recibir respuesta

**Validación de Semana:**
- [ ] Responder email de cobranza
- [ ] N8N captura respuesta y llama OpenAI
- [ ] OpenAI interpreta intent y sugiere acción
- [ ] Webhook crea customer_response en nuestra DB
- [ ] Collection cambia a status pending_review
- [ ] Playbook se pausa (no envía siguiente mensaje)

---

### Week 7: Loop de Respuestas - Bandeja de Supervisión

**Objetivos:**
- UI de bandeja de respuestas pendientes
- Miguel puede aprobar/rechazar sugerencias de IA
- Acciones se ejecutan sobre facturas y collections

**Historias a Completar:**
- Epic 4.2 completo (Historias 4.2.1 a 4.2.4)

**Entregables:**
- UI de bandeja de respuestas con contador
- Card de respuesta con sugerencia IA destacada
- Botón "Aprobar Sugerencia" ejecuta acción
- Modal de "Acción Manual" para override
- Panel lateral con contexto completo
- Acciones: marcar_fecha_confirmada, marcar_pagada, escalar

**Validación de Semana:**
- [ ] Respuesta aparece en bandeja inmediatamente
- [ ] Aprobar sugerencia "marcar_fecha_confirmada" actualiza invoice
- [ ] Aprobar sugerencia "marcar_pagada" completa collection
- [ ] Override manual funciona correctamente
- [ ] Panel lateral muestra todo el contexto relevante

---

### Week 8: Dashboard, Notificaciones y Refinamiento

**Objetivos:**
- Dashboard completo con todas las métricas
- Sistema de notificaciones
- Escalamiento manual funcionando
- Testing end-to-end

**Historias a Completar:**
- Epic 5.1 completo (Historias 5.1.1 a 5.1.2)
- Epic 5.2 completo (Historias 5.2.1 a 5.2.2)
- Epic 5.3 completo (Historia 5.3.1)

**Entregables:**
- Dashboard enriquecido con KPIs de automatización
- Gráficos de actividad y tendencias
- Exportación de reportes CSV/Excel
- Notificaciones in-app funcionando
- Notificaciones por email (opcional)
- Escalamiento manual con playbook específico
- Testing E2E de flujo completo

**Validación de Semana:**
- [ ] Dashboard muestra: facturas, cobranzas, actividad, alertas
- [ ] Exportar CSV con reporte completo
- [ ] Notificación aparece al crear respuesta
- [ ] Escalar factura envía email con CC a escalation contact
- [ ] Flujo E2E: Crear factura → Collection → Mensaje → Respuesta → Aprobar → Pagada

**Testing E2E Crítico:**
```
1. Crear tenant nuevo
2. Crear empresa con 2 contactos (primary + escalation)
3. Crear factura vencida
4. Crear collection con playbook "Cobranza Post-Vencimiento"
5. Worker envía primer mensaje (email)
6. Simular respuesta del cliente: "Les pago el viernes"
7. N8N captura → OpenAI interpreta → Webhook a app
8. Respuesta aparece en bandeja con sugerencia "marcar_fecha_confirmada"
9. Miguel aprueba sugerencia
10. Invoice actualizada con confirmed_payment_date
11. Collection pausada
12. Verificar en dashboard: factura en estado "fecha_confirmada"
```

---

### Post-Week 8: Preparación para Producción

**Tareas Adicionales (No son historias de usuario):**

**Seguridad:**
- [ ] Audit completo de RLS policies
- [ ] Testing de penetración multi-tenant
- [ ] Rate limiting en API routes
- [ ] Validación exhaustiva de inputs

**Performance:**
- [ ] Optimización de queries (EXPLAIN ANALYZE)
- [ ] Índices adicionales según queries reales
- [ ] Caching de dashboard (Redis opcional)
- [ ] Lazy loading en UI

**Monitoring:**
- [ ] Logging centralizado (Sentry)
- [ ] Monitoring de worker (uptime, errores)
- [ ] Alertas de system down
- [ ] Analytics de uso (Plausible o similar)

**Documentación:**
- [ ] README técnico para desarrolladores
- [ ] Guía de deployment
- [ ] Documentación de API interna
- [ ] User guide para Miguel/Carlos

---

## Definition of Done (MVP)

**El MVP está completo y listo para prueba piloto cuando:**

1. ✅ **Todas las historias de Semanas 1-8 completadas** con acceptance criteria pasando
2. ✅ **Testing E2E crítico funciona end-to-end** sin intervención manual
3. ✅ **Dashboard muestra datos en tiempo real** con <2 seg de latencia
4. ✅ **RLS audit pasando al 100%** (ningún tenant puede ver datos de otro)
5. ✅ **Worker procesa 100 collections** sin errores en <30 seg
6. ✅ **N8N workflows funcionando** con interpretación IA >80% accuracy en tests
7. ✅ **Documentación básica completa** (setup, deployment, user guide)
8. ✅ **Seed data permite demo** sin configuración manual

**Criterios de Prueba Piloto:**
- Onboarding de 1 cliente real (empresa con 50-100 facturas)
- Miguel puede usar el sistema sin capacitación extensa
- Al menos 3-5 facturas cobradas automáticamente en 30 días
- Carlos ve visibilidad en tiempo real del proceso
- Sistema estable: 95%+ uptime durante piloto
