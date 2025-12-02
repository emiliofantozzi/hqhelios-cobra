# RLS Migrations - Instrucciones de Aplicación

## ⚠️ IMPORTANTE: Ejecutar en ORDEN

Las siguientes SQL migrations deben aplicarse **manualmente** en Supabase SQL Editor en el orden especificado.

### Orden de Ejecución

#### PRIMERA VEZ (Setup Inicial)

1. **Prisma Migration** (Ya aplicada via `pnpm prisma migrate dev`)
   - `20251202050059_init_tenants_users/migration.sql`
   - Crea tablas `tenants` y `users`

2. **RLS Policies**
   - Archivo: `prisma/migrations/rls-policies.sql`
   - Habilita y FUERZA RLS en ambas tablas
   - Crea 8 policies (SELECT/INSERT/UPDATE/DELETE para cada tabla)

3. **Función set_tenant_context**
   - Archivo: `prisma/migrations/rls-set-config-function.sql`
   - Crea función para establecer contexto de tenant
   - **FIX:** Ya no es recursiva, usa `pg_catalog.set_config()`

4. **Funciones RPC de Query**
   - Archivo: `prisma/migrations/rls-query-functions.sql`
   - Crea `query_users_with_tenant(UUID)`
   - Crea `query_tenants_with_tenant(UUID)`
   - **CRÍTICO:** Requeridas para tests de aislamiento

#### RE-APLICACIÓN (Si ya existen)

Si ya tienes policies o funciones aplicadas y necesitas actualizarlas:

1. **Re-aplicar RLS Policies** ✅ USA ESTE
   - Archivo: `prisma/migrations/apply-rls-policies-clean.sql`
   - Hace DROP de policies existentes antes de recrearlas
   - **Usa este si obtienes error "policy already exists"**

2. **Re-aplicar Funciones RPC** ✅ USA ESTE
   - Archivo: `prisma/migrations/apply-rls-query-functions-clean.sql`
   - Hace DROP de funciones existentes antes de recrearlas
   - **Usa este si obtienes error "cannot change return type"**

---

## Cómo Aplicar

### ✅ TU CASO (Ya tienes todo aplicado)

Ya tienes policies y funciones existentes. Usa los archivos `-clean` que hacen DROP primero:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a: **SQL Editor** → **New Query**
3. Copia y pega el contenido de cada archivo EN ORDEN:
   ```
   a. apply-rls-policies-clean.sql         ← DROP + CREATE policies
   b. rls-set-config-function.sql          ← Ya aplicado ✓
   c. apply-rls-query-functions-clean.sql  ← DROP + CREATE funciones
   ```
4. Ejecuta cada query con **RUN**
5. Verifica que no haya errores en el output

### Opción 1: Supabase Dashboard (Recomendado)

**Para setup inicial (primera vez):**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a: **SQL Editor** → **New Query**
3. Copia y pega el contenido de cada archivo EN ORDEN:
   ```
   a. rls-policies.sql
   b. rls-set-config-function.sql
   c. rls-query-functions.sql
   ```
4. Ejecuta cada query con **RUN**
5. Verifica que no haya errores en el output

### Opción 2: CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db push --db-url "postgresql://..."
```

---

## Verificación Post-Aplicación

### 1. Verificar que RLS está FORZADO

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'users');
```

**Esperado:** `rowsecurity = true` para ambas

### 2. Verificar Policies Creadas

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Esperado:** 8 policies (4 para tenants, 4 para users)

### 3. Verificar Funciones RPC Existen

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('set_tenant_context', 'query_users_with_tenant', 'query_tenants_with_tenant');
```

**Esperado:** 3 funciones

---

## Ejecutar Test de Aislamiento

Una vez aplicadas todas las migrations:

```bash
npx tsx scripts/test-rls-isolation.ts
```

**Output esperado:**
```
🧪 Iniciando test de aislamiento RLS...
...
✅ TODOS LOS TESTS DE AISLAMIENTO RLS PASARON
```

---

## Rollback (Si algo sale mal)

### Eliminar Funciones

```sql
DROP FUNCTION IF EXISTS query_users_with_tenant(UUID);
DROP FUNCTION IF EXISTS query_tenants_with_tenant(UUID);
DROP FUNCTION IF EXISTS set_tenant_context(text);
```

### Eliminar Policies

```sql
DROP POLICY IF EXISTS tenant_isolation_tenants_select ON tenants;
DROP POLICY IF EXISTS tenant_isolation_tenants_insert ON tenants;
DROP POLICY IF EXISTS tenant_isolation_tenants_update ON tenants;
DROP POLICY IF EXISTS tenant_isolation_tenants_delete ON tenants;

DROP POLICY IF EXISTS tenant_isolation_users_select ON users;
DROP POLICY IF EXISTS tenant_isolation_users_insert ON users;
DROP POLICY IF EXISTS tenant_isolation_users_update ON users;
DROP POLICY IF EXISTS tenant_isolation_users_delete ON users;
```

### Deshabilitar RLS

```sql
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## Problemas Comunes

### Error: "function set_config already exists"

**Causa:** Versión antigua de la función existe
**Solución:** Ejecutar primero:
```sql
DROP FUNCTION IF EXISTS set_config(text, text, boolean);
```

### Error: "permission denied for function"

**Causa:** Permisos no aplicados correctamente
**Solución:** Re-ejecutar los GRANT statements:
```sql
GRANT EXECUTE ON FUNCTION set_tenant_context(text) TO service_role;
GRANT EXECUTE ON FUNCTION set_tenant_context(text) TO anon;
-- etc...
```

### Test falla con "function does not exist"

**Causa:** Funciones RPC no aplicadas
**Solución:** Aplicar `rls-query-functions.sql` manualmente

---

## Notas de Seguridad

- ✅ RLS está **FORZADO** - incluso service_role debe respetar policies
- ✅ Cliente usa **anon key** - no bypassa RLS
- ✅ Validación de UUID - previene injection
- ✅ Funciones con **SECURITY DEFINER** - ejecutan con permisos del creador

**CRÍTICO:** Nunca uses service_role key para queries de aplicación.
