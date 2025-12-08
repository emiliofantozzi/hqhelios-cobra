/**
 * Tests for Resend Webhook API Endpoint
 *
 * Tests the webhook endpoint that receives Resend delivery status updates:
 * - Signature verification with svix
 * - Event mapping to delivery_status
 * - Database updates
 * - Idempotency handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Webhook class from svix
const mockVerify = vi.fn();
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}));

// Mock Supabase client
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
vi.mock('@/lib/db/supabase', () => ({
  getAdminSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: mockSelect,
        }),
      }),
    })),
  })),
}));

// Import after mocks are set up
import { POST } from '@/app/api/webhooks/resend/route';

describe('POST /api/webhooks/resend', () => {
  const validHeaders = {
    'svix-id': 'msg_123',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1,signature123',
  };

  const createRequest = (body: object, headers = validHeaders) => {
    const request = new Request('http://localhost/api/webhooks/resend', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers(headers),
    });
    return request;
  };

  const validEvent = {
    type: 'email.delivered',
    created_at: '2025-12-07T12:00:00Z',
    data: {
      email_id: 'resend_msg_abc123',
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Email',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerify.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockSelect.mockReset();

    // Set up environment
    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_test_secret');

    // Default successful update with 1 row affected
    mockSelect.mockResolvedValue({ data: [{ id: 'msg-123' }], error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('signature verification', () => {
    it('should return 400 for invalid signature', async () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createRequest(validEvent);
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid signature');
    });

    it('should process event when signature is valid', async () => {
      mockVerify.mockReturnValue(validEvent);

      const request = createRequest(validEvent);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockVerify).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when webhook secret is not configured', async () => {
      vi.stubEnv('RESEND_WEBHOOK_SECRET', '');

      const request = createRequest(validEvent);
      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Server configuration error');
    });

    it('should return 400 for invalid payload structure', async () => {
      // Valid signature but invalid payload (missing required fields)
      const invalidPayload = {
        type: 'email.delivered',
        // missing created_at and data.email_id
      };
      mockVerify.mockReturnValue(invalidPayload);

      const request = createRequest(invalidPayload);
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid payload');
    });

    it('should return 400 for unsupported event type in schema', async () => {
      // Valid structure but event type not in enum
      const unsupportedEvent = {
        type: 'email.opened', // not in our enum
        created_at: '2025-12-07T12:00:00Z',
        data: {
          email_id: 'test_123',
        },
      };
      mockVerify.mockReturnValue(unsupportedEvent);

      const request = createRequest(unsupportedEvent);
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid payload');
    });
  });

  describe('event mapping', () => {
    it('should map email.sent to sent status', async () => {
      const event = { ...validEvent, type: 'email.sent' };
      mockVerify.mockReturnValue(event);

      const request = createRequest(event);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          delivery_status: 'sent',
        })
      );
    });

    it('should map email.delivered to delivered status and set delivered_at', async () => {
      mockVerify.mockReturnValue(validEvent);

      const request = createRequest(validEvent);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          delivery_status: 'delivered',
          delivered_at: validEvent.created_at,
        })
      );
    });

    it('should map email.bounced to bounced status', async () => {
      const event = { ...validEvent, type: 'email.bounced' };
      mockVerify.mockReturnValue(event);

      const request = createRequest(event);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          delivery_status: 'bounced',
        })
      );
    });

    it('should map email.complained to failed status', async () => {
      const event = { ...validEvent, type: 'email.complained' };
      mockVerify.mockReturnValue(event);

      const request = createRequest(event);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          delivery_status: 'failed',
        })
      );
    });

    // NOTE: Unknown event types (email.clicked, email.opened) are now rejected
    // by Zod schema validation and return 400. This is correct behavior since
    // we explicitly define supported events. See 'should return 400 for
    // unsupported event type in schema' test in signature verification section.
  });

  describe('database update', () => {
    it('should update sent_messages by external_message_id', async () => {
      mockVerify.mockReturnValue(validEvent);

      const request = createRequest(validEvent);
      await POST(request);

      expect(mockEq).toHaveBeenCalledWith(
        'external_message_id',
        validEvent.data.email_id
      );
    });

    it('should include updated_at in update', async () => {
      mockVerify.mockReturnValue(validEvent);

      const request = createRequest(validEvent);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );
    });

    it('should return 200 OK even when message not found', async () => {
      mockVerify.mockReturnValue(validEvent);
      mockSelect.mockResolvedValue({
        data: [], // No rows updated
        error: null,
      });

      const request = createRequest(validEvent);
      const response = await POST(request);

      // Should return 200 for idempotency
      expect(response.status).toBe(200);
    });

    it('should return 200 OK even when database error occurs', async () => {
      mockVerify.mockReturnValue(validEvent);
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });

      const request = createRequest(validEvent);
      const response = await POST(request);

      // Should return 200 to avoid Resend retries
      expect(response.status).toBe(200);
    });
  });

  describe('idempotency', () => {
    it('should handle same event processed twice', async () => {
      mockVerify.mockReturnValue(validEvent);

      // First call
      const request1 = createRequest(validEvent);
      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // Second call with same event
      const request2 = createRequest(validEvent);
      const response2 = await POST(request2);
      expect(response2.status).toBe(200);

      // Both should succeed
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('not delivered events', () => {
    it('should not set delivered_at for sent events', async () => {
      const event = { ...validEvent, type: 'email.sent' };
      mockVerify.mockReturnValue(event);

      const request = createRequest(event);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          delivered_at: expect.any(String),
        })
      );
    });

    it('should not set delivered_at for bounced events', async () => {
      const event = { ...validEvent, type: 'email.bounced' };
      mockVerify.mockReturnValue(event);

      const request = createRequest(event);
      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          delivered_at: expect.any(String),
        })
      );
    });
  });
});
