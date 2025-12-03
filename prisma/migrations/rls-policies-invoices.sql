-- ===========================================
-- RLS POLICIES PARA TABLA INVOICES
-- Story 2.5: Crear Facturas Manualmente
-- ===========================================

-- Habilitar y forzar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

-- SELECT: Solo facturas del tenant
CREATE POLICY "tenant_isolation_invoices_select"
ON invoices FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo crear en su tenant
CREATE POLICY "tenant_isolation_invoices_insert"
ON invoices FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo modificar facturas de su tenant
CREATE POLICY "tenant_isolation_invoices_update"
ON invoices FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo eliminar facturas de su tenant (aunque usamos soft delete)
CREATE POLICY "tenant_isolation_invoices_delete"
ON invoices FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
