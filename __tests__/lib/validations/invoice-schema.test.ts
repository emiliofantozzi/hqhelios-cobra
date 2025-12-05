/**
 * Tests para invoice-schema validations
 * Story 3.4.1: UI Consistency - editInvoiceSchema
 *
 * @module __tests__/lib/validations/invoice-schema.test
 */
import { describe, it, expect } from 'vitest';
import {
  createInvoiceSchema,
  editInvoiceSchema,
  SUPPORTED_CURRENCIES,
  PAYMENT_STATUSES,
  type CreateInvoiceInput,
  type EditInvoiceInput,
} from '@/lib/validations/invoice-schema';

describe('createInvoiceSchema', () => {
  const validData: CreateInvoiceInput = {
    companyId: '123e4567-e89b-12d3-a456-426614174000',
    invoiceNumber: 'FAC-001',
    amount: 1500.00,
    currency: 'USD',
    issueDate: new Date('2025-01-01'),
    dueDate: new Date('2025-01-31'),
    paymentTermsDays: 30,
    paymentStatus: 'pendiente',
  };

  it('should validate correct invoice data', () => {
    const result = createInvoiceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID for companyId', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      companyId: 'invalid-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.companyId).toBeDefined();
    }
  });

  it('should reject empty invoiceNumber', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      invoiceNumber: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject unsupported currency', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      currency: 'GBP',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all supported currencies', () => {
    for (const currency of SUPPORTED_CURRENCIES) {
      const result = createInvoiceSchema.safeParse({
        ...validData,
        currency,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid payment statuses', () => {
    for (const status of PAYMENT_STATUSES) {
      const result = createInvoiceSchema.safeParse({
        ...validData,
        paymentStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject dueDate before issueDate', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      issueDate: new Date('2025-02-01'),
      dueDate: new Date('2025-01-15'),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dueDate).toBeDefined();
    }
  });

  it('should accept optional fields as undefined', () => {
    const result = createInvoiceSchema.safeParse({
      ...validData,
      projectedPaymentDate: undefined,
      description: undefined,
      notes: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe('editInvoiceSchema', () => {
  it('should allow partial updates (all fields optional)', () => {
    const result = editInvoiceSchema.safeParse({
      amount: 2000.00,
    });
    expect(result.success).toBe(true);
  });

  it('should NOT include paymentStatus field', () => {
    // editInvoiceSchema omite paymentStatus porque se gestiona via state machine
    const result = editInvoiceSchema.safeParse({
      paymentStatus: 'pagada',
    });
    // El campo debería ser ignorado (stripped) porque está omitido del schema
    expect(result.success).toBe(true);
    if (result.success) {
      // Verificar que paymentStatus no está en el resultado parseado
      expect((result.data as Record<string, unknown>).paymentStatus).toBeUndefined();
    }
  });

  it('should validate companyId as UUID when provided', () => {
    const result = editInvoiceSchema.safeParse({
      companyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should validate amount as positive when provided', () => {
    const result = editInvoiceSchema.safeParse({
      amount: -500,
    });
    expect(result.success).toBe(false);
  });

  it('should validate currency when provided', () => {
    const resultValid = editInvoiceSchema.safeParse({
      currency: 'MXN',
    });
    expect(resultValid.success).toBe(true);

    const resultInvalid = editInvoiceSchema.safeParse({
      currency: 'INVALID',
    });
    expect(resultInvalid.success).toBe(false);
  });

  it('should enforce dueDate >= issueDate refinement when both provided', () => {
    const result = editInvoiceSchema.safeParse({
      issueDate: new Date('2025-02-01'),
      dueDate: new Date('2025-01-15'),
    });
    expect(result.success).toBe(false);
  });

  it('should allow dueDate without issueDate', () => {
    const result = editInvoiceSchema.safeParse({
      dueDate: new Date('2025-03-01'),
    });
    expect(result.success).toBe(true);
  });

  it('should allow issueDate without dueDate', () => {
    const result = editInvoiceSchema.safeParse({
      issueDate: new Date('2025-01-01'),
    });
    expect(result.success).toBe(true);
  });

  it('should validate paymentTermsDays range when provided', () => {
    const resultTooLow = editInvoiceSchema.safeParse({
      paymentTermsDays: 0,
    });
    expect(resultTooLow.success).toBe(false);

    const resultTooHigh = editInvoiceSchema.safeParse({
      paymentTermsDays: 400,
    });
    expect(resultTooHigh.success).toBe(false);

    const resultValid = editInvoiceSchema.safeParse({
      paymentTermsDays: 60,
    });
    expect(resultValid.success).toBe(true);
  });

  it('should accept full edit payload without paymentStatus', () => {
    const fullEdit: EditInvoiceInput = {
      companyId: '123e4567-e89b-12d3-a456-426614174000',
      invoiceNumber: 'FAC-002-EDITED',
      amount: 3500.50,
      currency: 'EUR',
      issueDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      paymentTermsDays: 30,
      projectedPaymentDate: new Date('2025-02-20'),
      description: 'Servicios de consultoría actualizado',
      notes: 'Notas internas actualizadas',
    };

    const result = editInvoiceSchema.safeParse(fullEdit);
    expect(result.success).toBe(true);
  });

  it('should allow empty string for description and notes', () => {
    const result = editInvoiceSchema.safeParse({
      description: '',
      notes: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject description over 500 characters', () => {
    const result = editInvoiceSchema.safeParse({
      description: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('should reject notes over 1000 characters', () => {
    const result = editInvoiceSchema.safeParse({
      notes: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
