/**
 * Tests para Invoice Status State Machine
 * Story 2.6: Gestionar Estados de Facturas
 */
import { describe, it, expect } from 'vitest';
import {
  INVOICE_STATUS,
  ALLOWED_TRANSITIONS,
  isTransitionAllowed,
  isTerminalStatus,
  STATUS_METADATA,
  ALL_INVOICE_STATUSES,
  TERMINAL_STATUSES,
} from './invoice-status-transitions';

describe('Invoice Status State Machine', () => {
  describe('isTransitionAllowed', () => {
    // Transiciones desde PENDIENTE
    it('allows pendiente → fecha_confirmada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.FECHA_CONFIRMADA)).toBe(
        true
      );
    });

    it('allows pendiente → pagada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.PAGADA)).toBe(true);
    });

    it('allows pendiente → escalada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.ESCALADA)).toBe(true);
    });

    it('allows pendiente → suspendida', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.SUSPENDIDA)).toBe(true);
    });

    it('allows pendiente → cancelada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.CANCELADA)).toBe(true);
    });

    // Transiciones desde FECHA_CONFIRMADA
    it('allows fecha_confirmada → pagada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.FECHA_CONFIRMADA, INVOICE_STATUS.PAGADA)).toBe(
        true
      );
    });

    it('disallows fecha_confirmada → pendiente', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.FECHA_CONFIRMADA, INVOICE_STATUS.PENDIENTE)).toBe(
        false
      );
    });

    // Transiciones desde ESCALADA (puede reactivar)
    it('allows escalada → pendiente (reactivar)', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.ESCALADA, INVOICE_STATUS.PENDIENTE)).toBe(true);
    });

    it('allows escalada → pagada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.ESCALADA, INVOICE_STATUS.PAGADA)).toBe(true);
    });

    // Transiciones desde SUSPENDIDA (puede reactivar)
    it('allows suspendida → pendiente (reactivar)', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.SUSPENDIDA, INVOICE_STATUS.PENDIENTE)).toBe(true);
    });

    it('allows suspendida → cancelada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.SUSPENDIDA, INVOICE_STATUS.CANCELADA)).toBe(true);
    });

    it('disallows suspendida → pagada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.SUSPENDIDA, INVOICE_STATUS.PAGADA)).toBe(false);
    });

    // Estados terminales - PAGADA
    it('disallows pagada → pendiente', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PAGADA, INVOICE_STATUS.PENDIENTE)).toBe(false);
    });

    it('disallows pagada → cancelada', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.PAGADA, INVOICE_STATUS.CANCELADA)).toBe(false);
    });

    it('disallows pagada → any state', () => {
      ALL_INVOICE_STATUSES.forEach((status) => {
        expect(isTransitionAllowed(INVOICE_STATUS.PAGADA, status)).toBe(false);
      });
    });

    // Estados terminales - CANCELADA
    it('disallows cancelada → pendiente', () => {
      expect(isTransitionAllowed(INVOICE_STATUS.CANCELADA, INVOICE_STATUS.PENDIENTE)).toBe(false);
    });

    it('disallows cancelada → any state', () => {
      ALL_INVOICE_STATUSES.forEach((status) => {
        expect(isTransitionAllowed(INVOICE_STATUS.CANCELADA, status)).toBe(false);
      });
    });
  });

  describe('isTerminalStatus', () => {
    it('returns true for pagada', () => {
      expect(isTerminalStatus(INVOICE_STATUS.PAGADA)).toBe(true);
    });

    it('returns true for cancelada', () => {
      expect(isTerminalStatus(INVOICE_STATUS.CANCELADA)).toBe(true);
    });

    it('returns false for pendiente', () => {
      expect(isTerminalStatus(INVOICE_STATUS.PENDIENTE)).toBe(false);
    });

    it('returns false for fecha_confirmada', () => {
      expect(isTerminalStatus(INVOICE_STATUS.FECHA_CONFIRMADA)).toBe(false);
    });

    it('returns false for escalada', () => {
      expect(isTerminalStatus(INVOICE_STATUS.ESCALADA)).toBe(false);
    });

    it('returns false for suspendida', () => {
      expect(isTerminalStatus(INVOICE_STATUS.SUSPENDIDA)).toBe(false);
    });
  });

  describe('STATUS_METADATA', () => {
    it('has metadata for all statuses', () => {
      ALL_INVOICE_STATUSES.forEach((status) => {
        expect(STATUS_METADATA[status]).toBeDefined();
        expect(STATUS_METADATA[status].label).toBeTruthy();
        expect(STATUS_METADATA[status].color).toBeTruthy();
        expect(STATUS_METADATA[status].icon).toBeTruthy();
        expect(STATUS_METADATA[status].description).toBeTruthy();
      });
    });

    it('has correct Spanish labels', () => {
      expect(STATUS_METADATA[INVOICE_STATUS.PENDIENTE].label).toBe('Pendiente');
      expect(STATUS_METADATA[INVOICE_STATUS.PAGADA].label).toBe('Pagada');
      expect(STATUS_METADATA[INVOICE_STATUS.CANCELADA].label).toBe('Cancelada');
    });
  });

  describe('ALLOWED_TRANSITIONS', () => {
    it('defines transitions for all statuses', () => {
      ALL_INVOICE_STATUSES.forEach((status) => {
        expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
        expect(Array.isArray(ALLOWED_TRANSITIONS[status])).toBe(true);
      });
    });

    it('terminal statuses have empty transitions', () => {
      TERMINAL_STATUSES.forEach((status) => {
        expect(ALLOWED_TRANSITIONS[status]).toHaveLength(0);
      });
    });
  });
});
