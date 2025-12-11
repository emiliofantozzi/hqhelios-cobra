/**
 * Message Service Factory
 *
 * Exports a singleton message service based on environment configuration.
 * Uses MockMessageService for development/testing, ResendEmailService for production.
 */

import { IMessageService } from './types';
import { MockMessageService } from './mock-message-service';
import { ResendEmailService } from './resend-email-service';

/**
 * Creates the appropriate message service based on environment.
 * @returns IMessageService implementation
 */
function createMessageService(): IMessageService {
  // Use mock if no API key or explicitly requested
  if (!process.env.RESEND_API_KEY || process.env.USE_MOCK_MESSAGING === 'true') {
    console.log('[Messaging] Using MockMessageService');
    return new MockMessageService();
  }

  console.log('[Messaging] Using ResendEmailService');
  return new ResendEmailService();
}

/** Singleton message service instance */
export const messageService: IMessageService = createMessageService();

// Re-export types for convenience
export type { IMessageService, SendMessageParams, SendMessageResult, MessageChannel } from './types';
