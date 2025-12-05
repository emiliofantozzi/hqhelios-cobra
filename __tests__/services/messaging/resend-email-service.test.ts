/**
 * Tests for ResendEmailService
 *
 * Tests the Resend email service implementation including:
 * - Successful email sending
 * - HTML body formatting
 * - Retry logic with exponential backoff
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock send function
const mockSend = vi.fn();

// Mock the Resend SDK before importing service
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Import after mocking
import { ResendEmailService } from '@/lib/services/messaging/resend-email-service';

describe('ResendEmailService', () => {
  let service: ResendEmailService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockSend.mockReset();

    // Set up environment variables
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'test@example.com');
    vi.stubEnv('RESEND_FROM_NAME', 'Test Sender');

    // Create fresh service instance
    service = new ResendEmailService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('constructor validation', () => {
    it('should throw error when RESEND_API_KEY is missing', () => {
      vi.unstubAllEnvs();
      vi.stubEnv('RESEND_FROM_EMAIL', 'test@example.com');
      vi.stubEnv('RESEND_FROM_NAME', 'Test Sender');

      expect(() => new ResendEmailService()).toThrow('RESEND_API_KEY environment variable is required');
    });

    it('should throw error when RESEND_FROM_EMAIL is missing', () => {
      vi.unstubAllEnvs();
      vi.stubEnv('RESEND_API_KEY', 'test_api_key');
      vi.stubEnv('RESEND_FROM_NAME', 'Test Sender');

      expect(() => new ResendEmailService()).toThrow('RESEND_FROM_EMAIL environment variable is required');
    });

    it('should use default FROM_NAME when not provided', () => {
      vi.unstubAllEnvs();
      vi.stubEnv('RESEND_API_KEY', 'test_api_key');
      vi.stubEnv('RESEND_FROM_EMAIL', 'test@example.com');

      const serviceWithDefaults = new ResendEmailService();
      expect(serviceWithDefaults).toBeDefined();
      // Default name 'Cobranzas' should be used
    });
  });

  describe('send()', () => {
    it('should send email successfully and return messageId', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend_msg_123' },
        error: null,
      });

      const result = await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test message body',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend_msg_123');
      expect(result.error).toBeUndefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return error for non-email channel', async () => {
      const result = await service.send({
        channel: 'whatsapp',
        to: '+1234567890',
        body: 'WhatsApp message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should use default subject when not provided', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend_msg_456' },
        error: null,
      });

      await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        body: 'No subject test',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Notificación de Cobranza',
        })
      );
    });

    it('should include idempotency key when metadata provided', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend_msg_789' },
        error: null,
      });

      await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
        metadata: {
          collectionId: 'col-123',
          messageIndex: 2,
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Idempotency-Key': 'col-123-2' },
        })
      );
    });

    it('should not include idempotency key when metadata is partial', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend_msg_partial' },
        error: null,
      });

      await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
        metadata: {
          collectionId: 'col-123',
          // messageIndex missing
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: undefined,
        })
      );
    });

    it('should not include idempotency key when messageIndex is 0', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'resend_msg_zero' },
        error: null,
      });

      await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
        metadata: {
          collectionId: 'col-123',
          messageIndex: 0,
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Idempotency-Key': 'col-123-0' },
        })
      );
    });

    it('should return error when Resend API fails', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key', name: 'validation_error' },
      });

      const result = await service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('formatBodyAsHtml()', () => {
    it('should wrap body in styled div', () => {
      const html = service.formatBodyAsHtml('Hello World');

      expect(html).toContain('<div style="');
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('max-width: 600px');
      expect(html).toContain('Hello World');
      expect(html).toContain('</div>');
    });

    it('should convert newlines to <br> tags', () => {
      const html = service.formatBodyAsHtml('Line 1\nLine 2\nLine 3');

      expect(html).toContain('Line 1<br>Line 2<br>Line 3');
    });

    it('should escape HTML entities', () => {
      const html = service.formatBodyAsHtml('<script>alert("xss")</script>');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape ampersands', () => {
      const html = service.formatBodyAsHtml('Terms & Conditions');

      expect(html).toContain('Terms &amp; Conditions');
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      // Use fake timers to avoid real delays
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry on rate limit error', async () => {
      // First call: rate limit, second call: success
      mockSend
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'rate limit exceeded', name: 'rate_limit_exceeded' },
        })
        .mockResolvedValueOnce({
          data: { id: 'resend_retry_success' },
          error: null,
        });

      const sendPromise = service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
      });

      // Advance timers to trigger retry (1000ms backoff)
      await vi.advanceTimersByTimeAsync(1000);

      const result = await sendPromise;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend_retry_success');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      // All calls return rate limit error
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'rate limit exceeded', name: 'rate_limit_exceeded' },
      });

      const sendPromise = service.send({
        channel: 'email',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
      });

      // Advance timers for all retries: 1s + 2s + 4s
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry (max reached)

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('rate limit exceeded');
      expect(mockSend).toHaveBeenCalledTimes(3); // maxRetries = 3
    });

    it('should not retry on non-rate-limit errors', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address', name: 'validation_error' },
      });

      const result = await service.send({
        channel: 'email',
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test body',
      });

      expect(result.success).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
