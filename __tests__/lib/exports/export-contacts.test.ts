/**
 * Tests for Contacts Export Handler
 * Story 2.9: Exportar Datos a CSV
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock csv-export module
vi.mock('@/lib/utils/csv-export', () => ({
  exportToCSV: vi.fn(),
}));

import { exportContactsToCSV } from '@/lib/exports/export-contacts';
import { exportToCSV } from '@/lib/utils/csv-export';

describe('Export Contacts Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls exportToCSV with correct filename without company', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    exportContactsToCSV(contacts);

    expect(exportToCSV).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'contactos',
      })
    );
  });

  it('includes company name in filename when provided', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts, 'Acme Corp');

    expect(exportToCSV).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'contactos-Acme_Corp',
      })
    );
  });

  it('sanitizes company name with special characters', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts, 'Peñaloza & Asociados S.A.');

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    // Should replace special chars with underscore
    expect(call.filename).toBe('contactos-Pe_aloza___Asociados_S_A_');
  });

  it('includes all required columns', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const headers = call.columns.map((c) => c.header);

    expect(headers).toContain('Nombre Completo');
    expect(headers).toContain('Email');
    expect(headers).toContain('Teléfono');
    expect(headers).toContain('Cargo');
    expect(headers).toContain('Estado');
    expect(headers).toContain('Contacto Principal');
    expect(headers).toContain('Contacto de Escalamiento');
    expect(headers).toContain('Fecha de Creación');
  });

  it('concatenates first and last name', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'María',
        last_name: 'García',
        email: 'maria@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const nombreColumn = call.columns.find((c) => c.header === 'Nombre Completo');

    expect(nombreColumn?.accessor(contacts[0])).toBe('María García');
  });

  it('maps is_active to Activo/Inactivo', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: false,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const estadoColumn = call.columns.find((c) => c.header === 'Estado');

    expect(estadoColumn?.accessor(contacts[0])).toBe('Activo');
    expect(estadoColumn?.accessor(contacts[1])).toBe('Inactivo');
  });

  it('maps is_primary_contact to Sí/No', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: true,
        is_escalation_contact: false,
        is_active: true,
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const primaryColumn = call.columns.find((c) => c.header === 'Contacto Principal');

    expect(primaryColumn?.accessor(contacts[0])).toBe('Sí');
    expect(primaryColumn?.accessor(contacts[1])).toBe('No');
  });

  it('maps is_escalation_contact to Sí/No', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: true,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const escalationColumn = call.columns.find(
      (c) => c.header === 'Contacto de Escalamiento'
    );

    expect(escalationColumn?.accessor(contacts[0])).toBe('Sí');
  });

  it('handles null phone and position as empty strings', () => {
    const contacts = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: null,
        position: null,
        is_primary_contact: false,
        is_escalation_contact: false,
        is_active: true,
      },
    ];

    exportContactsToCSV(contacts);

    const call = vi.mocked(exportToCSV).mock.calls[0][0];
    const phoneColumn = call.columns.find((c) => c.header === 'Teléfono');
    const cargoColumn = call.columns.find((c) => c.header === 'Cargo');

    expect(phoneColumn?.accessor(contacts[0])).toBe('');
    expect(cargoColumn?.accessor(contacts[0])).toBe('');
  });
});
