import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCollectionMessages } from '@/lib/services/message-service';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

describe('message-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Chain: .select(...).eq('tenant_id').eq('collection_id').order(...)
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
  });

  describe('getCollectionMessages', () => {
    it('should fetch messages with contact data', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          channel: 'email',
          subject: 'Test Subject',
          body: 'Test body content',
          delivery_status: 'sent',
          sent_at: '2025-12-05T10:00:00Z',
          delivered_at: null,
          external_message_id: 'resend-123',
          contact: {
            first_name: 'Juan',
            last_name: 'Perez',
            email: 'juan@example.com',
            phone: null,
          },
        },
      ];

      mockOrder.mockResolvedValue({ data: mockMessages, error: null });

      const result = await getCollectionMessages('collection-123', MOCK_TENANT_ID);

      expect(mockFrom).toHaveBeenCalledWith('sent_messages');
      expect(mockEq).toHaveBeenCalledWith('tenant_id', MOCK_TENANT_ID);
      expect(mockEq).toHaveBeenCalledWith('collection_id', 'collection-123');
      expect(mockOrder).toHaveBeenCalledWith('sent_at', { ascending: true });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
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
      });
    });

    it('should return empty array when no messages', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await getCollectionMessages('collection-456', MOCK_TENANT_ID);

      expect(result).toEqual([]);
    });

    it('should order messages by sent_at ASC', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          channel: 'email',
          subject: 'First',
          body: 'First message',
          delivery_status: 'sent',
          sent_at: '2025-12-01T10:00:00Z',
          delivered_at: null,
          external_message_id: 'resend-1',
          contact: {
            first_name: 'Juan',
            last_name: 'Perez',
            email: 'juan@example.com',
            phone: null,
          },
        },
        {
          id: 'msg-2',
          channel: 'email',
          subject: 'Second',
          body: 'Second message',
          delivery_status: 'delivered',
          sent_at: '2025-12-02T10:00:00Z',
          delivered_at: '2025-12-02T10:01:00Z',
          external_message_id: 'resend-2',
          contact: {
            first_name: 'Maria',
            last_name: 'Lopez',
            email: 'maria@example.com',
            phone: '+521234567890',
          },
        },
      ];

      mockOrder.mockResolvedValue({ data: mockMessages, error: null });

      const result = await getCollectionMessages('collection-123', MOCK_TENANT_ID);

      expect(result).toHaveLength(2);
      expect(result[0].subject).toBe('First');
      expect(result[1].subject).toBe('Second');
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database connection failed');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(getCollectionMessages('collection-123', MOCK_TENANT_ID)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle null data as empty array', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await getCollectionMessages('collection-123', MOCK_TENANT_ID);

      expect(result).toEqual([]);
    });
  });
});
