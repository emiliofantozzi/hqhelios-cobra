-- ===========================================
-- RLS POLICIES PARA TABLA COMPANIES
-- Story 2.1: Crear Empresas Cliente
-- ===========================================

-- Habilitar y forzar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

-- SELECT: Solo empresas del tenant
CREATE POLICY "tenant_isolation_companies_select"
ON companies FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo crear en su tenant
CREATE POLICY "tenant_isolation_companies_insert"
ON companies FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo modificar empresas de su tenant
CREATE POLICY "tenant_isolation_companies_update"
ON companies FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo eliminar empresas de su tenant
CREATE POLICY "tenant_isolation_companies_delete"
ON companies FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
