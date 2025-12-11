import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client for setup (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to create tenant-scoped client using anon key (respects RLS)
async function createTenantClient(tenantId: string): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Set tenant context via RPC
  await client.rpc('set_tenant_context', { p_tenant_id: tenantId });
  return client;
}

describe('Collection RLS Isolation', () => {
  let tenantAId: string;
  let tenantBId: string;
  let collectionAId: string;
  let collectionBId: string;

  // Test data for tenant A
  let companyAId: string;
  let contactAId: string;
  let invoiceAId: string;
  let playbookAId: string;

  // Test data for tenant B
  let companyBId: string;
  let contactBId: string;
  let invoiceBId: string;
  let playbookBId: string;

  beforeAll(async () => {
    // Create Tenant A
    const { data: tenantA } = await adminClient
      .from('tenants')
      .insert({ name: 'Tenant A RLS Test', slug: `tenant-a-rls-${Date.now()}` })
      .select()
      .single();
    tenantAId = tenantA!.id;

    // Create Tenant B
    const { data: tenantB } = await adminClient
      .from('tenants')
      .insert({ name: 'Tenant B RLS Test', slug: `tenant-b-rls-${Date.now()}` })
      .select()
      .single();
    tenantBId = tenantB!.id;

    // Create test data for Tenant A
    const { data: companyA } = await adminClient
      .from('companies')
      .insert({ tenant_id: tenantAId, name: 'Company A', tax_id: `TAXA-${Date.now()}` })
      .select()
      .single();
    companyAId = companyA!.id;

    const { data: contactA } = await adminClient
      .from('contacts')
      .insert({
        tenant_id: tenantAId,
        company_id: companyAId,
        first_name: 'Contact',
        last_name: 'A',
        email: `contact-a-${Date.now()}@test.com`,
      })
      .select()
      .single();
    contactAId = contactA!.id;

    const { data: invoiceA } = await adminClient
      .from('invoices')
      .insert({
        tenant_id: tenantAId,
        company_id: companyAId,
        invoice_number: `INV-A-${Date.now()}`,
        amount: 1000,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single();
    invoiceAId = invoiceA!.id;

    const { data: playbookA } = await adminClient
      .from('playbooks')
      .insert({ tenant_id: tenantAId, name: 'Playbook A', trigger_type: 'on_due' })
      .select()
      .single();
    playbookAId = playbookA!.id;

    // Create test data for Tenant B
    const { data: companyB } = await adminClient
      .from('companies')
      .insert({ tenant_id: tenantBId, name: 'Company B', tax_id: `TAXB-${Date.now()}` })
      .select()
      .single();
    companyBId = companyB!.id;

    const { data: contactB } = await adminClient
      .from('contacts')
      .insert({
        tenant_id: tenantBId,
        company_id: companyBId,
        first_name: 'Contact',
        last_name: 'B',
        email: `contact-b-${Date.now()}@test.com`,
      })
      .select()
      .single();
    contactBId = contactB!.id;

    const { data: invoiceB } = await adminClient
      .from('invoices')
      .insert({
        tenant_id: tenantBId,
        company_id: companyBId,
        invoice_number: `INV-B-${Date.now()}`,
        amount: 2000,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single();
    invoiceBId = invoiceB!.id;

    const { data: playbookB } = await adminClient
      .from('playbooks')
      .insert({ tenant_id: tenantBId, name: 'Playbook B', trigger_type: 'on_due' })
      .select()
      .single();
    playbookBId = playbookB!.id;

    // Create collections for both tenants
    const { data: collectionA } = await adminClient
      .from('collections')
      .insert({
        tenant_id: tenantAId,
        invoice_id: invoiceAId,
        company_id: companyAId,
        primary_contact_id: contactAId,
        playbook_id: playbookAId,
        status: 'active',
      })
      .select()
      .single();
    collectionAId = collectionA!.id;

    const { data: collectionB } = await adminClient
      .from('collections')
      .insert({
        tenant_id: tenantBId,
        invoice_id: invoiceBId,
        company_id: companyBId,
        primary_contact_id: contactBId,
        playbook_id: playbookBId,
        status: 'active',
      })
      .select()
      .single();
    collectionBId = collectionB!.id;
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    await adminClient.from('collections').delete().eq('tenant_id', tenantAId);
    await adminClient.from('collections').delete().eq('tenant_id', tenantBId);
    await adminClient.from('playbooks').delete().eq('tenant_id', tenantAId);
    await adminClient.from('playbooks').delete().eq('tenant_id', tenantBId);
    await adminClient.from('invoices').delete().eq('tenant_id', tenantAId);
    await adminClient.from('invoices').delete().eq('tenant_id', tenantBId);
    await adminClient.from('contacts').delete().eq('tenant_id', tenantAId);
    await adminClient.from('contacts').delete().eq('tenant_id', tenantBId);
    await adminClient.from('companies').delete().eq('tenant_id', tenantAId);
    await adminClient.from('companies').delete().eq('tenant_id', tenantBId);
    await adminClient.from('tenants').delete().eq('id', tenantAId);
    await adminClient.from('tenants').delete().eq('id', tenantBId);
  });

  it('Tenant A cannot see Tenant B collections (SELECT isolation)', async () => {
    const clientA = await createTenantClient(tenantAId);

    const { data, error } = await clientA
      .from('collections')
      .select('*')
      .eq('id', collectionBId);

    expect(error).toBeNull();
    // RLS filters out Tenant B's collection - returns empty, not the row
    expect(data).toHaveLength(0);
  });

  it('With non-existent tenant context, anon cannot see any test collections', async () => {
    // Anon client with a non-existent tenant ID should not see any collections
    // This tests RLS isolation when tenant context doesn't match any data
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Set context to a UUID that doesn't exist as a tenant
    const nonExistentTenantId = '00000000-0000-0000-0000-000000000000';
    await anonClient.rpc('set_tenant_context', { p_tenant_id: nonExistentTenantId });

    // Check specifically for our test collections - they should not be visible
    const { data: dataA, error: errorA } = await anonClient
      .from('collections')
      .select('*')
      .eq('id', collectionAId);

    const { data: dataB, error: errorB } = await anonClient
      .from('collections')
      .select('*')
      .eq('id', collectionBId);

    expect(errorA).toBeNull();
    expect(errorB).toBeNull();
    // RLS blocks access when tenant context doesn't match
    expect(dataA).toHaveLength(0);
    expect(dataB).toHaveLength(0);
  });

  it('Service role can see all collections (bypasses RLS)', async () => {
    const { data, error } = await adminClient.from('collections').select('*');

    expect(error).toBeNull();
    // Service role bypasses RLS and sees both tenants' collections
    expect(data!.length).toBeGreaterThanOrEqual(2);
  });

  it('Tenant A cannot update Tenant B collection', async () => {
    const clientA = await createTenantClient(tenantAId);

    const { data, error } = await clientA
      .from('collections')
      .update({ status: 'paused' })
      .eq('id', collectionBId)
      .select();

    // RLS should filter out the row, so no rows updated
    expect(data).toHaveLength(0);
  });

  it('Tenant A cannot delete Tenant B collection', async () => {
    const clientA = await createTenantClient(tenantAId);

    const { data, error } = await clientA
      .from('collections')
      .delete()
      .eq('id', collectionBId)
      .select();

    // RLS should filter out the row, so no rows deleted
    expect(data).toHaveLength(0);

    // Verify collection B still exists
    const { data: verifyData } = await adminClient
      .from('collections')
      .select('*')
      .eq('id', collectionBId)
      .single();

    expect(verifyData).not.toBeNull();
  });
});
