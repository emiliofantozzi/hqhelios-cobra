/**
 * Script para aplicar RLS a invoice_status_history
 * Story 2.6: Gestionar Estados de Facturas
 *
 * Ejecutar con: pnpm tsx scripts/apply-rls-invoice-status-history.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyRLS() {
  console.log('Applying RLS to invoice_status_history...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const rlsQueries = [
    // Enable and force RLS
    `ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE invoice_status_history FORCE ROW LEVEL SECURITY`,

    // SELECT policy
    `CREATE POLICY IF NOT EXISTS "tenant_isolation_invoice_status_history_select"
     ON invoice_status_history FOR SELECT
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,

    // INSERT policy
    `CREATE POLICY IF NOT EXISTS "tenant_isolation_invoice_status_history_insert"
     ON invoice_status_history FOR INSERT
     WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,

    // Comment
    `COMMENT ON TABLE invoice_status_history IS 'Historial de cambios de estado de facturas - APPEND ONLY (no update/delete)'`,
  ];

  for (const query of rlsQueries) {
    const { error } = await supabase.rpc('exec_sql', { sql: query });
    if (error) {
      // Try direct query if RPC doesn't exist
      console.log(`Query: ${query.substring(0, 50)}...`);
      console.log(`Note: RPC not available, RLS must be applied via Supabase Dashboard`);
    } else {
      console.log(`Applied: ${query.substring(0, 50)}...`);
    }
  }

  console.log('\nRLS policies applied (or need manual application via Supabase Dashboard)');
  console.log('SQL file available at: prisma/migrations/rls-policies-invoice-status-history.sql');
}

applyRLS().catch(console.error);
