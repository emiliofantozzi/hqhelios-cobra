import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageTimeline, getDeliveryStatusBadge } from '@/components/collections/message-timeline';
import type { CollectionMessage } from '@/lib/services/message-service';

// Mock the dialog component
vi.mock('@/components/collections/message-detail-dialog', () => ({
  MessageDetailDialog: () => null,
}));

const createMockMessage = (overrides: Partial<CollectionMessage> = {}): CollectionMessage => ({
  id: 'msg-1',
  channel: 'email',
  subject: 'Test Subject',
  body: 'Test body content',
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

describe('MessageTimeline', () => {
  it('should render empty state when no messages', () => {
    render(<MessageTimeline messages={[]} />);
    expect(screen.getByText('No hay mensajes enviados')).toBeInTheDocument();
  });

  it('should render message items with subject', () => {
    const messages = [createMockMessage({ subject: 'Recordatorio de pago' })];

    render(<MessageTimeline messages={messages} />);

    expect(screen.getByText('Recordatorio de pago')).toBeInTheDocument();
  });

  it('should render message preview truncated to 100 chars', () => {
    const longBody = 'A'.repeat(150);
    const messages = [createMockMessage({ body: longBody })];

    render(<MessageTimeline messages={messages} />);

    // Preview should contain first 100 chars + "..."
    const preview = screen.getByText(/A{100}\.\.\./);
    expect(preview).toBeInTheDocument();
  });

  it('should render delivery status badge', () => {
    const messages = [createMockMessage({ deliveryStatus: 'sent' })];

    render(<MessageTimeline messages={messages} />);

    expect(screen.getByText('Enviado')).toBeInTheDocument();
  });

  it('should render multiple messages', () => {
    const messages = [
      createMockMessage({ id: 'msg-1', subject: 'First message' }),
      createMockMessage({ id: 'msg-2', subject: 'Second message' }),
    ];

    render(<MessageTimeline messages={messages} />);

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('should not show subject when null', () => {
    const messages = [createMockMessage({ subject: null })];

    render(<MessageTimeline messages={messages} />);

    // Should still render the body preview
    expect(screen.getByText('Test body content')).toBeInTheDocument();
  });
});

describe('getDeliveryStatusBadge', () => {
  it('should return Pendiente badge for pending status', () => {
    const { container } = render(getDeliveryStatusBadge('pending'));
    expect(container.textContent).toBe('Pendiente');
  });

  it('should return Enviado badge for sent status', () => {
    const { container } = render(getDeliveryStatusBadge('sent'));
    expect(container.textContent).toBe('Enviado');
  });

  it('should return Entregado badge for delivered status', () => {
    const { container } = render(getDeliveryStatusBadge('delivered'));
    expect(container.textContent).toBe('Entregado');
  });

  it('should return Rebotado badge for bounced status', () => {
    const { container } = render(getDeliveryStatusBadge('bounced'));
    expect(container.textContent).toBe('Rebotado');
  });

  it('should return Fallido badge for failed status', () => {
    const { container } = render(getDeliveryStatusBadge('failed'));
    expect(container.textContent).toBe('Fallido');
  });

  it('should return status as label for unknown status', () => {
    const { container } = render(getDeliveryStatusBadge('unknown_status'));
    expect(container.textContent).toBe('unknown_status');
  });
});
