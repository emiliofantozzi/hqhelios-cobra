-- ===========================================
-- SCHEMA + RLS POLICIES PARA COLLECTIONS
-- Story 3.4: Schema de Collections
-- ===========================================

-- ============================================
-- PARTE 1: CREAR TABLA COLLECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "primary_contact_id" UUID NOT NULL,
    "playbook_id" UUID NOT NULL,
    "current_message_index" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "messages_sent_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_sent_at" TIMESTAMPTZ(6),
    "customer_responded" BOOLEAN NOT NULL DEFAULT false,
    "last_response_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_action_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- PARTE 2: CREAR ÍNDICES
-- ============================================

-- Índice para RLS queries
CREATE INDEX IF NOT EXISTS "collections_tenant_id_idx" ON "collections"("tenant_id");

-- Índice para filtrado por tenant y status
CREATE INDEX IF NOT EXISTS "collections_tenant_status_idx" ON "collections"("tenant_id", "status");

-- Índice para worker queries (CRÍTICO para performance)
CREATE INDEX IF NOT EXISTS "collections_status_next_action_idx" ON "collections"("status", "next_action_at");

-- ============================================
-- PARTE 3: CREAR FOREIGN KEYS
-- ============================================

ALTER TABLE "collections"
ADD CONSTRAINT "collections_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collections"
ADD CONSTRAINT "collections_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collections"
ADD CONSTRAINT "collections_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collections"
ADD CONSTRAINT "collections_primary_contact_id_fkey"
FOREIGN KEY ("primary_contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collections"
ADD CONSTRAINT "collections_playbook_id_fkey"
FOREIGN KEY ("playbook_id") REFERENCES "playbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- PARTE 4: HABILITAR Y FORZAR RLS
-- ============================================

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections FORCE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 5: CREAR RLS POLICIES
-- ============================================

-- SELECT: Solo datos del tenant
CREATE POLICY "tenant_isolation_collections_select"
ON collections FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo crear en su tenant
CREATE POLICY "tenant_isolation_collections_insert"
ON collections FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo modificar en su tenant
CREATE POLICY "tenant_isolation_collections_update"
ON collections FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo eliminar en su tenant
CREATE POLICY "tenant_isolation_collections_delete"
ON collections FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================
-- PARTE 6: PARTIAL UNIQUE INDEX (CRÍTICO)
-- ============================================
-- PROPÓSITO: Solo 1 collection "activa" por factura
-- PERMITE: Múltiples collections completed/escalated (historial)

CREATE UNIQUE INDEX unique_active_collection_per_invoice
ON collections (invoice_id)
WHERE status NOT IN ('completed', 'escalated');

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE collections IS 'Trackea cobranzas activas por factura - Story 3.4';
COMMENT ON INDEX unique_active_collection_per_invoice IS 'Solo permite 1 collection activa por factura, múltiples completadas para historial';

-- ============================================
-- PARTE 7: PERMISOS (GRANT)
-- ============================================

GRANT ALL ON collections TO service_role;
GRANT ALL ON collections TO authenticated;
GRANT ALL ON collections TO anon;
