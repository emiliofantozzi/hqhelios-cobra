# Story 3.6: Worker de Procesamiento Automatico

Status: Done

## Story

**Como** sistema,
**Quiero** un worker que procese collections automaticamente,
**Para que** los mensajes se envien sin intervencion manual.

## Acceptance Criteria

### **Scenario 1: Cron ejecuta cada 5 minutos**
```gherkin
Given vercel.json tiene cron configurado
When pasan 5 minutos
Then endpoint /api/cron/collection-worker recibe GET
And responde con status del procesamiento
```

### **Scenario 2: Distributed Lock previene race conditions (R-001)**
```gherkin
Given el worker se activa
When otra instancia del worker ya esta ejecutando
Then esta instancia sale con status "lock_held"
And no procesa ninguna collection
And libera el lock inmediatamente
```

### **Scenario 3: Seleccion de collections a procesar**
```gherkin
Given hay collections con status = 'active' y next_action_at <= now
When worker ejecuta
Then procesa hasta 100 collections
And las procesa en orden de next_action_at ASC (mas antiguas primero)
And skipea collections de tenants que exceden rate limits
```

### **Scenario 4: Enviar mensaje de playbook**
```gherkin
Given collection tiene current_message_index = 0
And playbook tiene mensaje en posicion 0
When worker procesa la collection
Then:
  1. Obtiene playbook_message[0] ordenado por sequence_order
  2. Reemplaza variables en template ({{company_name}}, {{invoice_number}}, etc.)
  3. Llama IMessageService.send() con channel, to, subject, body
  4. Incrementa messages_sent_count
  5. Actualiza last_message_sent_at = now
  6. current_message_index = 1 (siguiente mensaje)
  7. next_action_at = now + wait_days del SIGUIENTE mensaje
```

### **Scenario 5: Respetar sendOnlyIfNoResponse**
```gherkin
Given collection tiene customer_responded = true
And mensaje siguiente tiene send_only_if_no_response = true
When worker procesa
Then salta el mensaje sin enviarlo
And avanza al siguiente mensaje del playbook
And recalcula next_action_at segun wait_days del nuevo mensaje
```

### **Scenario 6: Completar collection sin mas mensajes**
```gherkin
Given collection llego al ultimo mensaje del playbook
When worker intenta avanzar y no hay mas mensajes
Then status = 'completed'
And completed_at = now
And next_action_at = null
And no se envia mensaje adicional
```

### **Scenario 7: Rate Limit - Max Active Per Tenant**
```gherkin
Given tenant "A" tiene 5 collections activas listas para procesar
And maxActiveCollectionsPerTenant = 5
When worker procesa collections de tenant "A"
Then solo procesa las primeras 5 collections
And las restantes se dejan para siguiente ejecucion
And log indica "rate_limit: max_active_exceeded"
```

### **Scenario 8: Rate Limit - Time Between Messages to Same Contact**
```gherkin
Given contacto "X" recibio mensaje hace 2 horas
And minHoursBetweenMessagesToSameContact = 4
When worker procesa collection para contacto "X"
Then mensaje se postpone con reason "min_hours_not_met"
And next_action_at se actualiza a last_message_sent_at + 4 horas
And no se envia mensaje
```

### **Scenario 9: Rate Limit - Daily Limit Per Tenant**
```gherkin
Given tenant "B" ha enviado 10 mensajes hoy
And maxMessagesPerDayPerTenant = 10
When worker procesa cualquier collection de tenant "B"
Then mensaje se skipea con reason "daily_limit_exceeded"
And collection permanece 'active' para manana
And log indica rate limit alcanzado
```

### **Scenario 10: Error en envio**
```gherkin
Given IMessageService.send() retorna success = false
When worker intenta enviar mensaje
Then collection.status = 'paused'
And se registra error en logs
And collection no se procesa hasta reanudar manualmente
```

### **Scenario 11: Performance**
```gherkin
Given hay 100 collections listas para procesar
When worker ejecuta
Then completa en < 30 segundos
And responde antes del timeout de Vercel (300s)
```

## Tasks / Subtasks

### Task 1: Crear IMessageService Interface y MockMessageService (AC: 4, 10)

- [x] **Task 1.1**: Crear `src/lib/services/messaging/types.ts`
  - [x] Interface `IMessageService` con metodo `send()`
  - [x] Type `MessageChannel = 'email' | 'whatsapp'`
  - [x] Type `SendMessageParams` con channel, to, subject?, body, metadata?
  - [x] Type `SendMessageResult` con success, messageId?, error?

- [x] **Task 1.2**: Crear `src/lib/services/messaging/mock-message-service.ts`
  - [x] Implementar `MockMessageService` que logea a consola
  - [x] NO envia mensajes realmente
  - [x] Simular delay aleatorio 50-200ms
  - [x] 95% success rate para testing de errores
  - [x] Log completo con timestamp, channel, to, body preview

### Task 2: Crear Rate Limiting Utilities (AC: 7, 8, 9)

- [x] **Task 2.1**: Crear `src/lib/workers/rate-limits.ts`
  - [x] Constantes de configuracion:
    - `MAX_ACTIVE_COLLECTIONS_PER_TENANT = 5`
    - `MIN_HOURS_BETWEEN_MESSAGES_TO_SAME_CONTACT = 4`
    - `MAX_MESSAGES_PER_DAY_PER_TENANT = 10`
  - [x] Function `checkRateLimits(collection, tenantStats)`
  - [x] Return: `{ allowed: boolean, reason?: string, retryAfter?: Date }`

- [x] **Task 2.2**: Crear funcion `getTenantDailyMessageCount(tenantId, date)`
  - [x] Query a tabla sent_messages (o collections.messages_sent_count)
  - [x] Contar mensajes enviados hoy por tenant
  - [x] Cache result in worker context (evitar N+1 queries)

- [x] **Task 2.3**: Crear funcion `getContactLastMessageTime(contactId)`
  - [x] Query last_message_sent_at de collections con este contacto
  - [x] Retornar timestamp o null si nunca se envio

### Task 3: Crear Upstash Redis Lock (AC: 2)

- [x] **Task 3.1**: Crear `src/lib/workers/distributed-lock.ts`
  - [x] Import `Redis` from `@upstash/redis`
  - [x] Function `acquireLock(lockKey, ttlSeconds)`: Promise<boolean>
  - [x] Function `releaseLock(lockKey)`: Promise<void>
  - [x] Config: lockKey = 'collection-worker-lock', TTL = 45 seconds
  - [x] Usar `SET NX EX` pattern para atomicidad

- [x] **Task 3.2**: Agregar environment variables
  - [x] UPSTASH_REDIS_REST_URL (required)
  - [x] UPSTASH_REDIS_REST_TOKEN (required)
  - [x] Validation en getRedisClient()

### Task 4: Crear Collection Worker Core Logic (AC: 3, 4, 5, 6)

- [x] **Task 4.1**: Crear `src/lib/workers/collection-worker.ts`
  - [x] Export `processCollections()`: main entry point
  - [x] Acquire lock at start, release at end (finally block)
  - [x] Query active collections with next_action_at <= now
  - [x] Batch processing con limite de 100 collections
  - [x] Error handling por collection (no fail entire batch)

- [x] **Task 4.2**: Crear funcion `processCollection(collection)`
  - [x] Obtener siguiente mensaje del playbook
  - [x] Check sendOnlyIfNoResponse si customer_responded
  - [x] Check rate limits (tenant, contact, daily)
  - [x] Reemplazar variables en template
  - [x] Llamar IMessageService.send()
  - [x] Actualizar collection state
  - [x] Handle completion si no hay mas mensajes

- [x] **Task 4.3**: Crear funcion `getNextMessage(collection, playbook)`
  - [x] Query playbook_messages ordenados por sequence_order
  - [x] Retornar mensaje en posicion current_message_index
  - [x] Retornar null si no hay mas mensajes

- [x] **Task 4.4**: Crear funcion `buildMessageContext(collection)`
  - [x] Fetch invoice, company, contact data
  - [x] Calcular days_overdue
  - [x] Formatear amount con currency
  - [x] Retornar objeto para replaceTemplateVariables()

- [x] **Task 4.5**: Crear funcion `updateCollectionAfterSend(collection, success)`
  - [x] Increment messages_sent_count
  - [x] Set last_message_sent_at = now
  - [x] Increment current_message_index
  - [x] Calculate next_action_at based on next message wait_days
  - [x] Si error: set status = 'paused'

### Task 5: Crear API Route Handler (AC: 1)

- [x] **Task 5.1**: Crear `src/app/api/cron/collection-worker/route.ts`
  - [x] Method: GET (Vercel Cron solo soporta GET)
  - [x] Verificar CRON_SECRET header (Vercel protection)
  - [x] Llamar processCollections()
  - [x] Retornar JSON con stats: processed, skipped, errors
  - [x] Timeout handling (max 5 min = 300000ms)

### Task 6: Configurar vercel.json Cron (AC: 1)

- [x] **Task 6.1**: Modificar `vercel.json`
  - [x] Agregar crons array
  - [x] Path: /api/cron/collection-worker
  - [x] Schedule: */5 * * * * (cada 5 minutos)

### Task 7: Tests (AC: todos)

- [x] **Task 7.1**: Tests de IMessageService
  - [x] MockMessageService logs correctly
  - [x] Send returns success/failure
  - [x] Handles all channels (email, whatsapp)

- [x] **Task 7.2**: Tests de Rate Limiting
  - [x] Max active per tenant
  - [x] Min hours between messages
  - [x] Daily limit per tenant
  - [x] Rate limit bypass when limits not reached

- [x] **Task 7.3**: Tests de Distributed Lock
  - [x] Acquire lock successfully
  - [x] Fail to acquire when already held
  - [x] Lock auto-expires after TTL
  - [x] Release lock works

- [x] **Task 7.4**: Tests de Collection Worker
  - [x] Process collection successfully
  - [x] Skip sendOnlyIfNoResponse when customer_responded
  - [x] Complete collection when no more messages
  - [x] Handle send errors gracefully
  - [x] Respect rate limits

- [x] **Task 7.5**: Tests de Performance
  - [x] Process 100 collections in < 30 seconds
  - [x] Query performance with indexes

## Dev Notes

### Security Checklist (CRITICAL - Verify First)
- [x] Cron endpoint protected by CRON_SECRET verification
- [x] Worker uses getAdminSupabaseClient() (bypass RLS for cross-tenant queries)
- [x] Individual collection updates filtered by tenant_id
- [x] No user input - all data from DB
- [x] Rate limits enforced at worker level
- [x] Lock prevents duplicate processing

### Architecture Compliance

**Stack Tecnologico:**
- @upstash/redis ^1.35.7 (already in package.json)
- Supabase Client for queries
- Vercel Cron for scheduling
- MockMessageService for Epic 3 (real services in Epic 4)

**Patrones del proyecto:**
1. Services en `src/lib/services/` para logica de negocio
2. Workers en `src/lib/workers/` para background processing
3. API routes en `src/app/api/cron/` para cron jobs
4. Utilities con JSDoc completo
5. Template replacement con `replaceTemplateVariables()`

### Worker Configuration

```typescript
// src/lib/workers/config.ts
export const workerConfig = {
  schedule: '*/5 * * * *',  // Every 5 minutes
  batchSize: 100,           // Max collections per run
  timeout: 300000,          // 5 minutes max (Vercel limit)

  // Redis Lock (Upstash)
  lock: {
    key: 'collection-worker-lock',
    ttlSeconds: 45,         // Auto-release after 45 sec
  },

  // Rate Limits
  rateLimits: {
    maxActiveCollectionsPerTenant: 5,
    minHoursBetweenMessagesToSameContact: 4,
    maxMessagesPerDayPerTenant: 10,
  },
};
```

### IMessageService Interface

```typescript
// src/lib/services/messaging/types.ts

export type MessageChannel = 'email' | 'whatsapp';

export interface SendMessageParams {
  channel: MessageChannel;
  to: string;                    // Email or phone number
  subject?: string;              // Email only
  body: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IMessageService {
  send(params: SendMessageParams): Promise<SendMessageResult>;
}
```

### MockMessageService Implementation

```typescript
// src/lib/services/messaging/mock-message-service.ts

import { IMessageService, SendMessageParams, SendMessageResult } from './types';

/**
 * Mock implementation of IMessageService for Epic 3.
 * Logs messages to console without actually sending them.
 *
 * @remarks
 * Real implementations (SendGridService, TwilioService) will be added in Epic 4.
 */
export class MockMessageService implements IMessageService {
  private successRate = 0.95; // 95% success rate for testing

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

    const success = Math.random() < this.successRate;
    const messageId = success ? `mock_${Date.now()}_${Math.random().toString(36).slice(2)}` : undefined;

    console.log('[MockMessageService]', {
      timestamp: new Date().toISOString(),
      channel: params.channel,
      to: params.to,
      subject: params.subject,
      bodyPreview: params.body.substring(0, 100) + (params.body.length > 100 ? '...' : ''),
      success,
      messageId,
    });

    return {
      success,
      messageId,
      error: success ? undefined : 'Simulated failure for testing',
    };
  }
}

// Singleton instance
export const messageService = new MockMessageService();
```

### Distributed Lock Implementation

```typescript
// src/lib/workers/distributed-lock.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Acquires a distributed lock using Redis SET NX EX pattern.
 *
 * @param lockKey - Unique key for the lock
 * @param ttlSeconds - Time to live in seconds (auto-release)
 * @returns true if lock acquired, false if already held
 */
export async function acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
  const result = await redis.set(lockKey, '1', { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

/**
 * Releases a distributed lock.
 *
 * @param lockKey - Key of the lock to release
 */
export async function releaseLock(lockKey: string): Promise<void> {
  await redis.del(lockKey);
}
```

### Collection Worker Core Logic (Pseudocode)

```typescript
// src/lib/workers/collection-worker.ts

import { getAdminSupabaseClient } from '@/lib/db/supabase';
import { replaceTemplateVariables } from '@/lib/utils/template-replacer';
import { messageService } from '@/lib/services/messaging/mock-message-service';
import { acquireLock, releaseLock } from './distributed-lock';
import { checkRateLimits, buildTenantStats } from './rate-limits';
import { workerConfig } from './config';

interface ProcessResult {
  processed: number;
  skipped: number;
  errors: number;
  lockHeld: boolean;
}

/**
 * Main entry point for the collection worker.
 * Acquires lock, processes collections, releases lock.
 */
export async function processCollections(): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, skipped: 0, errors: 0, lockHeld: false };

  // Try to acquire lock
  const lockAcquired = await acquireLock(
    workerConfig.lock.key,
    workerConfig.lock.ttlSeconds
  );

  if (!lockAcquired) {
    console.log('[Worker] Lock held by another instance, exiting');
    return { ...result, lockHeld: true };
  }

  try {
    const supabase = getAdminSupabaseClient();

    // Fetch active collections ready to process
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        playbook:playbooks(*, playbook_messages(*)),
        invoice:invoices(*),
        company:companies(*),
        contact:contacts!primary_contact_id(*)
      `)
      .eq('status', 'active')
      .lte('next_action_at', new Date().toISOString())
      .order('next_action_at', { ascending: true })
      .limit(workerConfig.batchSize);

    if (error) {
      console.error('[Worker] Error fetching collections:', error);
      return result;
    }

    // Build tenant stats for rate limiting
    const tenantStats = await buildTenantStats(supabase, collections || []);

    for (const collection of collections || []) {
      try {
        const processResult = await processCollection(supabase, collection, tenantStats);
        if (processResult === 'processed') result.processed++;
        else if (processResult === 'skipped') result.skipped++;
      } catch (err) {
        console.error(`[Worker] Error processing collection ${collection.id}:`, err);
        result.errors++;
        await pauseCollectionWithError(supabase, collection.id, err);
      }
    }

    console.log('[Worker] Completed:', result);
    return result;

  } finally {
    await releaseLock(workerConfig.lock.key);
  }
}
```

### API Route Handler

```typescript
// src/app/api/cron/collection-worker/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processCollections } from '@/lib/workers/collection-worker';

/**
 * GET /api/cron/collection-worker
 * Vercel Cron endpoint that processes active collections.
 *
 * Runs every 5 minutes (configured in vercel.json).
 * Protected by CRON_SECRET header validation.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header to cron requests)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cron] Unauthorized request to collection-worker');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting collection worker...');
    const startTime = Date.now();

    const result = await processCollections();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms:`, result);

    if (result.lockHeld) {
      return NextResponse.json({
        status: 'lock_held',
        message: 'Another worker instance is running',
      }, { status: 200 }); // 200 so Vercel doesn't retry
    }

    return NextResponse.json({
      status: 'success',
      processed: result.processed,
      skipped: result.skipped,
      errors: result.errors,
      duration_ms: duration,
    });

  } catch (error) {
    console.error('[Cron] Worker failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Required for Vercel Cron - prevents caching
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max
```

### vercel.json Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/collection-worker",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Template Variables Available

```typescript
// Variables disponibles en templates de mensajes:
const templateVariables = {
  company_name: 'Nombre de la empresa cliente',
  contact_first_name: 'Nombre del contacto',
  contact_last_name: 'Apellido del contacto',
  invoice_number: 'Numero de factura',
  amount: 'Monto formateado (ej: 1,500.00)',
  currency: 'Moneda (USD, MXN)',
  due_date: 'Fecha de vencimiento formateada',
  days_overdue: 'Dias de retraso (0 si no vencida)',
};
```

### File Structure

```
src/
├── lib/
│   ├── services/
│   │   └── messaging/
│   │       ├── types.ts                    # NUEVO - IMessageService interface
│   │       └── mock-message-service.ts     # NUEVO - MockMessageService
│   └── workers/
│       ├── config.ts                       # NUEVO - Worker configuration
│       ├── distributed-lock.ts             # NUEVO - Upstash Redis lock
│       ├── rate-limits.ts                  # NUEVO - Rate limiting utilities
│       └── collection-worker.ts            # NUEVO - Core worker logic
├── app/
│   └── api/
│       └── cron/
│           └── collection-worker/
│               └── route.ts                # NUEVO - Cron endpoint

vercel.json                                 # MODIFICAR - Add crons array

__tests__/
└── workers/
    ├── mock-message-service.test.ts        # NUEVO
    ├── distributed-lock.test.ts            # NUEVO
    ├── rate-limits.test.ts                 # NUEVO
    └── collection-worker.test.ts           # NUEVO
```

### Testing Requirements

**Tests de IMessageService:**
```typescript
describe('MockMessageService', () => {
  it('should return success with messageId', async () => {
    const result = await messageService.send({
      channel: 'email',
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test message',
    });
    expect(result.success).toBeDefined();
    if (result.success) {
      expect(result.messageId).toBeDefined();
    }
  });

  it('should handle both email and whatsapp channels', async () => {
    // Test email
    const emailResult = await messageService.send({
      channel: 'email',
      to: 'test@example.com',
      body: 'Email test',
    });
    expect(emailResult).toBeDefined();

    // Test whatsapp
    const waResult = await messageService.send({
      channel: 'whatsapp',
      to: '+5215512345678',
      body: 'WhatsApp test',
    });
    expect(waResult).toBeDefined();
  });
});
```

**Tests de Distributed Lock:**
```typescript
describe('Distributed Lock', () => {
  it('should acquire lock successfully', async () => {
    const acquired = await acquireLock('test-lock', 10);
    expect(acquired).toBe(true);
    await releaseLock('test-lock');
  });

  it('should fail to acquire lock when already held', async () => {
    await acquireLock('test-lock', 10);
    const secondAcquire = await acquireLock('test-lock', 10);
    expect(secondAcquire).toBe(false);
    await releaseLock('test-lock');
  });
});
```

**Tests de Rate Limiting:**
```typescript
describe('Rate Limits', () => {
  it('should enforce max active per tenant', () => {
    const stats = new Map([
      ['tenant-1', { tenantId: 'tenant-1', activeCollections: 6, messagesSentToday: 0, contactLastMessageTimes: new Map() }]
    ]);
    const result = checkRateLimits({ tenant_id: 'tenant-1' }, stats);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('max_active_exceeded');
  });

  it('should enforce min hours between messages', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stats = new Map([
      ['tenant-1', {
        tenantId: 'tenant-1',
        activeCollections: 1,
        messagesSentToday: 0,
        contactLastMessageTimes: new Map([['contact-1', twoHoursAgo]])
      }]
    ]);
    const result = checkRateLimits(
      { tenant_id: 'tenant-1', primary_contact_id: 'contact-1' },
      stats
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('min_hours_not_met');
    expect(result.retryAfter).toBeDefined();
  });
});
```

**Tests de Collection Worker:**
```typescript
describe('Collection Worker', () => {
  it('should process collection and send message', async () => {
    // Setup: Create test collection with playbook
    // Execute: processCollection()
    // Assert: message sent, collection updated
  });

  it('should skip message when sendOnlyIfNoResponse and customer_responded', async () => {
    // Setup: Collection with customer_responded = true
    // Execute: processCollection()
    // Assert: current_message_index incremented, no message sent
  });

  it('should complete collection when no more messages', async () => {
    // Setup: Collection at last message
    // Execute: processCollection()
    // Assert: status = 'completed', completed_at set
  });

  it('should pause collection on send error', async () => {
    // Setup: Mock messageService to return error
    // Execute: processCollection()
    // Assert: status = 'paused'
  });
});
```

## Dependencies

**Prerequisitos de esta story:**
- Story 3.5 completada (collections con status 'active' existen) - DONE
- Upstash account configurado con Redis database
- Environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET
- Package @upstash/redis instalado (ya en package.json v1.35.7)

**Esta story bloquea:**
- Story 3.7: Control Manual de Playbook Activo (necesita collections procesandose)
- Epic 4: Implementaciones reales de IMessageService

## References

- **[Source: docs/epics/epic-3-motor-cobranzas.md#Story-3.6]** - Epic definition
- **[Source: docs/epics/epic-3-motor-cobranzas.md#Configuracion-del-Worker]** - Worker config
- **[Source: docs/epics/epic-3-motor-cobranzas.md#IMessageService]** - Interface definition
- **[Source: docs/architecture.md#Background-Workers]** - Worker patterns
- **[Source: src/lib/utils/template-replacer.ts]** - Template replacement utility
- **[Source: src/lib/db/supabase.ts#getAdminSupabaseClient]** - Admin client for worker

---

## Dev Agent Record

### Context Reference

Story designed using BMad Method with comprehensive analysis of:
- Epic 3 complete specification - Motor de Cobranzas
- Story 3.4 and 3.5 as pattern references
- Party Mode decisions (2025-12-03) - IMessageService, Rate Limiting, R-001 mitigation
- Existing codebase: collection-service.ts, template-replacer.ts, supabase.ts
- Package.json confirming @upstash/redis already installed

### Agent Model Used

claude-opus-4-5-20251101 (Opus 4.5)

### Completion Notes

**Story Status:** Done (Code Review Passed with Fixes Applied)
**Epic:** 3 - Motor de Cobranzas Automatizado
**Priority:** critical (enables automated collection processing)
**Implemented:** 2025-12-04 by Dev Agent (Amelia)
**Code Review:** 2025-12-04 by Dev Agent (Amelia) - Adversarial review with auto-fixes

**Summary:**
- Implemented IMessageService interface with MockMessageService for Epic 3
- Created rate limiting utilities with configurable thresholds
- Implemented distributed lock using Upstash Redis (SET NX EX pattern)
- Created collection worker with batch processing (100 collections max)
- Created Vercel Cron endpoint at /api/cron/collection-worker
- All tests passing (21 passed, 5 skipped for Redis when not configured)

**Code Review Fixes Applied (2025-12-04):**
- **HIGH-1:** Fixed rate limit comparison (>= instead of >) - `rate-limits.ts:65`
- **HIGH-2:** Added tenant-level filtering to skip all collections from rate-limited tenants - `collection-worker.ts:194-215`
- **HIGH-3:** Fixed next_action_at calculation using milliseconds (avoids edge cases) - `collection-worker.ts:438-445, 480-487`
- **HIGH-4:** Pre-filter blocked tenants before processing loop (AC 3) - `collection-worker.ts:194-207`
- **HIGH-5:** Added structured error logging for admin notifications (Epic 5 TODO) - `collection-worker.ts:554-589`
- **MED-1:** Enhanced skip reason logging with structured context - `collection-worker.ts:501-532`
- **MED-2:** Optimized buildTenantStats with Promise.all for parallel queries - `rate-limits.ts:208-232`
- **MED-3:** Added performance test for AC 11 - `collection-worker.test.ts:136-151`

**Dependencies:**
- Story 3.5 (Activar Playbook en Factura) - DONE
- Upstash Redis account and env vars - CONFIGURED

**Blocks:**
- Story 3.7 (Control Manual de Playbook Activo)
- Epic 4 (Real messaging implementations)

### File List

**New Files Created:**
- `src/lib/services/messaging/types.ts` - IMessageService interface and types
- `src/lib/services/messaging/mock-message-service.ts` - Mock implementation
- `src/lib/workers/config.ts` - Worker configuration constants
- `src/lib/workers/rate-limits.ts` - Rate limiting utilities
- `src/lib/workers/distributed-lock.ts` - Upstash Redis lock
- `src/lib/workers/collection-worker.ts` - Core worker logic
- `src/app/api/cron/collection-worker/route.ts` - Cron endpoint
- `__tests__/services/messaging/mock-message-service.test.ts` - Message service tests
- `__tests__/workers/rate-limits.test.ts` - Rate limit tests
- `__tests__/workers/distributed-lock.test.ts` - Lock tests
- `__tests__/workers/collection-worker.test.ts` - Worker tests

**Modified Files:**
- `vercel.json` - Added crons configuration

---

**Generated:** 2025-12-04
**Workflow:** dev-story
**Epic:** 3 - Motor de Cobranzas Automatizado
