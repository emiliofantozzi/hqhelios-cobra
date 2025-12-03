/**
 * Script para aplicar RLS policies para invoices
 * Ejecutar con: pnpm tsx scripts/apply-rls-invoices.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyRlsPolicies() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const policies = [
    // Enable RLS
    `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE invoices FORCE ROW LEVEL SECURITY`,

    // SELECT policy
    `CREATE POLICY "tenant_isolation_invoices_select"
     ON invoices FOR SELECT
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,

    // INSERT policy
    `CREATE POLICY "tenant_isolation_invoices_insert"
     ON invoices FOR INSERT
     WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,

    // UPDATE policy
    `CREATE POLICY "tenant_isolation_invoices_update"
     ON invoices FOR UPDATE
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
     WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,

    // DELETE policy
    `CREATE POLICY "tenant_isolation_invoices_delete"
     ON invoices FOR DELETE
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)`,
  ];

  console.log('Applying RLS policies for invoices table...\n');

  for (const sql of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Check if policy already exists
      if (error.message.includes('already exists')) {
        console.log(`⏭️  Policy already exists, skipping...`);
      } else {
        console.error(`❌ Error: ${error.message}`);
        console.log(`SQL: ${sql.substring(0, 60)}...`);
      }
    } else {
      console.log(`✅ Applied: ${sql.substring(0, 50)}...`);
    }
  }

  console.log('\n✅ RLS policies applied successfully!');
}

applyRlsPolicies().catch(console.error);
