# Deployment Configuration

## GitHub Repository

- **Repository**: [emiliofantozzi/hqhelios-cobra](https://github.com/emiliofantozzi/hqhelios-cobra)
- **Branch**: `master`
- **URL**: `https://github.com/emiliofantozzi/hqhelios-cobra.git`

## Vercel Deployment

### Project Information

| Property | Value |
|----------|-------|
| Project Name | `cobra-app` |
| Project ID | `prj_AZd7U0hOnsZfEz0CgS2oE8cRKtKr` |
| Team/Account | `emilios-projects-3cca1cd4` |
| Dashboard | [Vercel Project](https://vercel.com/emilios-projects-3cca1cd4/cobra-app) |

### Setup Instructions (Future)

1. **Connect GitHub Repository to Vercel**
   - Go to Vercel Dashboard > Project Settings > Git
   - Connect the `emiliofantozzi/hqhelios-cobra` repository
   - Set production branch to `master`

2. **Environment Variables**
   Configure the following in Vercel Dashboard > Project Settings > Environment Variables:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   # Clerk Authentication (Production)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   CLERK_SECRET_KEY=<your-clerk-secret-key>
   CLERK_WEBHOOK_SECRET=<your-clerk-webhook-secret>
   ```

3. **Clerk Webhook Configuration**
   - **Endpoint URL**: `https://app.hqhelios.com/api/webhooks/clerk`
   - **Endpoint ID**: `ep_36JxdqhQhk2tZJejIGJwFbP5Eg9`
   - **Events**: `user.created`, `user.updated`, `user.deleted`

4. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Deployment URLs

| Environment | URL Pattern |
|-------------|-------------|
| Production | `https://cobra-app.vercel.app` |
| Preview | `https://cobra-app-*-emilios-projects-3cca1cd4.vercel.app` |

### Branch Strategy

- `master` - Production deployments
- Feature branches - Preview deployments (automatic)

---

## Supabase Database Configuration

### Required SQL Functions

The following SQL must be executed in Supabase SQL Editor after initial setup:

#### 1. Tenant Context Function (Critical for Multi-tenancy)

```sql
-- Function to set tenant context for RLS
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- IMPORTANT: Use 'false' for session-level persistence
  -- 'true' only persists for current transaction (breaks in serverless)
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id, false);
  RETURN p_tenant_id;
END;
$$;

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION set_tenant_context(text) TO anon, authenticated, service_role;
```

**Why `false` instead of `true`?**
In serverless environments (Vercel + Supabase), each query may use a different connection from the pool. Using `true` (local to transaction) causes the setting to be lost between queries. Using `false` persists the setting for the session/connection.

#### 2. RLS Policies for Companies Table

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "tenant_isolation_select" ON companies
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Insert policy
CREATE POLICY "tenant_isolation_insert" ON companies
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Update policy
CREATE POLICY "tenant_isolation_update" ON companies
  FOR UPDATE USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Delete policy
CREATE POLICY "tenant_isolation_delete" ON companies
  FOR DELETE USING (tenant_id::text = current_setting('app.current_tenant_id', true));
```

#### 3. Tenants & Users Tables (Service Role Only)

These tables should NOT have restrictive INSERT/UPDATE/DELETE policies because:
- Tenant provisioning uses `service_role` key
- RLS with `service_role` bypasses all policies anyway
- Restrictive policies can interfere with provisioning flow

```sql
-- Ensure no restrictive policies exist
DROP POLICY IF EXISTS "tenant_isolation_insert" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_update" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON users;
DROP POLICY IF EXISTS "tenant_isolation_update" ON users;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON users;
```

### Troubleshooting: Error 500 on API Routes

If you encounter Error 500 on `/api/companies` or similar routes:

1. **Check if `set_tenant_context` function exists**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name = 'set_tenant_context';
   ```

2. **Verify the function uses `false` (not `true`)**
   ```sql
   SELECT prosrc FROM pg_proc WHERE proname = 'set_tenant_context';
   ```

3. **Check RLS is enabled but not too restrictive**
   ```sql
   SELECT tablename, policyname, cmd FROM pg_policies
   WHERE schemaname = 'public';
   ```

4. **Verify user/tenant exist**
   ```sql
   SELECT id, clerk_user_id, tenant_id FROM users
   WHERE clerk_user_id = '<clerk_user_id>';
   ```

---

*Last updated: 2025-12-03*
