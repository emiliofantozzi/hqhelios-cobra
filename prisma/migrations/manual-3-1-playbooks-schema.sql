-- ===========================================
-- Story 3.1: Schema de Playbooks y Mensajes
-- Ejecutar en Supabase SQL Editor
-- ===========================================

-- ============================================
-- PASO 1: Crear tablas
-- ============================================

-- Tabla playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(20) NOT NULL,
  trigger_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla playbook_messages
CREATE TABLE IF NOT EXISTS playbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL,
  temperature VARCHAR(20) NOT NULL,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  use_ai_generation BOOLEAN NOT NULL DEFAULT false,
  ai_instructions TEXT,
  wait_days INTEGER NOT NULL DEFAULT 0,
  send_only_if_no_response BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- PASO 2: Crear índices y constraints
-- ============================================

-- Índice en tenant_id para playbooks
CREATE INDEX IF NOT EXISTS playbooks_tenant_id_idx ON playbooks(tenant_id);

-- Índice en playbook_id para messages
CREATE INDEX IF NOT EXISTS playbook_messages_playbook_id_idx ON playbook_messages(playbook_id);

-- Partial unique index: solo 1 default por trigger_type por tenant
-- NOTA: Usamos partial index (WHERE is_default = true) en lugar de
-- constraint completo para permitir múltiples playbooks no-default
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_playbook_per_tenant_trigger
ON playbooks (tenant_id, trigger_type)
WHERE is_default = true;

-- Unique constraint: sequence_order único por playbook
CREATE UNIQUE INDEX IF NOT EXISTS playbook_messages_playbook_id_sequence_order_key
ON playbook_messages(playbook_id, sequence_order);

-- ============================================
-- PASO 3: RLS para playbooks
-- ============================================

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "tenant_isolation_playbooks_select"
ON playbooks FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT
CREATE POLICY "tenant_isolation_playbooks_insert"
ON playbooks FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE
CREATE POLICY "tenant_isolation_playbooks_update"
ON playbooks FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE
CREATE POLICY "tenant_isolation_playbooks_delete"
ON playbooks FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================
-- PASO 4: RLS para playbook_messages
-- ============================================

ALTER TABLE playbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_messages FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "tenant_isolation_playbook_messages_select"
ON playbook_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- INSERT
CREATE POLICY "tenant_isolation_playbook_messages_insert"
ON playbook_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- UPDATE
CREATE POLICY "tenant_isolation_playbook_messages_update"
ON playbook_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- DELETE
CREATE POLICY "tenant_isolation_playbook_messages_delete"
ON playbook_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- ============================================
-- PASO 5: Verificación
-- ============================================

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('playbooks', 'playbook_messages');

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('playbooks', 'playbook_messages');
