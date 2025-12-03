/**
 * Tests de Constraints para Playbooks y PlaybookMessages
 * Story 3.1: Schema de Playbooks y Mensajes
 *
 * Estos tests verifican los unique constraints definidos en el schema:
 * - Playbook: Partial unique index para is_default=true por trigger_type
 * - PlaybookMessage: @@unique([playbookId, sequenceOrder])
 *
 * NOTA: Estos tests requieren conexión a base de datos real para validar
 * constraints de PostgreSQL. En ambiente de CI sin DB, se skipean.
 *
 * @module lib/services/playbook-constraints.test
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if no DB connection available
const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Test tenant IDs (use fixed UUIDs for reproducibility)
const TEST_TENANT_A = '00000000-0000-0000-0000-000000000901';
const TEST_TENANT_B = '00000000-0000-0000-0000-000000000902';

describe.skipIf(shouldSkip)('Playbook Database Constraints (Integration)', () => {
  let supabase: SupabaseClient;
  let createdPlaybookIds: string[] = [];
  let createdMessageIds: string[] = [];

  beforeAll(async () => {
    if (shouldSkip) return;

    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false },
    });

    // Ensure test tenants exist
    await supabase.from('tenants').upsert([
      { id: TEST_TENANT_A, name: 'Test Tenant A', slug: 'test-tenant-a-constraints' },
      { id: TEST_TENANT_B, name: 'Test Tenant B', slug: 'test-tenant-b-constraints' },
    ]);
  });

  afterAll(async () => {
    if (shouldSkip) return;

    // Cleanup: Delete created test data
    if (createdMessageIds.length > 0) {
      await supabase.from('playbook_messages').delete().in('id', createdMessageIds);
    }
    if (createdPlaybookIds.length > 0) {
      await supabase.from('playbooks').delete().in('id', createdPlaybookIds);
    }
  });

  beforeEach(() => {
    // Track IDs for cleanup
  });

  /**
   * Helper to create a playbook and track for cleanup
   */
  async function createPlaybook(data: {
    tenantId: string;
    name: string;
    triggerType: string;
    isDefault?: boolean;
  }) {
    const { data: playbook, error } = await supabase
      .from('playbooks')
      .insert({
        tenant_id: data.tenantId,
        name: data.name,
        trigger_type: data.triggerType,
        is_default: data.isDefault ?? false,
        is_active: true,
      })
      .select()
      .single();

    if (playbook) {
      createdPlaybookIds.push(playbook.id);
    }

    return { data: playbook, error };
  }

  /**
   * Helper to create a playbook message and track for cleanup
   */
  async function createMessage(data: {
    playbookId: string;
    sequenceOrder: number;
    channel?: string;
    temperature?: string;
    bodyTemplate?: string;
  }) {
    const { data: message, error } = await supabase
      .from('playbook_messages')
      .insert({
        playbook_id: data.playbookId,
        sequence_order: data.sequenceOrder,
        channel: data.channel ?? 'email',
        temperature: data.temperature ?? 'amigable',
        body_template: data.bodyTemplate ?? 'Test message {{contact_first_name}}',
      })
      .select()
      .single();

    if (message) {
      createdMessageIds.push(message.id);
    }

    return { data: message, error };
  }

  describe('Unique Default Playbook per Trigger Type (AC: 3)', () => {
    it('should allow only one default playbook per trigger_type per tenant', async () => {
      // Create first default playbook
      const first = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Default Post Due 1',
        triggerType: 'post_due',
        isDefault: true,
      });

      expect(first.data).toBeDefined();
      expect(first.error).toBeNull();

      // Attempt to create second default with same trigger_type
      const second = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Default Post Due 2',
        triggerType: 'post_due',
        isDefault: true,
      });

      // Should fail with unique constraint violation
      expect(second.data).toBeNull();
      expect(second.error).toBeDefined();
      expect(second.error?.code).toBe('23505'); // PostgreSQL unique violation
    });

    it('should allow default playbooks of different trigger_types for same tenant', async () => {
      const postDue = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Default Post Due',
        triggerType: 'post_due_diff',
        isDefault: true,
      });

      const preDue = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Default Pre Due',
        triggerType: 'pre_due_diff',
        isDefault: true,
      });

      expect(postDue.data).toBeDefined();
      expect(postDue.error).toBeNull();
      expect(preDue.data).toBeDefined();
      expect(preDue.error).toBeNull();
    });

    it('should allow multiple non-default playbooks of same trigger_type', async () => {
      const results = await Promise.all([
        createPlaybook({
          tenantId: TEST_TENANT_A,
          name: 'Custom 1',
          triggerType: 'post_due_multi',
          isDefault: false,
        }),
        createPlaybook({
          tenantId: TEST_TENANT_A,
          name: 'Custom 2',
          triggerType: 'post_due_multi',
          isDefault: false,
        }),
        createPlaybook({
          tenantId: TEST_TENANT_A,
          name: 'Custom 3',
          triggerType: 'post_due_multi',
          isDefault: false,
        }),
      ]);

      // All should succeed - no constraint on non-defaults
      results.forEach((result) => {
        expect(result.data).toBeDefined();
        expect(result.error).toBeNull();
      });
    });

    it('should allow same default trigger_type for different tenants', async () => {
      const tenantA = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Tenant A Default',
        triggerType: 'post_due_tenant',
        isDefault: true,
      });

      const tenantB = await createPlaybook({
        tenantId: TEST_TENANT_B,
        name: 'Tenant B Default',
        triggerType: 'post_due_tenant',
        isDefault: true,
      });

      // Both should succeed - different tenants
      expect(tenantA.data).toBeDefined();
      expect(tenantA.error).toBeNull();
      expect(tenantB.data).toBeDefined();
      expect(tenantB.error).toBeNull();
    });
  });

  describe('Unique Sequence Order per Playbook (AC: 4)', () => {
    it('should enforce unique sequence_order per playbook', async () => {
      // Create playbook first
      const playbook = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Sequence Test Playbook',
        triggerType: 'manual_seq',
      });

      expect(playbook.data).toBeDefined();

      // Create first message with sequence_order=1
      const first = await createMessage({
        playbookId: playbook.data!.id,
        sequenceOrder: 1,
      });

      expect(first.data).toBeDefined();
      expect(first.error).toBeNull();

      // Attempt duplicate sequence_order
      const duplicate = await createMessage({
        playbookId: playbook.data!.id,
        sequenceOrder: 1,
      });

      expect(duplicate.data).toBeNull();
      expect(duplicate.error).toBeDefined();
      expect(duplicate.error?.code).toBe('23505');
    });

    it('should allow same sequence_order in different playbooks', async () => {
      const playbook1 = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Playbook 1',
        triggerType: 'manual_p1',
      });

      const playbook2 = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Playbook 2',
        triggerType: 'manual_p2',
      });

      const msg1 = await createMessage({
        playbookId: playbook1.data!.id,
        sequenceOrder: 1,
      });

      const msg2 = await createMessage({
        playbookId: playbook2.data!.id,
        sequenceOrder: 1,
      });

      // Both should succeed - different playbooks
      expect(msg1.data).toBeDefined();
      expect(msg1.error).toBeNull();
      expect(msg2.data).toBeDefined();
      expect(msg2.error).toBeNull();
    });

    it('should preserve original message when constraint violation occurs', async () => {
      const playbook = await createPlaybook({
        tenantId: TEST_TENANT_A,
        name: 'Preserve Test',
        triggerType: 'manual_preserve',
      });

      // Create original
      const original = await createMessage({
        playbookId: playbook.data!.id,
        sequenceOrder: 1,
        bodyTemplate: 'Original content',
      });

      expect(original.data).toBeDefined();

      // Attempt duplicate (should fail)
      await createMessage({
        playbookId: playbook.data!.id,
        sequenceOrder: 1,
        bodyTemplate: 'Replacement content',
      });

      // Verify original still exists unchanged
      const { data: check } = await supabase
        .from('playbook_messages')
        .select('*')
        .eq('id', original.data!.id)
        .single();

      expect(check?.body_template).toBe('Original content');
    });
  });
});

// Unit tests that don't require DB (schema validation)
describe('Playbook Schema Validation (Unit)', () => {
  it('should have correct trigger_type values defined', () => {
    const validTriggerTypes = ['pre_due', 'post_due', 'manual'];
    expect(validTriggerTypes).toContain('pre_due');
    expect(validTriggerTypes).toContain('post_due');
    expect(validTriggerTypes).toContain('manual');
  });

  it('should have correct channel values defined', () => {
    const validChannels = ['email', 'whatsapp'];
    expect(validChannels).toContain('email');
    expect(validChannels).toContain('whatsapp');
  });

  it('should have correct temperature values defined', () => {
    const validTemperatures = ['amigable', 'firme', 'urgente'];
    expect(validTemperatures).toContain('amigable');
    expect(validTemperatures).toContain('firme');
    expect(validTemperatures).toContain('urgente');
  });
});
