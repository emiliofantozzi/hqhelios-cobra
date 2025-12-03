/**
 * Tests for Invoices Export Handler
 * Story 2.9: Exportar Datos a CSV
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock csv-export module
vi.mock('@/lib/utils/csv-export', () => ({
  exportToCSV: vi.fn(),
}));

import { exportInvoicesToCSV } from '@/lib/exports/export-invoices';
import { exportToCSV } from '@/lib/utils/csv-export';

describe('Export Invoices Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls exportToCSV with correct filename', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
        description: 'Test invoice',
        created_at: '2025-01-01T00:00:00Z',
        companies: { name: 'Test Co' },
      },
    ];

    exportInvoicesToCSV(invoices);

    expect(exportToCSV).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'facturas',
      })
    );
  });

  it('includes all required columns', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
        companies: { name: 'Test Co' },
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const headers = call.columns.map((c) => c.header);

    expect(headers).toContain('Número de Factura');
    expect(headers).toContain('Empresa');
    expect(headers).toContain('Monto');
    expect(headers).toContain('Moneda');
    expect(headers).toContain('Fecha de Emisión');
    expect(headers).toContain('Fecha de Vencimiento');
    expect(headers).toContain('Estado');
    expect(headers).toContain('Descripción');
    expect(headers).toContain('Fecha de Creación');
  });

  it('formats amount with 2 decimal places', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1234.5,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const montoColumn = call.columns.find((c) => c.header === 'Monto');

    expect(montoColumn?.accessor(invoices[0])).toBe('1234.50');
  });

  it('extracts company name from nested object', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
        companies: { name: 'Acme Corporation' },
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const empresaColumn = call.columns.find((c) => c.header === 'Empresa');

    expect(empresaColumn?.accessor(invoices[0])).toBe('Acme Corporation');
  });

  it('handles missing company as empty string', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const empresaColumn = call.columns.find((c) => c.header === 'Empresa');

    expect(empresaColumn?.accessor(invoices[0])).toBe('');
  });

  it('handles null description as empty string', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        payment_status: 'pendiente',
        description: null,
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const descColumn = call.columns.find((c) => c.header === 'Descripción');

    expect(descColumn?.accessor(invoices[0])).toBe('');
  });

  it('formats dates correctly', () => {
    const invoices = [
      {
        id: '1',
        invoice_number: 'INV-001',
        amount: 1000,
        currency: 'USD',
        issue_date: '2025-03-15T00:00:00',
        due_date: '2025-04-15T00:00:00',
        payment_status: 'pendiente',
        created_at: '2025-03-01T00:00:00',
      },
    ];

    exportInvoicesToCSV(invoices);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const issueColumn = call.columns.find((c) => c.header === 'Fecha de Emisión');
    const dueColumn = call.columns.find((c) => c.header === 'Fecha de Vencimiento');
    const createdColumn = call.columns.find((c) => c.header === 'Fecha de Creación');

    // Dates should be formatted as YYYY-MM-DD
    expect(issueColumn?.accessor(invoices[0])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dueColumn?.accessor(invoices[0])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createdColumn?.accessor(invoices[0])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
