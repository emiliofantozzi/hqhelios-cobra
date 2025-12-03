-- ===========================================
-- RLS POLICIES PARA TABLA INVOICE_STATUS_HISTORY
-- Story 2.6: Gestionar Estados de Facturas
-- ===========================================
-- IMPORTANTE: Esta tabla es APPEND-ONLY (no UPDATE, no DELETE)
-- Los registros de historial son inmutables para auditoría

-- Habilitar y forzar RLS
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history FORCE ROW LEVEL SECURITY;

-- SELECT: Solo historial del tenant
CREATE POLICY "tenant_isolation_invoice_status_history_select"
ON invoice_status_history FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo crear en su tenant
CREATE POLICY "tenant_isolation_invoice_status_history_insert"
ON invoice_status_history FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- NO UPDATE POLICY: Los registros de historial son inmutables
-- NO DELETE POLICY: Los registros de historial no se pueden eliminar

-- Comentario descriptivo
COMMENT ON TABLE invoice_status_history IS 'Historial de cambios de estado de facturas - APPEND ONLY (no update/delete)';
