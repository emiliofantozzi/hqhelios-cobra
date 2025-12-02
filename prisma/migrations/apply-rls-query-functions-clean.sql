-- ===========================================
-- RE-APLICAR FUNCIONES RPC (LIMPIA PRIMERO)
-- Story 1.1: Configurar Supabase con RLS Multi-Tenant
-- ===========================================
-- Este script elimina funciones existentes antes de recrearlas
-- Usar cuando necesites actualizar funciones existentes

-- ===========================================
-- ELIMINAR FUNCIONES EXISTENTES
-- ===========================================

DROP FUNCTION IF EXISTS query_users_with_tenant(UUID);
DROP FUNCTION IF EXISTS query_tenants_with_tenant(UUID);

-- ===========================================
-- FUNCIÓN: query_users_with_tenant
-- ===========================================
-- Retorna usuarios del tenant especificado después de configurar el contexto RLS
CREATE OR REPLACE FUNCTION query_users_with_tenant(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  clerk_user_id VARCHAR(255),
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20),
  is_active BOOLEAN,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Configurar contexto de tenant para RLS
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id::text, true);

  -- Retornar usuarios del tenant (RLS aplicado automáticamente)
  RETURN QUERY
  SELECT
    u.id,
    u.tenant_id,
    u.clerk_user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u;
END;
$$;

-- ===========================================
-- FUNCIÓN: query_tenants_with_tenant
-- ===========================================
-- Retorna el tenant especificado después de configurar el contexto RLS
CREATE OR REPLACE FUNCTION query_tenants_with_tenant(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  slug VARCHAR(100),
  timezone VARCHAR(50),
  default_currency VARCHAR(3),
  plan_type VARCHAR(20),
  is_active BOOLEAN,
  created_at TIMESTAMP(3),
  updated_at TIMESTAMP(3)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Configurar contexto de tenant para RLS
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id::text, true);

  -- Retornar tenant (RLS aplicado automáticamente)
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.timezone,
    t.default_currency,
    t.plan_type,
    t.is_active,
    t.created_at,
    t.updated_at
  FROM tenants t;
END;
$$;

-- ===========================================
-- PERMISOS
-- ===========================================
-- Permitir ejecución a service_role (para tests)
GRANT EXECUTE ON FUNCTION query_users_with_tenant(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION query_tenants_with_tenant(UUID) TO service_role;

-- Permitir ejecución a anon (para uso en aplicación)
GRANT EXECUTE ON FUNCTION query_users_with_tenant(UUID) TO anon;
GRANT EXECUTE ON FUNCTION query_tenants_with_tenant(UUID) TO anon;
