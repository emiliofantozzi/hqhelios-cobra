# System-Level Test Design - cobra-bmad

**Date:** 2025-12-03
**Author:** Murat (TEA Agent)
**Scope:** Epic 3 (Motor de Cobranzas) + Integración con Epic 1-2
**Status:** Draft

---

## Executive Summary

**Testability Assessment:** PASS with CONCERNS

El sistema cobra-bmad presenta buena arquitectura para testing, con RLS multi-tenant que facilita aislamiento y API routes bien definidas. Sin embargo, existen **4 concerns de testabilidad** que requieren mitigación antes de implementar Epic 3.

**Risk Summary:**
- Total riesgos identificados: 8
- High-priority risks (≥6): 3
- Categorías principales: TECH, OPS, PERF

---

## Testability Assessment

### Controllability: ⚠️ CONCERNS

**Fortalezas:**
- ✅ API routes RESTful permiten setup de datos via API
- ✅ Prisma seed para datos de desarrollo/test
- ✅ Supabase Client permite queries directas para assertions
- ✅ Zod schemas validan inputs (testing de edge cases)

**Concerns:**

| ID | Concern | Impacto | Mitigación |
|----|---------|---------|------------|
| C-001 | **N8N no mockeable** - Worker depende de N8N para captura de respuestas | No se puede testear flujo completo offline | Crear interface `IMessageService` con mock implementation |
| C-002 | **SendGrid/Twilio sin sandbox en tests** - Envío real de mensajes | Tests pueden enviar emails reales | Usar environment flags para mock en test env |
| C-003 | **Worker race conditions** - Vercel Cron puede ejecutar worker múltiples veces | Tests pueden tener resultados inconsistentes | Implementar lock/semáforo en worker usando Redis |

### Observability: ✅ PASS

**Fortalezas:**
- ✅ Logger estructurado con timestamps (definido en architecture.md)
- ✅ InvoiceStatusHistory APPEND-ONLY para audit trail completo
- ✅ SentMessages trackea delivery_status de cada mensaje
- ✅ Supabase Realtime para validar actualizaciones en tiempo real
- ✅ CustomerResponse guarda raw_content + ai_interpretation

**Recommendation:**
- Agregar métricas de performance en worker (tiempo de procesamiento por collection)

### Reliability: ⚠️ CONCERNS

**Fortalezas:**
- ✅ RLS garantiza aislamiento entre tenants (tests paralelos seguros)
- ✅ Cascade delete limpia datos correctamente
- ✅ Transacciones en Supabase para operaciones críticas

**Concerns:**

| ID | Concern | Impacto | Mitigación |
|----|---------|---------|------------|
| C-004 | **UNIQUE INDEX condicional** - `WHERE status NOT IN ('completed', 'escalated')` puede no funcionar correctamente en todos los escenarios | Tests de constraint pueden fallar inconsistentemente | Validar en PostgreSQL específico, agregar check explícito en API |

---

## Architecturally Significant Requirements (ASRs)

### ASR-1: Multi-Tenancy Isolation (SEC)

**Requirement:** Tenant A no puede acceder datos de Tenant B

| Probability | Impact | Score | Level |
|------------|--------|-------|-------|
| 2 | 3 | **6** | HIGH |

**Test Approach:**
- E2E: Login como Tenant A, intentar acceder recursos de Tenant B
- Integration: Verificar RLS policies con queries directas
- **OBLIGATORIO:** Script de validación que verifica RLS en TODAS las tablas

### ASR-2: Worker Performance (PERF)

**Requirement:** Procesar 100 collections en <30 segundos

| Probability | Impact | Score | Level |
|------------|--------|-------|-------|
| 2 | 2 | **4** | MEDIUM |

**Test Approach:**
- Performance test: Seed 100 collections, ejecutar worker, medir tiempo
- Benchmark: Establecer baseline, alertar si >30s

### ASR-3: Rate Limiting Enforcement (BUS)

**Requirement:** Máximo 5 cobranzas activas por empresa, 4h entre mensajes

| Probability | Impact | Score | Level |
|------------|--------|-------|-------|
| 3 | 2 | **6** | HIGH |

**Test Approach:**
- Unit: Test de lógica de rate limiting
- Integration: Crear 6 collections para misma empresa, verificar error
- E2E: Verificar que UI muestra error apropiado

### ASR-4: N8N Availability (OPS)

**Requirement:** Sistema funciona con degradación cuando N8N está down

| Probability | Impact | Score | Level |
|------------|--------|-------|-------|
| 2 | 3 | **6** | HIGH |

**Test Approach:**
- Integration: Mock N8N como down, verificar que worker pausa collections con error apropiado
- E2E: Verificar que admin recibe notificación de N8N down

---

## Risk Assessment Matrix

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-001 | TECH | Race condition en Worker (ejecución paralela) | 3 | 3 | **9** | Implementar lock con Redis + transacción | Dev |
| R-002 | SEC | RLS mal configurado permite data leak | 2 | 3 | **6** | Script validación automático pre-deploy | Dev |
| R-003 | OPS | N8N single point of failure | 2 | 3 | **6** | Documentar fallback manual + alertas | Ops |

### Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation |
|---------|----------|-------------|------|--------|-------|------------|
| R-004 | PERF | Worker timeout en Vercel (>5min) | 2 | 2 | **4** | Batch processing + early exit |
| R-005 | DATA | Template variables no resuelven si contacto eliminado | 2 | 2 | **4** | Graceful handling en template-replacer |
| R-006 | BUS | Rate limiting ambiguo (per-tenant vs per-company) | 2 | 2 | **4** | Clarificar en Story 3.6 |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Prob | Impact | Score | Action |
|---------|----------|-------------|------|--------|-------|--------|
| R-007 | TECH | Drag & Drop desincronización UI/DB | 1 | 2 | **2** | Reload after reorder |
| R-008 | OPS | Seed data complejo falla | 1 | 1 | **1** | Validar cada playbook en seed |

---

## Test Levels Strategy

### Recommended Split for cobra-bmad

| Level | Percentage | Rationale |
|-------|------------|-----------|
| **E2E** | 20% | Critical user journeys (login → crear cobranza → completar) |
| **API/Integration** | 50% | Business logic, RLS validation, worker behavior |
| **Unit** | 30% | Template replacer, state machine, validations |

### E2E Tests (Playwright) - P0/P1

**Critical Paths to Cover:**

1. **Flujo completo de cobranza** (P0)
   - Login → Dashboard → Facturas → Iniciar Cobranza → Ver Collection → Completar

2. **Playbook builder** (P1)
   - Crear playbook → Agregar mensajes → Reordenar → Preview

3. **Control manual** (P1)
   - Pausar → Reanudar → Completar cobranza

### API/Integration Tests (Vitest) - P0/P1/P2

**Focus Areas:**

1. **RLS Isolation** (P0)
   - Tenant A no ve datos de Tenant B
   - CRÍTICO: Verificar TODAS las tablas

2. **Worker Logic** (P0)
   - Procesa collections correctamente
   - Respeta rate limits
   - Maneja errores gracefully

3. **Business Rules** (P1)
   - State machine de Invoice
   - UNIQUE constraint en collections
   - Template variable replacement

### Unit Tests (Vitest) - P2

**Pure Functions:**

1. `calculateDaysOverdue()` - Cálculo de días vencidos
2. `templateReplacer()` - Reemplazo de variables
3. `isValidTransition()` - State machine de facturas
4. `canSendMessage()` - Rate limiting logic

---

## NFR Testing Approach

### Security (SEC)

| Test Type | Tools | Coverage |
|-----------|-------|----------|
| RLS Isolation | Vitest + Supabase Client | 100% de tablas |
| Auth/Authz | Playwright + Clerk | Login flows, protected routes |
| Input Validation | Vitest + Zod | All API inputs |

**Specific Tests for Epic 3:**
- Verificar que webhook de N8N requiere firma HMAC
- Verificar que Collection solo se puede crear para facturas del mismo tenant

### Performance (PERF)

| Test Type | Tool | Target |
|-----------|------|--------|
| Worker Benchmark | Vitest + custom timer | <30s para 100 collections |
| Dashboard Load | Playwright | <2s con 1000 facturas |
| API Response Time | Vitest + performance.now() | P95 <1000ms |

**Specific Tests for Epic 3:**
- Benchmark: processCollections() con 100 items
- Load test: Dashboard con collections activas

### Reliability (OPS)

| Test Type | Tool | Coverage |
|-----------|------|----------|
| Error Handling | Vitest | Worker error paths |
| Retry Logic | Vitest | Message send retries |
| Failover | Manual | N8N down scenario |

**Specific Tests for Epic 3:**
- Worker pausa collection cuando SendGrid falla
- Worker notifica admin cuando N8N está down

---

## Test Environment Requirements

### Local Development

```yaml
services:
  - Supabase Local (Docker)
  - Clerk Development Keys
  - Mock SendGrid/Twilio (environment flag)
  - Mock N8N webhook endpoint
```

### CI/CD (GitHub Actions)

```yaml
services:
  - Supabase Cloud (test project)
  - Clerk Test Keys
  - SendGrid/Twilio Sandbox
  - N8N Test Instance (optional)
```

### Staging

```yaml
services:
  - Supabase Cloud (staging project)
  - Clerk Production Keys
  - SendGrid/Twilio Production (with test numbers)
  - N8N Cloud
```

---

## Testability Concerns Summary

### ❌ Blockers (Must Fix Before Implementation)

| ID | Concern | Impact | Mitigation Required |
|----|---------|--------|---------------------|
| C-001 | Race condition en Worker | Tests inconsistentes, mensajes duplicados | Implementar lock/semáforo con Redis |

### ⚠️ Concerns (Should Address)

| ID | Concern | Impact | Recommendation |
|----|---------|--------|----------------|
| C-002 | N8N no mockeable | No se puede testear offline | Crear IMessageService interface |
| C-003 | SendGrid/Twilio sin sandbox | Tests pueden enviar mensajes reales | Environment flag para mocks |
| C-004 | UNIQUE INDEX condicional | Comportamiento inconsistente | Validar en PostgreSQL, agregar check en API |

---

## Recommendations for Sprint 0

### Framework Setup (`*framework` workflow)

1. **Vitest configurado** con coverage reporting
2. **Playwright configurado** para E2E
3. **Test utils** para Supabase mocking
4. **Fixtures** para Company, Invoice, Collection

### CI Pipeline (`*ci` workflow)

1. **Smoke tests** en cada PR (<5 min)
2. **Full P0/P1 tests** antes de merge a main (<10 min)
3. **Nightly regression** con todos los tests

### Test Data Strategy

1. **Factories** para generar datos de test (faker-based)
2. **Fixtures** para estados conocidos (collection activa, pausada, completada)
3. **Cleanup** automático después de cada test

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95%
- **RLS tests**: 100% (non-negotiable)
- **High-risk mitigations**: 100% complete

### Coverage Targets

- **Critical paths**: ≥80%
- **Business logic**: ≥70%
- **API routes**: ≥80%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] RLS validation passes for ALL tables
- [ ] Worker race condition resolved (R-001)

---

## Appendix

### A. Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors)
- **OPS**: Operations (deployment, config, monitoring)

### B. Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### C. Related Documents

- PRD: `docs/prd.md`
- Architecture: `docs/architecture.md`
- Epic 3: `docs/epics/epic-3-motor-cobranzas.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `.bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
