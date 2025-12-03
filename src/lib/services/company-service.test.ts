/**
 * Tests para company-service.ts
 *
 * @module lib/services/company-service.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deactivateCompany,
  ConflictError,
  NotFoundError,
} from './company-service';

// Mock de Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

const mockSupabaseClient = {
  from: mockFrom,
};

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('company-service', () => {
  const mockTenantId = '00000000-0000-0000-0000-000000000001';

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
      neq: mockNeq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });

    mockNeq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    mockOrder.mockReturnValue({
      eq: mockEq,
    });
  });

  describe('createCompany', () => {
    const validCompanyData = {
      name: 'Test Company',
      taxId: 'TAX123456',
      email: 'test@company.com',
      phone: '+52 55 1234 5678',
      address: 'Test Address',
      industry: 'Technology',
      paymentTermsDays: 30,
      riskLevel: 'medio' as const,
    };

    it('should create a company successfully', async () => {
      // No existe duplicado
      mockMaybeSingle.mockResolvedValueOnce({ data: null });

      // Insert exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'new-id', ...validCompanyData },
        error: null,
      });

      const result = await createCompany(validCompanyData, mockTenantId);

      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('name', 'Test Company');
    });

    it('should throw ConflictError if taxId already exists', async () => {
      // Existe duplicado
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'existing-id' },
      });

      await expect(createCompany(validCompanyData, mockTenantId))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getCompanies', () => {
    it('should return active companies by default', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', is_active: true },
        { id: '2', name: 'Company B', is_active: true },
      ];

      mockEq.mockResolvedValueOnce({
        data: mockCompanies,
        error: null,
      });

      const result = await getCompanies(mockTenantId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('invoice_count', 0);
    });

    it('should include inactive companies when includeInactive is true', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', is_active: true },
        { id: '2', name: 'Company B', is_active: false },
      ];

      // Sin filtro de is_active
      mockOrder.mockReturnValueOnce({
        data: mockCompanies,
        error: null,
      });

      const result = await getCompanies(mockTenantId, true);

      expect(result).toHaveLength(2);
    });
  });

  describe('getCompanyById', () => {
    it('should return company by ID', async () => {
      const mockCompany = {
        id: 'company-id',
        name: 'Test Company',
        is_active: true,
      };

      mockSingle.mockResolvedValueOnce({
        data: mockCompany,
        error: null,
      });

      const result = await getCompanyById('company-id', mockTenantId);

      expect(result).toHaveProperty('name', 'Test Company');
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(getCompanyById('non-existent', mockTenantId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      // Existe
      mockSingle.mockResolvedValueOnce({
        data: { id: 'company-id' },
        error: null,
      });

      // No hay duplicado de taxId
      mockMaybeSingle.mockResolvedValueOnce({ data: null });

      // Update exitoso
      mockSingle.mockResolvedValueOnce({
        data: { id: 'company-id', name: 'Updated Name' },
        error: null,
      });

      const result = await updateCompany(
        'company-id',
        { name: 'Updated Name', taxId: 'TAX123', paymentTermsDays: 30, riskLevel: 'bajo' },
        mockTenantId
      );

      expect(result).toHaveProperty('name', 'Updated Name');
    });

    it('should throw ConflictError if new taxId already exists', async () => {
      // Existe
      mockSingle.mockResolvedValueOnce({
        data: { id: 'company-id' },
        error: null,
      });

      // Hay duplicado de taxId
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'other-company' },
      });

      await expect(
        updateCompany(
          'company-id',
          { name: 'Test', taxId: 'DUPLICATE', paymentTermsDays: 30, riskLevel: 'bajo' },
          mockTenantId
        )
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deactivateCompany', () => {
    it('should deactivate company successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'company-id', is_active: false },
        error: null,
      });

      const result = await deactivateCompany('company-id', mockTenantId);

      expect(result).toHaveProperty('is_active', false);
    });

    it('should throw NotFoundError if company does not exist', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(deactivateCompany('non-existent', mockTenantId))
        .rejects.toThrow(NotFoundError);
    });
  });
});
