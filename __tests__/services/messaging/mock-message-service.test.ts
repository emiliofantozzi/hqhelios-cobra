/**
 * Tests for MockMessageService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockMessageService,
  messageService,
} from '@/lib/services/messaging/mock-message-service';

describe('MockMessageService', () => {
  describe('send()', () => {
    it('should return a result with success status', async () => {
      const service = new MockMessageService(1); // 100% success rate

      const result = await service.send({
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test message body',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^mock_\d+_[a-z0-9]+$/);
      expect(result.error).toBeUndefined();
    });

    it('should return failure when success rate is 0', async () => {
      const service = new MockMessageService(0); // 0% success rate

      const result = await service.send({
        channel: 'email',
        to: 'test@example.com',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
      expect(result.error).toBe('Simulated failure for testing');
    });

    it('should handle email channel', async () => {
      const service = new MockMessageService(1);

      const result = await service.send({
        channel: 'email',
        to: 'user@company.com',
        subject: 'Invoice Reminder',
        body: 'Please pay your invoice',
      });

      expect(result.success).toBe(true);
    });

    it('should handle whatsapp channel', async () => {
      const service = new MockMessageService(1);

      const result = await service.send({
        channel: 'whatsapp',
        to: '+5215512345678',
        body: 'WhatsApp message test',
      });

      expect(result.success).toBe(true);
    });

    it('should handle optional metadata', async () => {
      const service = new MockMessageService(1);

      const result = await service.send({
        channel: 'email',
        to: 'test@example.com',
        body: 'Test',
        metadata: {
          collectionId: 'col-123',
          invoiceId: 'inv-456',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should simulate network delay', async () => {
      const service = new MockMessageService(1);
      const start = Date.now();

      await service.send({
        channel: 'email',
        to: 'test@example.com',
        body: 'Test',
      });

      const elapsed = Date.now() - start;
      // Should take at least 50ms (minimum delay)
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton messageService', () => {
      expect(messageService).toBeDefined();
      expect(messageService.send).toBeDefined();
    });

    it('should be usable for sending messages', async () => {
      // Note: This may succeed or fail based on default 95% rate
      const result = await messageService.send({
        channel: 'email',
        to: 'test@example.com',
        body: 'Singleton test',
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
