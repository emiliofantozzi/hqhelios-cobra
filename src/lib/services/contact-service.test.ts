/**
 * Tests para contact-service.ts
 *
 * @module lib/services/contact-service.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createContact,
  getContactsByCompany,
  getContactById,
  updateContact,
  deactivateContact,
  ValidationError,
  NotFoundError,
} from './contact-service';

// Mock de Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('contact-service', () => {
  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockCompanyId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup chain mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      order: mockOrder,
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });

    mockOrder.mockReturnValue({
      order: mockOrder,
      data: [],
      error: null,
    });

    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  describe('createContact', () => {
    const validContactData = {
      companyId: mockCompanyId,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
      phone: '+52 55 1234 5678',
      position: 'Gerente',
      isPrimaryContact: true,
      isEscalationContact: false,
    };

    it('should create a contact successfully', async () => {
      // Company exists
      mockSingle.mockResolvedValueOnce({
        data: { id: mockCompanyId },
        error: null,
      });

      // Insert exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'new-contact-id', ...validContactData },
        error: null,
      });

      const result = await createContact(validContactData, mockTenantId);

      expect(result).toHaveProperty('id', 'new-contact-id');
      expect(result).toHaveProperty('firstName', 'Juan');
    });

    it('should throw ValidationError if company does not exist', async () => {
      // Company doesn't exist
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(createContact(validContactData, mockTenantId))
        .rejects.toThrow(ValidationError);
    });

    it('should call swap_primary_contact RPC when isPrimaryContact is true', async () => {
      // Company exists
      mockSingle.mockResolvedValueOnce({
        data: { id: mockCompanyId },
        error: null,
      });

      // Insert exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'new-contact-id', ...validContactData },
        error: null,
      });

      await createContact(validContactData, mockTenantId);

      expect(mockRpc).toHaveBeenCalledWith('swap_primary_contact', {
        p_company_id: mockCompanyId,
        p_new_primary_id: 'new-contact-id',
      });
    });
  });

  describe('getContactsByCompany', () => {
    it('should return contacts ordered by primary first', async () => {
      const mockContacts = [
        { id: '1', first_name: 'Primary', is_primary_contact: true },
        { id: '2', first_name: 'Escalation', is_escalation_contact: true },
        { id: '3', first_name: 'Normal', is_primary_contact: false },
      ];

      mockOrder.mockReturnValueOnce({
        order: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: mockContacts,
            error: null,
          }),
        }),
      });

      const result = await getContactsByCompany(mockCompanyId, mockTenantId);

      expect(result).toHaveLength(3);
    });
  });

  describe('getContactById', () => {
    it('should return contact by ID', async () => {
      const mockContact = {
        id: 'contact-id',
        first_name: 'Test',
        last_name: 'Contact',
      };

      mockSingle.mockResolvedValueOnce({
        data: mockContact,
        error: null,
      });

      const result = await getContactById('contact-id', mockTenantId);

      expect(result).toHaveProperty('first_name', 'Test');
    });

    it('should throw NotFoundError if contact does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(getContactById('non-existent', mockTenantId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      // Contact exists
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'contact-id',
          company_id: mockCompanyId,
          is_primary_contact: false,
          is_escalation_contact: false,
        },
        error: null,
      });

      // Update exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'contact-id', first_name: 'Updated' },
        error: null,
      });

      const result = await updateContact(
        'contact-id',
        { firstName: 'Updated' },
        mockTenantId
      );

      expect(result).toHaveProperty('first_name', 'Updated');
    });

    it('should throw NotFoundError if contact does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        updateContact('non-existent', { firstName: 'Test' }, mockTenantId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deactivateContact', () => {
    it('should deactivate contact successfully', async () => {
      // Contact exists and is not sole primary
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'contact-id',
          company_id: mockCompanyId,
          is_primary_contact: false,
        },
        error: null,
      });

      // Update exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'contact-id', is_active: false },
        error: null,
      });

      const result = await deactivateContact('contact-id', mockTenantId);

      expect(result).toHaveProperty('is_active', false);
    });

    it('should throw ValidationError if trying to deactivate sole primary contact', async () => {
      // Contact exists and is primary
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'contact-id',
          company_id: mockCompanyId,
          is_primary_contact: true,
        },
        error: null,
      });

      // Count returns 1 (sole primary)
      mockRpc.mockResolvedValueOnce({ data: 1 });

      await expect(deactivateContact('contact-id', mockTenantId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if contact does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(deactivateContact('non-existent', mockTenantId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Primary+Escalation allowed', () => {
    it('should allow a contact to be both primary and escalation', async () => {
      const contactData = {
        companyId: mockCompanyId,
        firstName: 'María',
        lastName: 'García',
        email: 'maria@empresa.com',
        isPrimaryContact: true,
        isEscalationContact: true, // Both true - allowed for PyMEs
      };

      // Company exists
      mockSingle.mockResolvedValueOnce({
        data: { id: mockCompanyId },
        error: null,
      });

      // Insert exitoso
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-id',
          is_primary_contact: true,
          is_escalation_contact: true,
        },
        error: null,
      });

      const result = await createContact(contactData, mockTenantId);

      // No debería lanzar error - ahora está permitido
      expect(result.is_primary_contact).toBe(true);
      expect(result.is_escalation_contact).toBe(true);
    });
  });
});
