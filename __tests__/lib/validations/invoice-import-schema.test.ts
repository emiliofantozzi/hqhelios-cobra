import { describe, it, expect } from 'vitest';
import {
  csvInvoiceRowSchema,
  csvImportSchema,
  validateCSVRows,
  REQUIRED_CSV_HEADERS,
  MAX_IMPORT_ROWS,
} from '@/lib/validations/invoice-import-schema';

describe('invoice-import-schema', () => {
  describe('csvInvoiceRowSchema', () => {
    it('validates a correct row', () => {
      const validRow = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'USD',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
        description: 'Servicios de consultoría',
      };

      const result = csvInvoiceRowSchema.safeParse(validRow);
      expect(result.success).toBe(true);
    });

    it('rejects empty company_tax_id', () => {
      const row = {
        company_tax_id: '',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'USD',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: -100,
        currency: 'USD',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('mayor a 0');
      }
    });

    it('rejects invalid currency', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'JPY',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('USD, MXN, EUR');
      }
    });

    it('rejects invalid date format', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'USD',
        issue_date: '01/15/2025', // Wrong format
        due_date: '2025-02-15',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('YYYY-MM-DD');
      }
    });

    it('rejects due_date before issue_date', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'USD',
        issue_date: '2025-02-15',
        due_date: '2025-01-15', // Before issue_date
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('>= fecha de emisión');
      }
    });

    it('allows empty description', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        currency: 'USD',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
        description: '',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(true);
    });

    it('defaults currency to USD', () => {
      const row = {
        company_tax_id: 'RFC-123',
        invoice_number: 'FAC-001',
        amount: 1500.0,
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
      };

      const result = csvInvoiceRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
      }
    });
  });

  describe('csvImportSchema', () => {
    it('validates array of correct rows', () => {
      const rows = [
        {
          company_tax_id: 'RFC-123',
          invoice_number: 'FAC-001',
          amount: 1500.0,
          currency: 'USD',
          issue_date: '2025-01-15',
          due_date: '2025-02-15',
        },
        {
          company_tax_id: 'RFC-456',
          invoice_number: 'FAC-002',
          amount: 2500.0,
          currency: 'MXN',
          issue_date: '2025-01-20',
          due_date: '2025-02-20',
        },
      ];

      const result = csvImportSchema.safeParse(rows);
      expect(result.success).toBe(true);
    });

    it('rejects more than 1000 rows', () => {
      const rows = Array.from({ length: 1001 }, (_, i) => ({
        company_tax_id: `RFC-${i}`,
        invoice_number: `FAC-${i}`,
        amount: 100,
        currency: 'USD',
        issue_date: '2025-01-15',
        due_date: '2025-02-15',
      }));

      const result = csvImportSchema.safeParse(rows);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1000');
      }
    });
  });

  describe('validateCSVRows', () => {
    it('validates correct rows and returns isValid=true', () => {
      const rows = [
        {
          company_tax_id: 'RFC-123',
          invoice_number: 'FAC-001',
          amount: 1500.0,
          currency: 'USD',
          issue_date: '2025-01-15',
          due_date: '2025-02-15',
          description: 'Test',
        },
      ];

      const result = validateCSVRows(rows);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].errors).toHaveLength(0);
      expect(result[0].rowNumber).toBe(2); // Row 2 (after header)
    });

    it('detects duplicate invoice numbers within CSV', () => {
      const rows = [
        {
          company_tax_id: 'RFC-123',
          invoice_number: 'FAC-001',
          amount: 1500.0,
          currency: 'USD',
          issue_date: '2025-01-15',
          due_date: '2025-02-15',
        },
        {
          company_tax_id: 'RFC-456',
          invoice_number: 'FAC-001', // Duplicate
          amount: 2500.0,
          currency: 'MXN',
          issue_date: '2025-01-20',
          due_date: '2025-02-20',
        },
      ];

      const result = validateCSVRows(rows);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors).toContain('Número de factura duplicado en el archivo');
    });

    it('returns multiple errors for invalid row', () => {
      const rows = [
        {
          company_tax_id: '',
          invoice_number: '',
          amount: -100,
          currency: 'INVALID',
          issue_date: 'bad-date',
          due_date: 'bad-date',
        },
      ];

      const result = validateCSVRows(rows);
      expect(result[0].isValid).toBe(false);
      expect(result[0].errors.length).toBeGreaterThan(0);
    });

    it('preserves raw data even when validation fails', () => {
      const rows = [
        {
          company_tax_id: '',
          invoice_number: 'FAC-001',
          amount: 100,
          currency: 'USD',
          issue_date: '2025-01-15',
          due_date: '2025-02-15',
        },
      ];

      const result = validateCSVRows(rows);
      expect(result[0].rawData).toEqual(rows[0]);
    });
  });

  describe('constants', () => {
    it('has all required headers', () => {
      expect(REQUIRED_CSV_HEADERS).toContain('company_tax_id');
      expect(REQUIRED_CSV_HEADERS).toContain('invoice_number');
      expect(REQUIRED_CSV_HEADERS).toContain('amount');
      expect(REQUIRED_CSV_HEADERS).toContain('currency');
      expect(REQUIRED_CSV_HEADERS).toContain('issue_date');
      expect(REQUIRED_CSV_HEADERS).toContain('due_date');
      expect(REQUIRED_CSV_HEADERS).toContain('description');
    });

    it('has correct max rows limit', () => {
      expect(MAX_IMPORT_ROWS).toBe(1000);
    });
  });
});
