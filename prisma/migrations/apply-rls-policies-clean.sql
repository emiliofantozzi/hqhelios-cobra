-- ===========================================
-- RE-APLICAR RLS POLICIES (LIMPIA PRIMERO)
-- Story 1.1: Configurar Supabase con RLS Multi-Tenant
-- ===========================================
-- Este script elimina policies existentes antes de recrearlas
-- Usar cuando necesites actualizar policies existentes

-- ===========================================
-- ELIMINAR POLICIES EXISTENTES
-- ===========================================

DROP POLICY IF EXISTS "tenant_isolation_tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_tenants_insert" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_tenants_update" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_tenants_delete" ON tenants;

DROP POLICY IF EXISTS "tenant_isolation_users_select" ON users;
DROP POLICY IF EXISTS "tenant_isolation_users_insert" ON users;
DROP POLICY IF EXISTS "tenant_isolation_users_update" ON users;
DROP POLICY IF EXISTS "tenant_isolation_users_delete" ON users;

-- ===========================================
-- HABILITAR Y FORZAR RLS EN TABLAS
-- ===========================================
-- FORCE garantiza que incluso service_role respete las policies
-- CRÍTICO para seguridad multi-tenant

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- ===========================================
-- POLICIES PARA TABLA TENANTS
-- ===========================================

-- SELECT: Solo puede ver su propio tenant
CREATE POLICY "tenant_isolation_tenants_select"
ON tenants FOR SELECT
USING (id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo puede crear su propio tenant
CREATE POLICY "tenant_isolation_tenants_insert"
ON tenants FOR INSERT
WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo puede modificar su propio tenant
CREATE POLICY "tenant_isolation_tenants_update"
ON tenants FOR UPDATE
USING (id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo puede eliminar su propio tenant
CREATE POLICY "tenant_isolation_tenants_delete"
ON tenants FOR DELETE
USING (id = current_setting('app.current_tenant_id', true)::uuid);

-- ===========================================
-- POLICIES PARA TABLA USERS
-- ===========================================

-- SELECT: Solo usuarios de su tenant
CREATE POLICY "tenant_isolation_users_select"
ON users FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Solo puede crear usuarios en su tenant
CREATE POLICY "tenant_isolation_users_insert"
ON users FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Solo puede modificar usuarios de su tenant
CREATE POLICY "tenant_isolation_users_update"
ON users FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Solo puede eliminar usuarios de su tenant
CREATE POLICY "tenant_isolation_users_delete"
ON users FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
