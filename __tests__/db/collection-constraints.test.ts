import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client bypasses RLS for test setup
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

describe('Collection Partial Unique Index', () => {
  let testTenantId: string;
  let testCompanyId: string;
  let testContactId: string;
  let testInvoiceId: string;
  let testPlaybookId: string;

  beforeAll(async () => {
    // Create test tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Test Tenant Collections', slug: `test-collections-${Date.now()}` })
      .select()
      .single();
    testTenantId = tenant!.id;

    // Create test company
    const { data: company } = await supabase
      .from('companies')
      .insert({ tenant_id: testTenantId, name: 'Test Company', tax_id: `TAX-${Date.now()}` })
      .select()
      .single();
    testCompanyId = company!.id;

    // Create test contact
    const { data: contact } = await supabase
      .from('contacts')
      .insert({
        tenant_id: testTenantId,
        company_id: testCompanyId,
        first_name: 'Test',
        last_name: 'Contact',
        email: `test-${Date.now()}@test.com`,
      })
      .select()
      .single();
    testContactId = contact!.id;

    // Create test invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        tenant_id: testTenantId,
        company_id: testCompanyId,
        invoice_number: `INV-${Date.now()}`,
        amount: 1000,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single();
    testInvoiceId = invoice!.id;

    // Create test playbook
    const { data: playbook } = await supabase
      .from('playbooks')
      .insert({
        tenant_id: testTenantId,
        name: 'Test Playbook',
        trigger_type: 'on_due',
      })
      .select()
      .single();
    testPlaybookId = playbook!.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data in reverse order of dependencies
    await supabase.from('collections').delete().eq('tenant_id', testTenantId);
    await supabase.from('playbooks').delete().eq('tenant_id', testTenantId);
    await supabase.from('invoices').delete().eq('tenant_id', testTenantId);
    await supabase.from('contacts').delete().eq('tenant_id', testTenantId);
    await supabase.from('companies').delete().eq('tenant_id', testTenantId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  it('should allow creating first active collection for invoice', async () => {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        tenant_id: testTenantId,
        invoice_id: testInvoiceId,
        company_id: testCompanyId,
        primary_contact_id: testContactId,
        playbook_id: testPlaybookId,
        status: 'active',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.status).toBe('active');
  });

  it('should reject second active collection for same invoice', async () => {
    const { error } = await supabase
      .from('collections')
      .insert({
        tenant_id: testTenantId,
        invoice_id: testInvoiceId,
        company_id: testCompanyId,
        primary_contact_id: testContactId,
        playbook_id: testPlaybookId,
        status: 'active',
      })
      .select()
      .single();

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unique|duplicate/i);
  });

  it('should reject paused collection when active exists (non-terminal)', async () => {
    const { error } = await supabase
      .from('collections')
      .insert({
        tenant_id: testTenantId,
        invoice_id: testInvoiceId,
        company_id: testCompanyId,
        primary_contact_id: testContactId,
        playbook_id: testPlaybookId,
        status: 'paused',
      })
      .select()
      .single();

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unique|duplicate/i);
  });

  it('should allow completed collection alongside active (history)', async () => {
    // First update existing to completed
    await supabase
      .from('collections')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('tenant_id', testTenantId)
      .eq('invoice_id', testInvoiceId)
      .eq('status', 'active');

    // Create new active
    const { data, error } = await supabase
      .from('collections')
      .insert({
        tenant_id: testTenantId,
        invoice_id: testInvoiceId,
        company_id: testCompanyId,
        primary_contact_id: testContactId,
        playbook_id: testPlaybookId,
        status: 'active',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should allow multiple completed collections (full history)', async () => {
    // Complete current active
    await supabase
      .from('collections')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('tenant_id', testTenantId)
      .eq('invoice_id', testInvoiceId)
      .eq('status', 'active');

    // Count completed collections
    const { data, count } = await supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .eq('tenant_id', testTenantId)
      .eq('invoice_id', testInvoiceId)
      .eq('status', 'completed');

    expect(count).toBeGreaterThanOrEqual(2);
  });
});
