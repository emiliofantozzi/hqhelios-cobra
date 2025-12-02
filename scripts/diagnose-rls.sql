-- ===========================================
-- DIAGNÓSTICO DE RLS - Verificar configuración
-- ===========================================

-- 1. Verificar que RLS está habilitado y FORZADO
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled?"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'users');

-- Esperado: rowsecurity = true para ambas

-- 2. Verificar políticas existentes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as "Command",
  qual as "USING clause"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Esperado: 8 políticas (4 para tenants, 4 para users)

-- 3. Verificar que anon role NO tiene BYPASSRLS
SELECT
  rolname,
  rolbypassrls as "Can Bypass RLS?",
  rolsuper as "Is Superuser?"
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'postgres');

-- Esperado: anon y authenticated con rolbypassrls = false

-- 4. Verificar owner de las funciones RPC
SELECT
  routine_name,
  routine_type,
  security_type as "Security",
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('query_users_with_tenant', 'query_tenants_with_tenant', 'set_tenant_context')
ORDER BY routine_name;

-- PROBLEMA PROBABLE: Si security_type = 'DEFINER', las funciones se ejecutan con permisos del creador

-- 5. Test manual de RLS
DO $$
DECLARE
  test_tenant_id UUID := gen_random_uuid();
BEGIN
  -- Configurar contexto
  PERFORM set_config('app.current_tenant_id', test_tenant_id::text, true);

  -- Verificar que está configurado
  RAISE NOTICE 'Tenant context set to: %', current_setting('app.current_tenant_id', true);
END $$;
