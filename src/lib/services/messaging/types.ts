/**
 * Message Service Types
 *
 * Defines the interface and types for message sending services.
 * Epic 3 uses MockMessageService; real implementations (SendGrid, Twilio)
 * will be added in Epic 4.
 */

/**
 * Supported message channels
 */
export type MessageChannel = 'email' | 'whatsapp';

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  /** Channel to send through (email or whatsapp) */
  channel: MessageChannel;
  /** Recipient address (email or phone number) */
  to: string;
  /** Email subject (only for email channel) */
  subject?: string;
  /** Message body content */
  body: string;
  /** Optional metadata for tracking */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a send message operation
 */
export interface SendMessageResult {
  /** Whether the message was sent successfully */
  success: boolean;
  /** Unique message ID if successful */
  messageId?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Message Service Interface
 *
 * All message service implementations must implement this interface.
 * This allows for easy swapping between mock and real implementations.
 */
export interface IMessageService {
  /**
   * Sends a message through the specified channel
   * @param params - Message parameters
   * @returns Promise with send result
   */
  send(params: SendMessageParams): Promise<SendMessageResult>;
}
