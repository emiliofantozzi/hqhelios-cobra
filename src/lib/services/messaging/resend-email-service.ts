/**
 * Resend Email Service
 *
 * Sends transactional emails via Resend API with retry logic
 * and rate limit handling.
 */

import { Resend } from 'resend';
import { IMessageService, SendMessageParams, SendMessageResult } from './types';

/**
 * Email service implementation using Resend API.
 * Implements IMessageService interface for sending transactional emails.
 */
export class ResendEmailService implements IMessageService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;
  private maxRetries = 3;

  constructor() {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error('RESEND_FROM_EMAIL environment variable is required');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL;
    this.fromName = process.env.RESEND_FROM_NAME || 'Cobranzas';
  }

  /**
   * Sends an email via Resend API with retry logic for rate limiting.
   * @param params - Message parameters including channel, recipient, subject, body
   * @returns Promise with success status and message ID or error
   */
  async send(params: SendMessageParams): Promise<SendMessageResult> {
    if (params.channel !== 'email') {
      return { success: false, error: `Channel ${params.channel} not supported by ResendEmailService` };
    }

    const html = this.formatBodyAsHtml(params.body);

    // Idempotency key prevents duplicates on retry
    const idempotencyKey =
      params.metadata?.collectionId && params.metadata?.messageIndex !== undefined
        ? `${params.metadata.collectionId}-${params.metadata.messageIndex}`
        : undefined;

    let lastError: string = 'Max retries exceeded';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: params.to,
          subject: params.subject || 'Notificación de Cobranza',
          html,
          headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
        });

        if (error) {
          // Check for rate limit error - only retry on rate limits
          const isRateLimit =
            error.message?.toLowerCase().includes('rate') ||
            error.name === 'rate_limit_exceeded';

          if (isRateLimit && attempt < this.maxRetries) {
            await this.backoff(attempt);
            continue;
          }

          // Non-rate-limit error or max retries reached - fail immediately
          console.error(
            JSON.stringify({
              level: 'error',
              component: 'ResendEmailService',
              message: 'Send failed',
              to: params.to,
              subject: params.subject,
              attempt,
              error: error.message,
              metadata: params.metadata,
              timestamp: new Date().toISOString(),
            })
          );
          return { success: false, error: error.message };
        }

        // Success - log and return
        console.log(
          JSON.stringify({
            level: 'info',
            component: 'ResendEmailService',
            message: 'Email sent successfully',
            to: params.to,
            messageId: data?.id,
            attempt,
            timestamp: new Date().toISOString(),
          })
        );

        return { success: true, messageId: data?.id };
      } catch (err) {
        // Network or unexpected errors - retry if attempts remaining
        const errorMessage = err instanceof Error ? err.message : String(err);
        lastError = errorMessage;

        console.error(
          JSON.stringify({
            level: 'error',
            component: 'ResendEmailService',
            message: 'Send failed with exception',
            to: params.to,
            subject: params.subject,
            attempt,
            error: errorMessage,
            willRetry: attempt < this.maxRetries,
            metadata: params.metadata,
            timestamp: new Date().toISOString(),
          })
        );

        // If we have more attempts, wait and retry
        if (attempt < this.maxRetries) {
          await this.backoff(attempt);
          continue;
        }

        // Max retries reached - return error
        return { success: false, error: errorMessage };
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Converts plain text body to HTML with basic styling.
   * @param body - Plain text message body
   * @returns HTML formatted string
   */
  formatBodyAsHtml(body: string): string {
    const escapedBody = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${escapedBody}</div>`;
  }

  /**
   * Exponential backoff delay for rate limit retry.
   * @param attempt - Current attempt number (1-based)
   */
  private async backoff(attempt: number): Promise<void> {
    const delay = Math.pow(2, attempt - 1) * 1000;
    console.log(
      JSON.stringify({
        level: 'warn',
        component: 'ResendEmailService',
        message: `Rate limited, waiting ${delay}ms before retry`,
        attempt,
        timestamp: new Date().toISOString(),
      })
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
