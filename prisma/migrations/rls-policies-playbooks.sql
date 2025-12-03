-- ===========================================
-- RLS POLICIES PARA TABLA PLAYBOOKS
-- Story 3.1: Schema de Playbooks y Mensajes
-- ===========================================

-- ===========================================
-- PASO 0: Partial Unique Index para Default Playbook
-- Solo permite UN playbook con is_default=true por tenant/trigger_type
-- ===========================================

-- Drop the incorrect unique constraint if it exists
DROP INDEX IF EXISTS playbooks_tenant_id_trigger_type_is_default_key;

-- Create partial unique index (correct behavior)
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_playbook_per_tenant_trigger
ON playbooks (tenant_id, trigger_type)
WHERE is_default = true;

-- ===========================================
-- PASO 1: Habilitar y forzar RLS
-- ===========================================

-- Habilitar y forzar RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks FORCE ROW LEVEL SECURITY;

-- SELECT: Solo playbooks del tenant
CREATE POLICY "tenant_isolation_playbooks_select"
ON playbooks FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo crear en su tenant
CREATE POLICY "tenant_isolation_playbooks_insert"
ON playbooks FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo modificar playbooks de su tenant
CREATE POLICY "tenant_isolation_playbooks_update"
ON playbooks FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo eliminar playbooks de su tenant
CREATE POLICY "tenant_isolation_playbooks_delete"
ON playbooks FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ===========================================
-- RLS POLICIES PARA TABLA PLAYBOOK_MESSAGES
-- ===========================================

-- Habilitar y forzar RLS
ALTER TABLE playbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_messages FORCE ROW LEVEL SECURITY;

-- SELECT: Verificar tenant via JOIN con playbooks
CREATE POLICY "tenant_isolation_playbook_messages_select"
ON playbook_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- INSERT: Validar que el playbook pertenece al tenant
CREATE POLICY "tenant_isolation_playbook_messages_insert"
ON playbook_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- UPDATE: Verificar tenant via JOIN
CREATE POLICY "tenant_isolation_playbook_messages_update"
ON playbook_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);

-- DELETE: Verificar tenant via JOIN
CREATE POLICY "tenant_isolation_playbook_messages_delete"
ON playbook_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM playbooks p
    WHERE p.id = playbook_messages.playbook_id
    AND p.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
);
