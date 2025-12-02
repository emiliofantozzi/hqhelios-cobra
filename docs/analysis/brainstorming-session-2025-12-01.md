---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Plataforma SaaS de automatización de cobranzas con agente de IA'
session_goals: 'Definir modelo de datos, arquitectura de orquestación (determinística vs IA), roles del sistema, comunicación multicanal y decisiones arquitectónicas fundamentales'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Morphological Analysis', 'Solution Matrix']
ideas_generated: ['Separación Motor Reglas vs IA vs Gestor Contexto', 'Modelo Cobranza Individual (1:1)', 'Arquitectura Multi-Tenant con RLS', 'Integración Híbrida N8N', 'Generación Contenido Híbrida', 'Estado Bidimensional Facturas', 'Playbooks como Secuencias', 'Escalamiento Manual MVP', 'Timeline 8 semanas MVP']
context_file: 'C:\Users\emili\dev\cobra-bmad\.bmad\bmm\data\project-context-template.md'
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitador:** Emilio
**Fecha:** 2025-12-01

## Session Overview

**Topic:** Plataforma SaaS de automatización de cobranzas con agente de IA que gestiona todo el proceso operativo de seguimiento de facturas de forma sistemática, trazable y personalizada.

**Goals:**
1. Definir el modelo de datos óptimo (entidades, relaciones, arquitectura)
2. Resolver la arquitectura de orquestación: ¿Separar lógica determinística (workflows/playbooks) de capacidades de IA (generación/comprensión)?
3. Clarificar roles: ¿El orquestador decide "qué hacer y cuándo" mientras la IA solo asiste en "cómo redactar" y "qué interpretó"?
4. Diseñar el sistema de comunicación multicanal (WhatsApp, email) con seguimiento y cambio dinámico de playbooks
5. Establecer trazabilidad e historial claro por factura
6. Fundamentar decisiones arquitectónicas para desarrollo sobre bases sólidas

### Context Guidance

Esta sesión se enfoca en desarrollo de software y productos, explorando:
- **Problemas de usuarios:** Automatizar cobranzas de forma efectiva usando data existente
- **Características clave:** Comunicación multicanal, seguimiento, adaptación según respuestas
- **Enfoques técnicos:** Separación orquestación vs IA, modelo de datos, workflows
- **Experiencia de usuario:** Trazabilidad, personalización por cliente
- **Modelo de negocio:** Plataforma SaaS
- **Consideraciones técnicas:** Integración con WhatsApp, email, gestión de estados

### Session Setup

El proyecto busca construir una plataforma donde empresas deleguen a un agente de IA todo el proceso de cobranzas. El desafío principal es definir la arquitectura correcta que equilibre automatización determinística (playbooks/workflows) con capacidades de IA (generación de contenido, comprensión de respuestas). La decisión arquitectónica clave es determinar si el orquestador maneja la lógica de "qué y cuándo" mientras la IA solo asiste en "cómo" y extracción de información.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Plataforma SaaS de automatización de cobranzas con IA enfocada en definir modelo de datos y arquitectura de orquestación

**Recommended Techniques:**

1. **First Principles Thinking (Creative):** Descomponer el problema hasta verdades fundamentales para separar necesidades reales de asunciones sobre plataformas de cobranzas. Identificará qué debe decidir vs. qué debe generar el sistema.

2. **Morphological Analysis (Deep):** Explorar sistemáticamente todas las combinaciones posibles de parámetros arquitectónicos (orquestador vs IA, estados, canales, playbooks) para construir una matriz completa de opciones viables.

3. **Solution Matrix (Structured):** Mapear entidades (Empresa, Contacto, Factura, Playbook, Mensaje) contra soluciones arquitectónicas para identificar el modelo de datos óptimo con decisiones justificadas.

4. **Chaos Engineering (Wild):** Validar la arquitectura propuesta rompiéndola deliberadamente para descubrir debilidades y fortalecer el diseño antes de implementar.

**AI Rationale:** Esta secuencia fue seleccionada porque el proyecto requiere decisiones arquitectónicas fundamentales. El flujo progresivo va desde descomposición de principios → exploración sistemática → decisión de diseño → validación anti-frágil, ideal para establecer cimientos arquitectónicos sólidos antes del desarrollo.

---

## Technique Execution Results

### **Técnica 1: First Principles Thinking** 🏗️

**Enfoque Interactivo:** Descomponer el problema de cobranzas hasta sus verdades fundamentales, cuestionando todas las asunciones.

---

#### **VERDADES FUNDAMENTALES DESCUBIERTAS:**

**1. Naturaleza del Problema Actual:**
- ✅ El proceso de cobranzas HOY es fundamentalmente **manual, disperso y dependiente de memoria humana** (Excel, recordatorios personales, redacción manual)
- ✅ A mayor volumen (múltiples facturas, empresas grandes) → mayor carga operativa → más personas necesarias
- ✅ La cobranza efectiva requiere **comunicación proactiva y seguimiento persistente** multicanal (email, WhatsApp)
- ✅ Las facturas tienen **ciclos de vida y estados críticos** (pendiente, fecha comprometida, vencida) que requieren acciones diferentes

**2. Separación Arquitectónica Fundamental: DOS SISTEMAS COLABORANDO**

**SISTEMA 1: Motor de Reglas Determinístico ("Cerebro Lógico")**
- **Responsabilidades:**
  - Clasificación de estados (fecha vencimiento, campos incompletos)
  - Decisión de acción: "¿En qué casilla cae esta factura?"
  - Activación de playbooks: "¿Qué flujo ejecutar?"
  - Parámetros de temperatura comunicacional (primera interacción, segunda, sin respuesta)
- **Entrada:** Datos estructurados (fechas, estados, contadores)
- **Salida:** "Ejecutar Playbook X con temperatura Y"

**SISTEMA 2: Generador de Contexto + IA ("Ejecutor Inteligente")**
- **Responsabilidades:**
  - Generación de mensajes personalizados (email/WhatsApp)
  - Contextualización (nombre empresa, contacto, cantidad facturas, estado)
  - Ajuste de tono (amigable → firme → urgente)
  - Comprensión de respuestas del cliente
- **Entrada:** Instrucciones del Motor + Contexto compactado
- **Salida:** Mensaje listo para enviar / Interpretación de respuesta

**SISTEMA 3: Gestor de Memoria/Contexto ("Historiador Inteligente")**
- **Problema identificado:** Necesitas historial para contexto pero sin sobrecarga
- **Decisión MVP:** Mantener contexto simple, enfoque determinístico primero

---

#### **3. DECISIONES ARQUITECTÓNICAS FUNDAMENTALES DEL MVP:**

**DECISIÓN #1: Es un CRM de Facturas Primero, Automatización Después**

**Jerarquía de Entidades:**
```
EMPRESA (entidad raíz)
  ├─ Contactos (múltiples)
  │   ├─ Contacto Principal (cobranzas)
  │   └─ Contacto Escalamiento (opcional)
  └─ Facturas (múltiples)
```

**DECISIÓN #2: Filosofía de Simplicidad**
- ✅ Workflows determinísticos son el CORE
- ✅ Playbooks son estructuras predefinidas
- ✅ IA solo para: generación de contenido + detección de respuestas
- ❌ NO depender de IA para decisiones de negocio

**DECISIÓN #3: Modelo de Cobranza - OPCIÓN B SELECCIONADA**

**🎯 DECISIÓN CRÍTICA: 1 Cobranza = 1 Factura = 1 Flujo Individual**

**Opciones evaluadas:**
- **Opción A (Rechazada):** Cobranza agrupada (1 correo → N facturas) - Complejidad ALTA en interpretación NLP multi-estado
- **Opción B (SELECCIONADA):** Cobranza individual (1 correo → 1 factura) - Complejidad BAJA, flujo lineal simple
- **Opción C (Futura):** Híbrida con respuesta estructurada - Evolución post-MVP

**Razones de Selección Opción B:**
- ⚡ Velocidad de implementación: 2-3 semanas vs 6-8 semanas
- 🛡️ Menor riesgo: Flujos lineales, fácil de testear
- 📈 Escalabilidad futura: Se puede agregar agrupación después
- ✅ Validación rápida: Probar si clientes responden antes de complicar
- 🔧 Mitigación de spam: Secuenciación inteligente (prioridad + espaciado temporal)

**Modelo Final:**
```
COBRANZA (unidad de orquestación)
  ├─ 1 Empresa
  ├─ 1 Factura específica
  ├─ 1 Contacto principal
  └─ Historial de comunicación (email, WhatsApp)
```

**DECISIÓN #4: Trazabilidad Total de Comunicación**
- Registro de TODOS los mensajes (email, WhatsApp)
- Estado de entrega (enviado, entregado, rebotado)
- Respuestas del cliente
- Contador de interacciones sin respuesta
- **Propósito:** Alimentar decisiones determinísticas del workflow

---

#### **INSIGHTS CLAVE DEL PROCESO:**

**Tensión Arquitectónica Identificada:**
- **Eficiencia comunicacional** (menos correos) vs **Simplicidad de implementación** (flujos lineales)
- **Resolución:** Priorizar simplicidad para MVP, optimizar UX posteriormente

**Principio Guía del MVP:**
- **"Validar que clientes respondan y paguen"** > "UX perfecta de 1 correo"
- Validar modelo de negocio primero, optimizar experiencia después

**Fortaleza Creativa Demostrada:**
- Claridad para identificar complejidades técnicas reales
- Pragmatismo en decisiones de trade-offs
- Enfoque en simplicidad y velocidad de validación

---

**Estado de Técnica:** ✅ Completada - Fundamentos arquitectónicos establecidos

**Energía de Sesión:** Alta - Decisiones claras y bien fundamentadas

---

### **Técnica 2: Morphological Analysis** 🗺️

**Enfoque Interactivo:** Explorar sistemáticamente todas las combinaciones posibles de parámetros arquitectónicos para construir una matriz completa de opciones viables.

---

#### **PARÁMETROS ARQUITECTÓNICOS MAPEADOS:**

**PARÁMETRO #1: Estados de Factura (Bidimensional)**

**Dimensión 1: Estado de Pago (Business Logic)**
- Pendiente (sin acción del cliente)
- Fecha de pago confirmada (cliente comprometió fecha)
- Pagada (pago recibido)
- Escalada (requiere atención especial)
- Suspendida (pausada temporalmente)
- Cancelada (factura anulada)

**Dimensión 2: Estado Temporal (Time-based)**
- **Pre-vencimiento:** X días antes de fecha de vencimiento
- **Post-vencimiento (Vencida):** X días después de fecha de vencimiento

**INSIGHT CRÍTICO:** Estado de Factura ≠ Estado Temporal. Son dimensiones independientes que se combinan.

**Matriz de Estados Combinados:**
```
                    | Pre-Vencimiento      | Post-Vencimiento (Vencida)
--------------------|----------------------|---------------------------
Pendiente           | ✅ Normal            | 🚨 ALERTA (urgente)
Fecha confirmada    | ✅ OK                | ⚠️ Promesa rota
Pagada              | ✅ Excelente         | ✅ Pagó tarde
Escalada            | ⚠️ Preventiva        | 🔴 Crítica
Suspendida          | 🟡 En pausa          | 🟡 En pausa
Cancelada           | ⚪ Finalizada        | ⚪ Finalizada
```

**Regla de Workflow:** Playbooks evalúan AMBAS dimensiones para decidir qué acción tomar.

---

**PARÁMETRO #2: Triggers de Workflow (¿Qué activa una acción?)**

**Triggers Críticos para MVP:**

**Determinísticos (Tiempo):**
- X días antes de vencimiento (ej: recordatorio preventivo a -7 días)
- X días después de vencimiento (ej: cobranza urgente a +3 días)
- Fecha confirmada pasó sin pago (promesa rota)

**Basados en Eventos (Conversación):**
- Cliente NO respondió después de X mensajes → Activar recordatorio/escalamiento
- Cliente SÍ respondió → Activar flujo de interpretación IA + detener playbook actual
- Estado cambió manualmente (admin intervino)

**Post-MVP (Futuros):**
- Email abierto pero no respondido
- Segmentación por monto de factura / cliente VIP
- Rebotes de canal (email/WhatsApp)

---

**PARÁMETRO #3: Estructura de Playbooks**

**DECISIÓN CRÍTICA: Playbook = Secuencia Multi-Mensaje con Cadencia**

**Arquitectura de Playbook:**
```
Playbook "Cobranza Post-Vencimiento"
  ├─ Mensaje 1: Email amigable (día 0, temperatura: amigable)
  ├─ [ESPERAR 2 días O hasta respuesta del cliente]
  ├─ Mensaje 2: WhatsApp recordatorio (día +2 si NO responde, temp: neutral)
  ├─ [ESPERAR 2 días O hasta respuesta del cliente]
  └─ Mensaje 3: Email firme (día +4 si NO responde, temp: firme)
```

**Cada Mensaje en Playbook contiene:**
- Canal de comunicación (Email/WhatsApp)
- Template de contenido (con variables: nombre empresa, contacto, monto, etc.)
- Temperatura/tono (amigable → neutral → firme → urgente)
- Condición de activación (tiempo transcurrido O evento "no respuesta")

**El Playbook se DETIENE cuando:**
- Cliente responde (activa flujo de interpretación IA)
- Se completan todos los mensajes de la secuencia
- Admin interviene manualmente

**Para MVP:** Configuración de playbooks no será visual, pero arquitectura soporta secuencias complejas.

---

**PARÁMETRO #4: Canales de Comunicación e Integración**

**DECISIÓN ARQUITECTÓNICA: Híbrido con N8N (Opción B)**

**Arquitectura de Integración:**
```
Tu App (Backend + Frontend)
  ├─ Envío de mensajes (Email/WhatsApp)
  ├─ Base de datos (Empresas, Contactos, Facturas, Cobranzas)
  ├─ UI de gestión (Bandeja, Dashboard, Estados)
  └─ Webhook receiver (recibe notificaciones de N8N)
      ↓
N8N (Orquestador externo)
  ├─ Recibe respuestas (Email webhooks, WhatsApp API)
  ├─ Llama IA (interpreta respuesta del cliente)
  ├─ Parser de contenido
  └─ Envía a tu App (webhook con respuesta + sugerencia IA)
      ↓
Tu App
  └─ Muestra en bandeja con sugerencia para aprobación humana
```

**Reducción Operativa Real Lograda:**

**ANTES (manual):**
- Revisar Excel diariamente para ver qué facturas cobrar
- Redactar cada mensaje manualmente
- Recordar hacer follow-ups
- Buscar historial de comunicación en emails dispersos

**DESPUÉS (MVP con Opción B):**
- ✅ Sistema cobra automáticamente según reglas + cadencia
- ✅ Mensajes se generan y envían solos (IA genera contenido)
- ✅ Follow-ups automáticos respetando secuencia de playbook
- ✅ Historial centralizado por cobranza con bandeja
- ✅ Solo revisas cuando cliente responde (bandeja inteligente)
- ✅ IA sugiere qué hacer con cada respuesta (humano aprueba)

**Tiempo operativo ahorrado estimado: 70-80%**

**Ventajas de N8N para MVP:**
- ⚡ Implementación más rápida (N8N maneja integraciones complejas)
- 🔧 Fácil de ajustar workflows sin redeploys
- 💰 Menos código custom
- 🚀 Validación temprana del modelo de negocio

---

**PARÁMETRO #5: Estrategias de Escalamiento**

**DECISIÓN: Escalamiento Simple y Manual**

**Modelo de Escalamiento MVP:**
- ❌ NO automático en MVP (evita complejidad)
- ✅ Admin marca cobranza como "Escalada" manualmente desde UI
- ✅ Al marcar "Escalada", activa "Playbook de Escalamiento"
- ✅ Playbook Escalamiento envía email con CC múltiple:
  - TO: Contacto Principal
  - CC: Contacto de Escalamiento
  - Mensaje con tono formal/firme mencionando falta de respuesta previa

**Filosofía:** Mantener simplicidad, dar control al humano para decisiones críticas.

**Post-MVP:** Evaluar triggers automáticos (X intentos fallidos, Y días vencida, etc.)

---

**PARÁMETRO #6: Gestión de Contexto/Historial y KPIs**

**Bandeja/Historial por Cobranza:**

**Información Rastreada por Mensaje:**
- Fecha/hora de envío
- Canal (Email/WhatsApp)
- Estado de entrega (Enviado/Entregado/Rebotado)
- Contenido del mensaje enviado
- Temperatura/tono usado
- Playbook y mensaje # de secuencia

**Información Rastreada por Respuesta:**
- Fecha/hora de respuesta del cliente
- Canal de respuesta
- Contenido original (texto completo)
- Interpretación/sugerencia de IA
- Acción tomada por admin (aprobó sugerencia / editó manual)

**KPIs y Métricas del MVP (Enfoque Operativo):**

**Dashboard Principal - Nivel Facturas/Cobranzas:**
- Total facturas por estado (Pendientes/Vencidas/Pagadas/Escaladas/Suspendidas/Canceladas)
- Monto total por estado
- Facturas vencidas segmentadas por días (0-7, 8-15, 16-30, 30+)
- Cobranzas activas vs cerradas
- Cobranzas pendientes de revisión (con respuestas no procesadas)

**Dashboard - Nivel Clientes:**
- Clientes con facturas vencidas
- Clientes con múltiples facturas pendientes
- Historial de comportamiento de pago por cliente

**Métricas de Efectividad (Recolección pasiva para análisis futuro):**
- Tasa de respuesta por playbook (dato guardado, no necesariamente mostrado en MVP)
- Tiempo promedio hasta pago (desde creación de cobranza hasta pago)

**Filosofía MVP:** Dashboard operativo de gestión, no analytics avanzado. Foco en visibilidad de estado actual y carga de trabajo.

---

#### **MATRIZ DE COMBINACIONES ARQUITECTÓNICAS - EJEMPLO DE FLUJO:**

**Caso Real: Factura Vencida sin Respuesta**

```
Estado Inicial:
  Factura #12345
    ├─ Estado Pago: Pendiente
    ├─ Estado Temporal: +3 días vencida
    ├─ Monto: $5,000
    └─ Contacto: Juan Pérez (juan@empresa.com)

Trigger Activado:
  "Pendiente + Post-vencimiento (3 días)" → Activa Playbook "Cobranza Urgente"

Ejecución de Playbook:
  Día 0 (Hoy):
    - Sistema genera Mensaje 1 (Email, temperatura: neutral)
    - IA genera contenido personalizado: "Hola Juan, la factura #12345..."
    - Sistema envía automáticamente
    - Historial registra: Enviado 01/12 10:00 AM

  Día +2 (Si NO responde):
    - Sistema genera Mensaje 2 (WhatsApp, temperatura: firme)
    - IA ajusta tono: "Juan, aún no hemos recibido respuesta sobre..."
    - Sistema envía automáticamente
    - Historial registra: Enviado 03/12 10:00 AM

  Día +3 (Cliente RESPONDE):
    - Cliente: "Disculpa el retraso, les pago el viernes 08/12"
    - N8N captura respuesta
    - N8N llama IA: "Interpretar esta respuesta"
    - IA sugiere: "Marcar como 'Fecha confirmada: 08/12/2025'"
    - N8N envía webhook a tu app
    - Cobranza aparece en "Bandeja de Revisión"
    - Admin ve sugerencia IA, aprueba con 1 click
    - Playbook se DETIENE (no envía Mensaje 3)
    - Estado actualizado: "Fecha confirmada + Pre-vencimiento"

  Nueva regla activa:
    El 09/12 (si no pagó):
      - Trigger: "Fecha confirmada pasada sin pago (promesa rota)"
      - Activa: Playbook "Seguimiento Promesa Rota"
```

---

#### **INSIGHTS CLAVE DEL PROCESO:**

**Descubrimiento Arquitectónico Principal:**
- La **Cobranza es una máquina de estados conversacional** con historial propio
- No es "enviar mensaje y olvidar", es un **loop de conversación** con memoria

**Decisiones Pragmáticas para Velocidad:**
- Híbrido con N8N permite MVP rápido sin sacrificar valor
- Escalamiento manual reduce complejidad mientras validas modelo
- Supervisión humana en decisiones críticas (cambio de estado) mantiene control

**Fortaleza Creativa Demostrada:**
- Excelente balance entre automatización y control
- Pragmatismo en identificar qué es MVP vs futuro
- Claridad sobre dónde está el valor real (reducción operativa)

---

**Estado de Técnica:** ✅ Completada - Todos los parámetros arquitectónicos mapeados sistemáticamente

**Energía de Sesión:** Muy alta - Arquitectura completa emergiendo con claridad

---

### **Técnica 3: Solution Matrix** 📊

**Enfoque Interactivo:** Mapear entidades (Empresa, Contacto, Factura, Playbook, Mensaje, Cobranza) contra soluciones arquitectónicas para identificar el modelo de datos óptimo con relaciones claras y decisiones justificadas.

---

## **ARQUITECTURA MULTI-TENANT**

**DECISIÓN CRÍTICA:** Sistema SaaS con aislamiento completo de datos por tenant.

**Stack Tecnológico:**
- **Autenticación:** Clerk (gestión de usuarios y JWT)
- **Base de datos:** Supabase (PostgreSQL con Row Level Security)
- **Aislamiento:** RLS policies automáticas por tenant_id

---

## **MODELO DE DATOS COMPLETO**

### **ENTIDAD #0: TENANT (Organization)**

**Propósito:** Contenedor que aísla datos de cada cliente del SaaS.

```sql
Tenant {
  // Identificación
  id: UUID (PK)
  name: String (required, ej: "Constructora ABC S.A.")
  slug: String (required, unique, ej: "constructora-abc")
    → Para URLs: app.tuapp.com/constructora-abc

  // Configuración regional
  timezone: String (default: "America/Mexico_City")
  default_currency: String (default: "USD")

  // Plan SaaS y límites
  plan_type: Enum (default: "trial")
    → Values: "trial", "basic", "professional", "enterprise"
  max_companies: Integer (optional, límite de empresas)
  max_invoices_per_month: Integer (optional)

  // Estado
  is_active: Boolean (default: true)
  trial_ends_at: Timestamp (optional)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → tiene muchos Users
  → tiene muchas Companies
  → tiene muchas Invoices
  → tiene muchas Collections
  → tiene muchos Playbooks
}
```

**Estrategia de Onboarding (Opción A - Auto-registro):**
1. Usuario se registra en Clerk
2. Sistema crea Tenant automáticamente
3. Usuario se convierte en primer admin del tenant
4. Tenant inicia en plan "trial"

---

### **ENTIDAD #1: USER**

**Propósito:** Usuarios que acceden al sistema (admins que gestionan cobranzas).

```sql
User {
  // Identificación
  id: UUID (PK)
  tenant_id: UUID (FK → Tenant, required)
    → Usuario pertenece a UN solo tenant

  // Autenticación (Clerk)
  clerk_user_id: String (required, unique)
    → ID del usuario en Clerk para sincronización

  // Información personal
  email: String (required)
  first_name: String (required)
  last_name: String (required)
  avatar_url: String (optional)

  // Rol (MVP: solo admin)
  role: Enum (default: "admin")
    → Values: "admin"
    → Futuro: "viewer", "manager", "billing_only"

  // Preferencias
  language: String (default: "es")
  timezone: String (optional, hereda de tenant si null)

  // Estado
  is_active: Boolean (default: true)
  last_login_at: Timestamp (optional)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Tenant
  → procesó muchas CustomerResponses (processed_responses)
  → creó muchos Playbooks (created_playbooks)
}
```

**Integración Clerk + Supabase:**
- Clerk genera JWT con custom claim `tenant_id`
- Supabase RLS policies usan `tenant_id` para filtrar automáticamente
- Imposible acceder datos de otro tenant (seguridad a nivel DB)

---

### **ENTIDAD #2: COMPANY (Empresa)**

**Propósito:** Entidad raíz del CRM - clientes a los que se cobra.

```sql
Company {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  name: String (required, ej: "Acme Corp")
  tax_id: String (required, RUC/NIT/RFC - identificador fiscal)

  // Contacto general
  email: String (optional, email general de empresa)
  phone: String (optional)
  address: Text (optional)

  // Clasificación y términos
  industry: String (optional, ej: "Tecnología", "Retail", "Manufactura")
  payment_terms_days: Integer (required, default: 30)
    → Options: 15, 30, 45, 60, 90, 120 días
  risk_level: Enum (optional, default: "medio")
    → Values: "bajo", "medio", "alto"

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
  is_active: Boolean (default: true)

  // Relaciones
  → pertenece a Tenant
  → tiene muchos Contacts
  → tiene muchas Invoices
  → tiene muchas Collections
}
```

**Reglas de Negocio:**
- Cada empresa debe tener al menos 1 contacto primary
- `payment_terms_days` se usa como default al crear facturas

---

### **ENTIDAD #3: CONTACT (Contacto)**

**Propósito:** Personas de contacto dentro de empresas cliente.

```sql
Contact {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  company_id: UUID (FK → Company, required)

  // Información personal
  first_name: String (required)
  last_name: String (required)
  email: String (required, para envío de mensajes)
  phone: String (optional, para WhatsApp)
  position: String (optional, ej: "CFO", "Gerente de Finanzas")

  // Roles en cobranzas (nivel empresa)
  is_primary_contact: Boolean (default: false)
    → Solo 1 contacto por empresa puede ser primary
  is_escalation_contact: Boolean (default: false)
    → Solo 1 contacto por empresa puede ser escalation (0-1)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
  is_active: Boolean (default: true)

  // Relaciones
  → pertenece a Tenant
  → pertenece a Company
  → aparece en muchos SentMessages (como destinatario)
}
```

**Reglas de Negocio:**
- Validación: Exactamente 1 contacto con `is_primary_contact = true` por empresa
- Validación: Máximo 1 contacto con `is_escalation_contact = true` por empresa

---

### **ENTIDAD #4: INVOICE (Factura)**

**Propósito:** Facturas a cobrar con estado bidimensional (Pago + Temporal).

```sql
Invoice {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  invoice_number: String (required, unique per tenant, ej: "FAC-2024-001")
  company_id: UUID (FK → Company, required)

  // Montos
  amount: Decimal (required, monto total)
  currency: String (required, ej: "USD", "MXN", "COP", "PEN", "EUR")

  // Fechas críticas
  issue_date: Date (required, fecha de emisión)
  due_date: Date (required, fecha de vencimiento)
  confirmed_payment_date: Date (optional, fecha que cliente comprometió)
  paid_date: Date (optional, fecha real de pago)

  // Estado de Pago (Dimensión 1 - Business Logic)
  payment_status: Enum (required, default: "pendiente")
    → Values:
      - "pendiente" (sin acción del cliente)
      - "fecha_confirmada" (cliente comprometió fecha)
      - "pagada" (pago recibido)
      - "escalada" (requiere atención especial)
      - "suspendida" (pausada temporalmente)
      - "cancelada" (factura anulada)

  // Información de pago
  payment_reference: String (optional, número de transferencia/comprobante)
    → Required when payment_status = "pagada"

  // Notas y contexto
  description: Text (optional, concepto de factura)
  notes: Text (optional, notas internas)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Tenant
  → pertenece a Company
  → tiene 0 o 1 Collection activa
}
```

**Campos Calculados Dinámicamente (NO en DB):**
```javascript
// Estado Temporal (Dimensión 2 - Time-based)
temporal_status = (TODAY > due_date) ? "vencida" : "pre_vencimiento"
days_overdue = (TODAY > due_date) ? (TODAY - due_date) : 0
days_until_due = (TODAY <= due_date) ? (due_date - TODAY) : 0
```

**Matriz de Estados Combinados:**
```
                    | Pre-Vencimiento      | Post-Vencimiento (Vencida)
--------------------|----------------------|---------------------------
Pendiente           | ✅ Normal            | 🚨 ALERTA (urgente)
Fecha confirmada    | ✅ OK                | ⚠️ Promesa rota
Pagada              | ✅ Excelente         | ✅ Pagó tarde
Escalada            | ⚠️ Preventiva        | 🔴 Crítica
Suspendida          | 🟡 En pausa          | 🟡 En pausa
Cancelada           | ⚪ Finalizada        | ⚪ Finalizada
```

**Reglas de Negocio:**
- `invoice_number` debe ser único dentro del tenant
- Cuando `payment_status` cambia a "pagada", `paid_date` debe establecerse
- Post-MVP: Soporte para attachments (PDF de factura)

---

### **ENTIDAD #5: COLLECTION (Cobranza)**

**Propósito:** Unidad de orquestación - instancia activa de workflow de cobranza.

**DECISIÓN ARQUITECTÓNICA:** 1 Collection = 1 Invoice = 1 Flujo Individual

```sql
Collection {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  invoice_id: UUID (FK → Invoice, required, unique)
    → Una factura solo puede tener 1 cobranza activa a la vez
  company_id: UUID (FK → Company, required)
  primary_contact_id: UUID (FK → Contact, required)
    → Contacto al que se está enviando mensajes

  // Playbook activo
  playbook_id: UUID (FK → Playbook, required)
    → Qué playbook se está ejecutando
  current_message_index: Integer (default: 0)
    → En qué mensaje de la secuencia va (0-indexed)

  // Estado de la cobranza
  status: Enum (required, default: "active")
    → Values:
      - "active" (playbook ejecutándose)
      - "paused" (detenido temporalmente)
      - "awaiting_response" (esperando respuesta del cliente)
      - "pending_review" (tiene respuesta sin procesar)
      - "completed" (cerrada exitosamente)
      - "escalated" (marcada para escalamiento)

  // Tracking de comunicación
  messages_sent_count: Integer (default: 0)
  last_message_sent_at: Timestamp (optional)
  customer_responded: Boolean (default: false)
  last_response_at: Timestamp (optional)

  // Fechas importantes
  started_at: Timestamp (required, cuándo se creó/activó)
  next_action_at: Timestamp (optional, cuándo enviar próximo mensaje)
  completed_at: Timestamp (optional, cuándo se cerró)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Tenant
  → pertenece a Invoice
  → pertenece a Company
  → tiene Contact primary
  → usa Playbook
  → tiene muchos SentMessages
  → tiene muchos CustomerResponses
}
```

**Reglas de Negocio:**
- Una Invoice solo puede tener 1 Collection activa (status != "completed")
- Cuando Invoice.payment_status cambia a "pagada" → Collection.status = "completed" automáticamente
- Admin puede completar Collection manualmente sin marcar Invoice como pagada

**Ciclo de Vida de Collection:**
```
Crear Collection → active
  ↓
Enviar mensajes según playbook → active
  ↓
Cliente responde → awaiting_response → pending_review
  ↓
Admin procesa respuesta → active (continúa) | completed (cierra)
  ↓
Playbook termina O Invoice pagada → completed
```

---

### **ENTIDAD #6: PLAYBOOK**

**Propósito:** Templates de workflows - secuencias de mensajes configurables.

```sql
Playbook {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  name: String (required, ej: "Cobranza Post-Vencimiento")
  description: Text (optional, explicación del playbook)

  // Configuración de activación
  trigger_type: Enum (required)
    → Values:
      - "manual" (admin activa manualmente)
      - "days_before_due" (X días antes de vencimiento)
      - "days_after_due" (X días después de vencimiento)
      - "payment_date_missed" (fecha confirmada pasó sin pago)

  trigger_days: Integer (optional)
    → Usado para "days_before_due" y "days_after_due"
    → Ej: trigger_type = "days_after_due", trigger_days = 3

  // Estado
  is_active: Boolean (default: true)
  is_default: Boolean (default: false)
    → Marca si es el playbook por defecto para cierto trigger

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
  created_by_user_id: UUID (FK → User, optional)

  // Relaciones
  → pertenece a Tenant
  → tiene muchos PlaybookMessages (ordenados por sequence_order)
  → usado en muchas Collections
}
```

**Reglas de Negocio:**
- Cada tenant crea sus propios playbooks (aislados por tenant)
- Solo 1 playbook puede ser `is_default = true` por `trigger_type` por tenant
- Futuro: Templates globales que tenants pueden clonar

---

### **ENTIDAD #7: PLAYBOOK_MESSAGE**

**Propósito:** Mensajes individuales dentro de la secuencia del playbook.

```sql
PlaybookMessage {
  // Multi-tenancy (heredado de Playbook)

  // Identificación
  id: UUID (PK)
  playbook_id: UUID (FK → Playbook, required)
  sequence_order: Integer (required, 0-indexed)
    → Define el orden: 0 = primer mensaje, 1 = segundo, etc.

  // Configuración del mensaje
  channel: Enum (required)
    → Values: "email", "whatsapp"

  temperature: Enum (required)
    → Values: "amigable", "neutral", "firme", "urgente"

  // Template del mensaje (OPCIÓN HÍBRIDA)
  subject_template: String (optional, solo para email)
    → Ej: "Recordatorio: Factura {{invoice_number}} pendiente"

  body_template: Text (required)
    → Texto base con variables: {{company_name}}, {{contact_name}},
      {{invoice_number}}, {{amount}}, {{due_date}}, {{currency}}, etc.

  // Generación con IA (Opción Híbrida)
  use_ai_generation: Boolean (default: false)
    → Si false: reemplazo simple de variables (rápido, gratis)
    → Si true: IA reescribe usando template como guía (natural, costo)

  ai_instructions: Text (optional)
    → Instrucciones para IA si use_ai_generation = true
    → Ej: "Reescribir con tono más conversacional manteniendo info clave"

  // Condición de envío
  wait_days: Integer (required, default: 0)
    → Días a esperar desde el mensaje anterior (0 = inmediato)

  send_only_if_no_response: Boolean (default: true)
    → Si true, solo enviar si cliente NO ha respondido

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Playbook
  → originó muchos SentMessages
}
```

**Estrategia de Generación (Híbrida):**

**Para MVP - Opción Simple (use_ai_generation = false):**
```
Template: "Hola {{contact_name}}, la factura {{invoice_number}}
por {{amount}} {{currency}} vence el {{due_date}}."

→ Reemplazo directo:
"Hola Juan Pérez, la factura FAC-001 por 5000 USD vence el 15/12/2025."
```

**Evolución - Con IA (use_ai_generation = true):**
```
Template: "Hola {{contact_name}}, la factura {{invoice_number}}
por {{amount}} {{currency}} vence el {{due_date}}."

AI Instructions: "Hacer más conversacional y empático"

→ IA genera:
"Hola Juan, espero estés muy bien. Te contacto para darte seguimiento
a la factura FAC-001 por $5,000 USD que vence este viernes 15/12.
¿Me podrías confirmar si ya tienen programado el pago?
Quedo atento a tus comentarios."
```

**Ventaja:** Control de costos - activas IA solo en playbooks críticos.

---

### **ENTIDAD #8: SENT_MESSAGE (Mensaje Enviado)**

**Propósito:** Historial real de mensajes enviados a clientes.

```sql
SentMessage {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  collection_id: UUID (FK → Collection, required)
  playbook_message_id: UUID (FK → PlaybookMessage, optional)
    → Referencia al template original (null si fue manual)

  // Destinatario
  contact_id: UUID (FK → Contact, required)
  channel: Enum (required)
    → Values: "email", "whatsapp"

  // Contenido enviado (FINAL generado)
  subject: String (optional, solo email)
  body: Text (required)
    → Contenido FINAL que se envió (variables reemplazadas / IA generado)

  // Estado de entrega
  delivery_status: Enum (required, default: "pending")
    → Values:
      - "pending" (en cola para envío)
      - "sent" (enviado exitosamente)
      - "delivered" (confirmado entregado)
      - "bounced" (rebotó)
      - "failed" (error al enviar)

  // Tracking
  sent_at: Timestamp (optional)
  delivered_at: Timestamp (optional)

  // Metadata de generación
  was_ai_generated: Boolean (default: false)
    → Indica si usó IA para generar contenido
  temperature_used: String (optional, ej: "amigable")

  // IDs externos (para integración)
  external_message_id: String (optional)
    → ID de SendGrid, Twilio, WhatsApp API, etc.

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Tenant
  → pertenece a Collection
  → pertenece a Contact
  → originó de PlaybookMessage
  → puede tener 0 o 1 CustomerResponse
}
```

**Tracking de Entrega:**
- `pending` → `sent` (enviado a proveedor)
- `sent` → `delivered` (webhook de confirmación)
- `sent` → `bounced` (rebote de email/WhatsApp)

---

### **ENTIDAD #9: CUSTOMER_RESPONSE (Respuesta Cliente)**

**Propósito:** Respuestas de clientes capturadas por N8N con interpretación de IA.

```sql
CustomerResponse {
  // Multi-tenancy
  tenant_id: UUID (FK → Tenant, required)

  // Identificación
  id: UUID (PK)
  collection_id: UUID (FK → Collection, required)
  sent_message_id: UUID (FK → SentMessage, optional)
    → Mensaje al que está respondiendo (si es identificable)

  // Contenido de respuesta
  channel: Enum (required)
    → Values: "email", "whatsapp"

  raw_content: Text (required)
    → Texto original completo de la respuesta del cliente

  // Interpretación de IA (JSON estructurado)
  ai_interpretation: JSON (optional)
    → Estructura:
    {
      "intent": "confirmar_pago | solicitar_extension | ya_pago | disputa | otro",
      "suggested_action": "marcar_fecha_confirmada | marcar_pagada | escalar | revisar_manual",
      "extracted_data": {
        "payment_date": "2025-12-15",
        "amount_mentioned": 5000,
        "notes": "Cliente mencionó problemas de flujo de caja"
      },
      "confidence": 0.85
    }

  // Acción tomada por admin
  admin_action_taken: String (optional)
    → Ej: "approved_ai_suggestion", "manual_override", "escalated"

  admin_notes: Text (optional)
    → Notas del admin al procesar

  processed_by_user_id: UUID (FK → User, optional)
  processed_at: Timestamp (optional)

  // Estado
  status: Enum (required, default: "pending_review")
    → Values:
      - "pending_review" (esperando revisión humana)
      - "processed" (admin ya actuó)
      - "auto_processed" (procesada automáticamente - futuro)

  // Tracking
  received_at: Timestamp (required)

  // IDs externos
  external_message_id: String (optional)
    → ID del mensaje entrante (webhook)

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp

  // Relaciones
  → pertenece a Tenant
  → pertenece a Collection
  → responde a SentMessage
  → procesada por User
}
```

**Flow de Procesamiento (Arquitectura N8N):**
```
1. Cliente responde email/WhatsApp
2. N8N recibe respuesta vía webhook
3. N8N llama IA: "Interpretar esta respuesta"
4. IA genera ai_interpretation con intent + suggested_action
5. N8N envía webhook a tu app con respuesta + interpretación
6. App crea CustomerResponse (status: "pending_review")
7. Collection.status → "pending_review"
8. Admin ve en bandeja con sugerencia IA
9. Admin aprueba/modifica/rechaza
10. App actualiza CustomerResponse (status: "processed")
11. App ejecuta acción (actualizar Invoice, continuar/detener Collection)
```

---

## **DIAGRAMA DE RELACIONES (ERD Conceptual)**

```
TENANT
  ├─ Users (1:N)
  ├─ Companies (1:N)
  │   ├─ Contacts (1:N)
  │   │   └─ SentMessages (1:N)
  │   ├─ Invoices (1:N)
  │   │   └─ Collection (1:1 activa)
  │   │       ├─ SentMessages (1:N)
  │   │       ├─ CustomerResponses (1:N)
  │   │       └─ Playbook (N:1)
  │   │           └─ PlaybookMessages (1:N)
  │   └─ Collections (1:N)
  └─ Playbooks (1:N)
      └─ PlaybookMessages (1:N)
```

---

## **ÍNDICES Y CONSTRAINTS CRÍTICOS**

**Para Performance y Seguridad:**

```sql
-- Multi-tenancy: índices en todas las queries por tenant
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_collections_tenant ON collections(tenant_id);
-- ... en TODAS las tablas

-- Queries frecuentes
CREATE INDEX idx_invoices_company ON invoices(company_id, payment_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date, payment_status);
CREATE INDEX idx_collections_status ON collections(status, next_action_at);
CREATE INDEX idx_responses_pending ON customer_responses(tenant_id, status)
  WHERE status = 'pending_review';

-- Unicidad crítica
CREATE UNIQUE INDEX idx_invoice_number_tenant
  ON invoices(tenant_id, invoice_number);
CREATE UNIQUE INDEX idx_collection_invoice
  ON collections(invoice_id) WHERE status != 'completed';
CREATE UNIQUE INDEX idx_tenant_slug ON tenants(slug);
```

---

## **ROW LEVEL SECURITY (RLS) - Supabase**

**Políticas Ejemplo para Aislamiento Multi-Tenant:**

```sql
-- Companies: Users solo ven su tenant
CREATE POLICY "tenant_isolation_companies_select"
ON companies FOR SELECT
USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "tenant_isolation_companies_insert"
ON companies FOR INSERT
WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

-- Similar para TODAS las tablas con tenant_id
-- RLS garantiza aislamiento incluso si hay bug en código
```

**Configuración de tenant_id en sesión (desde JWT Clerk):**
```sql
-- Al iniciar sesión, se establece el tenant del usuario
SET app.current_tenant_id = '<tenant_id_from_jwt>';
```

---

## **VARIABLES DE TEMPLATE DISPONIBLES**

**Para PlaybookMessage.body_template:**

```
{{tenant_name}}          - Nombre del tenant
{{company_name}}         - Nombre de la empresa cliente
{{company_tax_id}}       - RUC/NIT de la empresa
{{contact_first_name}}   - Nombre del contacto
{{contact_last_name}}    - Apellido del contacto
{{contact_name}}         - Nombre completo
{{invoice_number}}       - Número de factura
{{invoice_amount}}       - Monto
{{currency}}             - Moneda
{{issue_date}}           - Fecha de emisión
{{due_date}}             - Fecha de vencimiento
{{days_until_due}}       - Días hasta vencer (si no vencida)
{{days_overdue}}         - Días vencida (si vencida)
{{payment_terms_days}}   - Términos de pago de la empresa
```

---

## **RESUMEN DE DECISIONES ARQUITECTÓNICAS**

**1. Multi-Tenancy:**
- ✅ Aislamiento completo por tenant_id en todas las entidades
- ✅ RLS en Supabase para seguridad a nivel DB
- ✅ Clerk para autenticación con custom claims
- ✅ Auto-registro: nuevo usuario → nuevo tenant automático

**2. Modelo de Cobranza:**
- ✅ 1 Collection = 1 Invoice (simplicidad para MVP)
- ✅ Playbooks como secuencias multi-mensaje con cadencia
- ✅ Estado bidimensional en Invoice (Pago + Temporal calculado)

**3. Integración N8N:**
- ✅ App envía mensajes
- ✅ N8N recibe respuestas + llama IA + envía webhook a app
- ✅ Supervisión humana: IA sugiere, admin aprueba

**4. Generación de Contenido (Híbrida):**
- ✅ MVP: Templates con variables (rápido, sin costo)
- ✅ Evolución: IA reescribe para naturalidad (activable por playbook)
- ✅ Control de costos: decides qué playbooks usan IA

**5. Stack Tecnológico:**
- ✅ Backend: Supabase (PostgreSQL + RLS + Realtime)
- ✅ Auth: Clerk (JWT con tenant_id)
- ✅ Orquestación externa: N8N (webhooks + IA)
- ✅ Canales: Email (SendGrid/Postmark) + WhatsApp Business API

---

**Estado de Técnica:** ✅ Completada - Modelo de datos completo definido con arquitectura multi-tenant

**Energía de Sesión:** Altísima - Sistema completo arquitectónicamente definido y listo para implementación

---

## Resumen Ejecutivo de la Sesión

### **Logros de la Sesión de Brainstorming** 🎉

**Duración:** ~90 minutos
**Técnicas Completadas:** 3 de 4 (First Principles, Morphological Analysis, Solution Matrix)
**Resultado:** Arquitectura completa y modelo de datos detallado para MVP

---

### **DECISIONES ARQUITECTÓNICAS CLAVE**

#### **1. Separación de Responsabilidades (First Principles)**

**Sistema dividido en 3 componentes:**

1. **Motor de Reglas Determinístico**
   - Decide QUÉ hacer y CUÁNDO (lógica de negocio)
   - Evalúa estado de factura + tiempo relativo a vencimiento
   - Activa playbooks según triggers configurados

2. **Generador de Contexto + IA**
   - Decide CÓMO redactar (generación de contenido)
   - Interpreta QUÉ dijo el cliente (comprensión de respuestas)
   - Asiste, no decide (supervisión humana)

3. **Gestor de Memoria/Contexto**
   - Mantiene historial por cobranza
   - Provee contexto compacto sin sobrecarga

**Filosofía:** Simplicidad determinística > Complejidad inteligente

---

#### **2. Modelo de Cobranza Individual (Opción B)**

**DECISIÓN CRÍTICA:** 1 Cobranza = 1 Factura = 1 Flujo Individual

**Razones:**
- ⚡ Implementación 60% más rápida (2-3 semanas vs 6-8)
- 🛡️ Menor riesgo técnico (flujos lineales, fácil debuggear)
- ✅ Validación rápida de modelo de negocio
- 📈 Evolución futura posible (agrupar después)

**Alternativa rechazada:** Cobranza agrupada (1 correo → N facturas) por complejidad de interpretación NLP multi-estado

---

#### **3. Arquitectura Multi-Tenant con Supabase + Clerk**

**Stack Tecnológico:**
- **DB:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Clerk (JWT con tenant_id custom claim)
- **Orquestación:** N8N (webhooks + integraciones + IA)
- **Canales:** SendGrid/Postmark (Email) + WhatsApp Business API

**Aislamiento de Datos:**
- RLS policies automáticas por tenant_id
- Imposible acceder datos de otro tenant (seguridad a nivel DB)
- Auto-registro: nuevo usuario → nuevo tenant

---

#### **4. Integración Híbrida con N8N**

**Arquitectura de Responsabilidades:**

```
Tu App → Envía mensajes + UI gestión + Base de datos
  ↓
N8N → Recibe respuestas + Llama IA + Envía webhook
  ↓
Tu App → Bandeja con sugerencia IA + Aprobación humana
```

**Reducción Operativa:** 70-80% de tiempo ahorrado vs proceso manual

---

#### **5. Generación de Contenido Híbrida**

**Para MVP:**
- Templates con variables (rápido, sin costo)
- Campo `use_ai_generation: Boolean` por mensaje

**Evolución:**
- Activar IA en playbooks específicos cuando sea necesario
- Control de costos: decides qué usar IA

---

### **MODELO DE DATOS COMPLETO**

**10 Entidades Definidas:**

1. **Tenant** - Aislamiento multi-tenant
2. **User** - Admins del sistema (integración Clerk)
3. **Company** - Clientes a cobrar (CRM)
4. **Contact** - Personas de contacto (primary/escalation)
5. **Invoice** - Facturas con estado bidimensional
6. **Collection** - Unidad de orquestación de workflow
7. **Playbook** - Templates de secuencias
8. **PlaybookMessage** - Mensajes individuales en secuencia
9. **SentMessage** - Historial de envíos
10. **CustomerResponse** - Respuestas con interpretación IA

**Estado Bidimensional de Facturas:**
- **Dimensión 1 (Pago):** pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada
- **Dimensión 2 (Temporal):** pre_vencimiento / vencida (calculado dinámicamente)

**Playbooks como Secuencias:**
- Múltiples mensajes con cadencia temporal
- Condiciones: tiempo transcurrido O evento "no respuesta"
- Se detienen cuando cliente responde

---

### **DECISIONES DE SIMPLIFICACIÓN PARA MVP**

1. ✅ **Escalamiento manual** (no automático)
2. ✅ **Un tipo de usuario** (admin) por tenant
3. ✅ **Templates directos primero** (IA opcional después)
4. ✅ **Supervisión humana** en cambios de estado críticos
5. ✅ **KPIs operativos** (no analytics avanzado)
6. ✅ **Sin attachments** de facturas (post-MVP)

---

### **PRÓXIMOS PASOS RECOMENDADOS**

#### **Fase 1: Setup Técnico (Semana 1)**
1. Configurar Supabase project + RLS policies
2. Configurar Clerk con custom claims (tenant_id)
3. Setup N8N instance
4. Crear schemas de base de datos (10 tablas)

#### **Fase 2: Core CRM (Semanas 2-3)**
1. CRUD de Tenants, Users, Companies, Contacts
2. CRUD de Invoices con estados
3. Dashboard básico (listado facturas por estado)

#### **Fase 3: Motor de Cobranzas (Semanas 4-5)**
1. CRUD de Playbooks + PlaybookMessages
2. Sistema de Collections (crear, ejecutar, pausar)
3. Envío de mensajes (Email + WhatsApp)
4. Tracking de SentMessages

#### **Fase 4: Loop de Respuestas (Semanas 6-7)**
1. N8N workflows para captura de respuestas
2. Integración IA para interpretación
3. Bandeja de revisión con sugerencias
4. Procesamiento de respuestas (aprobar/modificar)

#### **Fase 5: Refinamiento MVP (Semana 8)**
1. KPIs y dashboard operativo
2. Escalamiento manual
3. Testing end-to-end
4. Ajustes de UX

**Timeline Total MVP:** 8 semanas

---

### **RIESGOS IDENTIFICADOS Y MITIGACIONES**

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Complejidad integraciones WhatsApp | Alto | Empezar solo con Email, agregar WhatsApp después |
| Costos de IA si se usa mucho | Medio | Sistema híbrido: templates por default, IA opcional |
| RLS mal configurado | Crítico | Testing exhaustivo de aislamiento entre tenants |
| N8N single point of failure | Alto | Monitoring + fallback manual + documentación clara |
| Interpretación IA imprecisa | Medio | Supervisión humana obligatoria, no auto-procesamiento |

---

### **MÉTRICAS DE ÉXITO DEL MVP**

**Técnicas:**
- ✅ 100% aislamiento entre tenants (security audit)
- ✅ 95%+ disponibilidad del sistema
- ✅ < 2 seg tiempo de respuesta en dashboard
- ✅ 0 data leaks entre tenants

**Negocio:**
- 🎯 70-80% reducción de tiempo operativo vs manual
- 🎯 80%+ tasa de entrega de mensajes
- 🎯 50%+ tasa de respuesta de clientes
- 🎯 90%+ precisión de sugerencias IA (aceptadas por admin)

---

### **VALOR GENERADO EN ESTA SESIÓN**

✅ **Claridad Arquitectónica Total:** Sistema completo definido antes de escribir código
✅ **Decisiones Fundamentadas:** Cada elección basada en primeros principios
✅ **Documentación Implementable:** Modelo de datos listo para desarrollo
✅ **Riesgos Identificados:** Conocimiento de trade-offs y complejidades
✅ **Timeline Realista:** 8 semanas para MVP funcional

**Ahorro estimado:** 2-3 semanas de refactoring al tener arquitectura clara desde inicio

---

### **FORTALEZAS DEMOSTRADAS EN LA SESIÓN**

**Del Proyecto:**
- Balance perfecto entre automatización y control humano
- Pragmatismo en decisiones de MVP vs futuro
- Enfoque en reducción operativa real, no "Excel digital"

**Del Proceso:**
- Exploración exhaustiva antes de decidir
- Identificación temprana de tensiones arquitectónicas
- Claridad sobre qué es complejo vs qué es simple

---

## **DOCUMENTO LISTO PARA:**
- ✅ Compartir con equipo técnico
- ✅ Crear PRD detallado
- ✅ Iniciar diseño de arquitectura técnica
- ✅ Estimar esfuerzo de desarrollo
- ✅ Comenzar implementación

---

**Fecha de Sesión:** 2025-12-01
**Facilitador:** Mary (Business Analyst Agent)
**Participante:** Emilio
**Duración:** ~90 minutos
**Resultado:** ⭐⭐⭐⭐⭐ Éxito Total - Arquitectura completa definida
