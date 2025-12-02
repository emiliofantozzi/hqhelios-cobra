-- ===========================================
-- FUNCION RPC PARA ESTABLECER CONTEXTO DE TENANT
-- Story 1.1: Configurar Supabase con RLS Multi-Tenant
-- ===========================================

-- Funcion para establecer el tenant_id en el contexto de la sesion
-- Usada por el cliente Supabase para configurar RLS
-- Renombrada de set_config -> set_tenant_context para evitar recursión
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_tenant_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar pg_catalog.set_config() para evitar recursión infinita
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id, true);
  RETURN p_tenant_id;
END;
$$;

-- Dar permisos para que service_role y anon puedan ejecutar la funcion
GRANT EXECUTE ON FUNCTION set_tenant_context(text) TO service_role;
GRANT EXECUTE ON FUNCTION set_tenant_context(text) TO anon;
