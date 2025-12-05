/**
 * Mock Message Service
 *
 * Mock implementation of IMessageService for Epic 3.
 * Logs messages to console without actually sending them.
 * Real implementations (SendGridService, TwilioService) will be added in Epic 4.
 */

import {
  IMessageService,
  SendMessageParams,
  SendMessageResult,
} from './types';

/**
 * Mock implementation of IMessageService for development and testing.
 * Simulates message sending with configurable success rate and delay.
 */
export class MockMessageService implements IMessageService {
  private successRate: number;

  /**
   * Creates a new MockMessageService instance
   * @param successRate - Probability of success (0-1), defaults to 0.95 (95%)
   */
  constructor(successRate = 0.95) {
    this.successRate = successRate;
  }

  /**
   * Simulates sending a message.
   * Logs to console and returns success/failure based on configured rate.
   *
   * @param params - Message parameters
   * @returns Promise with send result
   */
  async send(params: SendMessageParams): Promise<SendMessageResult> {
    // Simulate network delay (50-200ms)
    const delay = 50 + Math.random() * 150;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const success = Math.random() < this.successRate;
    const messageId = success
      ? `mock_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      : undefined;

    // Log message details for debugging
    console.log('[MockMessageService]', {
      timestamp: new Date().toISOString(),
      channel: params.channel,
      to: params.to,
      subject: params.subject,
      bodyPreview:
        params.body.substring(0, 100) + (params.body.length > 100 ? '...' : ''),
      success,
      messageId,
      delayMs: Math.round(delay),
    });

    return {
      success,
      messageId,
      error: success ? undefined : 'Simulated failure for testing',
    };
  }
}

/**
 * Singleton instance of MockMessageService.
 * Use this for consistent behavior across the application.
 */
export const messageService: IMessageService = new MockMessageService();
