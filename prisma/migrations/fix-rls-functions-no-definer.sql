-- ===========================================
-- FIX: Funciones RPC SIN SECURITY DEFINER
-- ===========================================
-- PROBLEMA: SECURITY DEFINER hace que las funciones se ejecuten con permisos
-- del creador (superuser), lo cual BYPASSA RLS incluso con FORCE.
--
-- SOLUCIÓN: Remover SECURITY DEFINER de las funciones de query.
-- Las funciones se ejecutarán con permisos del caller (anon role).

-- ===========================================
-- ELIMINAR FUNCIONES EXISTENTES
-- ===========================================

DROP FUNCTION IF EXISTS query_users_with_tenant(UUID);
DROP FUNCTION IF EXISTS query_tenants_with_tenant(UUID);

-- ===========================================
-- FUNCIÓN: query_users_with_tenant (SIN SECURITY DEFINER)
-- ===========================================
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
-- REMOVIDO: SECURITY DEFINER
AS $$
BEGIN
  -- Configurar contexto de tenant usando función DEFINER
  PERFORM set_tenant_context(p_tenant_id::text);

  -- Retornar usuarios (RLS se aplica con permisos de caller = anon)
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
-- FUNCIÓN: query_tenants_with_tenant (SIN SECURITY DEFINER)
-- ===========================================
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
-- REMOVIDO: SECURITY DEFINER
AS $$
BEGIN
  -- Configurar contexto de tenant usando función DEFINER
  PERFORM set_tenant_context(p_tenant_id::text);

  -- Retornar tenant (RLS se aplica con permisos de caller = anon)
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
GRANT EXECUTE ON FUNCTION query_users_with_tenant(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION query_tenants_with_tenant(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION query_users_with_tenant(UUID) TO anon;
GRANT EXECUTE ON FUNCTION query_tenants_with_tenant(UUID) TO anon;

-- ===========================================
-- PERMISOS DE TABLAS PARA ANON
-- ===========================================
-- El anon role necesita permisos SELECT en las tablas
-- Las policies controlarán QUÉ filas puede ver

GRANT SELECT ON TABLE tenants TO anon;
GRANT SELECT ON TABLE users TO anon;
