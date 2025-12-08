import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageDetailDialog } from '@/components/collections/message-detail-dialog';
import type { CollectionMessage } from '@/lib/services/message-service';

const createMockMessage = (overrides: Partial<CollectionMessage> = {}): CollectionMessage => ({
  id: 'msg-1',
  channel: 'email',
  subject: 'Test Subject',
  body: 'Test body content with multiple lines\nLine 2\nLine 3',
  deliveryStatus: 'sent',
  sentAt: '2025-12-05T10:00:00Z',
  deliveredAt: null,
  externalMessageId: 'resend-123',
  contact: {
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@example.com',
    phone: null,
  },
  ...overrides,
});

describe('MessageDetailDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  it('should render message subject as title', () => {
    render(<MessageDetailDialog message={createMockMessage()} {...defaultProps} />);

    expect(screen.getByText('Test Subject')).toBeInTheDocument();
  });

  it('should render "Mensaje sin asunto" when subject is null', () => {
    render(
      <MessageDetailDialog message={createMockMessage({ subject: null })} {...defaultProps} />
    );

    expect(screen.getByText('Mensaje sin asunto')).toBeInTheDocument();
  });

  it('should render contact name and email', () => {
    render(<MessageDetailDialog message={createMockMessage()} {...defaultProps} />);

    expect(screen.getByText(/Juan Perez/)).toBeInTheDocument();
    expect(screen.getByText(/juan@example.com/)).toBeInTheDocument();
  });

  it('should render message body', () => {
    render(<MessageDetailDialog message={createMockMessage()} {...defaultProps} />);

    expect(
      screen.getByText(/Test body content with multiple lines/)
    ).toBeInTheDocument();
  });

  it('should render external message id when present', () => {
    render(<MessageDetailDialog message={createMockMessage()} {...defaultProps} />);

    expect(screen.getByText('resend-123')).toBeInTheDocument();
  });

  it('should not render external message id when null', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ externalMessageId: null })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('ID externo:')).not.toBeInTheDocument();
  });

  it('should render delivery date when delivered', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveredAt: '2025-12-05T10:05:00Z' })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Fecha entrega:')).toBeInTheDocument();
  });

  it('should not render delivery date when not delivered', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveredAt: null })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('Fecha entrega:')).not.toBeInTheDocument();
  });

  it('should show bounced alert for bounced messages', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveryStatus: 'bounced' })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('El mensaje no pudo ser entregado')).toBeInTheDocument();
  });

  it('should show failed alert for failed messages', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveryStatus: 'failed' })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('El envío falló')).toBeInTheDocument();
  });

  it('should not show alert for sent messages', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveryStatus: 'sent' })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('El mensaje no pudo ser entregado')).not.toBeInTheDocument();
    expect(screen.queryByText('El envío falló')).not.toBeInTheDocument();
  });

  it('should not show alert for delivered messages', () => {
    render(
      <MessageDetailDialog
        message={createMockMessage({ deliveryStatus: 'delivered' })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('El mensaje no pudo ser entregado')).not.toBeInTheDocument();
    expect(screen.queryByText('El envío falló')).not.toBeInTheDocument();
  });
});
