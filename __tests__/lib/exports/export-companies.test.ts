/**
 * Tests for Companies Export Handler
 * Story 2.9: Exportar Datos a CSV
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock csv-export module
vi.mock('@/lib/utils/csv-export', () => ({
  exportToCSV: vi.fn(),
}));

import { exportCompaniesToCSV } from '@/lib/exports/export-companies';
import { exportToCSV } from '@/lib/utils/csv-export';

describe('Export Companies Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls exportToCSV with correct filename', () => {
    const companies = [
      {
        id: '1',
        name: 'Test Company',
        tax_id: 'TAX-123',
        email: 'test@test.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Tech',
        risk_level: 'medio',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportCompaniesToCSV(companies);

    expect(exportToCSV).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'empresas',
      })
    );
  });

  it('includes all required columns', () => {
    const companies = [
      {
        id: '1',
        name: 'Test Company',
        tax_id: 'TAX-123',
        email: null,
        phone: null,
        address: null,
        industry: null,
        risk_level: 'bajo',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportCompaniesToCSV(companies);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const headers = call.columns.map((c) => c.header);

    expect(headers).toContain('Nombre de Empresa');
    expect(headers).toContain('RUT/NIF');
    expect(headers).toContain('Email');
    expect(headers).toContain('Teléfono');
    expect(headers).toContain('Dirección');
    expect(headers).toContain('Industria');
    expect(headers).toContain('Nivel de Riesgo');
    expect(headers).toContain('Estado');
    expect(headers).toContain('Fecha de Creación');
  });

  it('maps is_active to Activa/Inactiva', () => {
    const companies = [
      {
        id: '1',
        name: 'Active Co',
        tax_id: 'TAX-1',
        email: null,
        phone: null,
        address: null,
        industry: null,
        risk_level: 'medio',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Inactive Co',
        tax_id: 'TAX-2',
        email: null,
        phone: null,
        address: null,
        industry: null,
        risk_level: 'medio',
        is_active: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportCompaniesToCSV(companies);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const estadoColumn = call.columns.find((c) => c.header === 'Estado');

    expect(estadoColumn?.accessor(companies[0])).toBe('Activa');
    expect(estadoColumn?.accessor(companies[1])).toBe('Inactiva');
  });

  it('handles null fields as empty strings', () => {
    const companies = [
      {
        id: '1',
        name: 'Test Co',
        tax_id: 'TAX-123',
        email: null,
        phone: null,
        address: null,
        industry: null,
        risk_level: 'medio',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportCompaniesToCSV(companies);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];

    const emailColumn = call.columns.find((c) => c.header === 'Email');
    const phoneColumn = call.columns.find((c) => c.header === 'Teléfono');

    expect(emailColumn?.accessor(companies[0])).toBe('');
    expect(phoneColumn?.accessor(companies[0])).toBe('');
  });

  it('formats date correctly', () => {
    const companies = [
      {
        id: '1',
        name: 'Test Co',
        tax_id: 'TAX-123',
        email: null,
        phone: null,
        address: null,
        industry: null,
        risk_level: 'medio',
        is_active: true,
        created_at: '2025-06-15T10:30:00Z',
      },
    ];

    exportCompaniesToCSV(companies);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const dateColumn = call.columns.find((c) => c.header === 'Fecha de Creación');

    expect(dateColumn?.accessor(companies[0])).toBe('2025-06-15');
  });
});
