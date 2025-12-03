/**
 * Tests for CSV Export Utility - Format Functions
 * Story 2.9: Exportar Datos a CSV
 *
 * Note: Full browser download testing requires E2E tests.
 * This test validates CSV generation logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the formatCSVValue logic by examining the output
// Since exportToCSV uses browser APIs, we mock them

// Captured Blob content
let capturedContent: string = '';

// Mock browser APIs
const mockClick = vi.fn();
const mockSetAttribute = vi.fn();

beforeEach(() => {
  capturedContent = '';
  vi.clearAllMocks();

  // Mock URL APIs
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });

  // Mock Blob
  vi.stubGlobal(
    'Blob',
    class MockBlob {
      constructor(parts: BlobPart[]) {
        capturedContent = parts.join('');
      }
    }
  );

  // Mock document.createElement
  vi.stubGlobal('document', {
    createElement: vi.fn(() => ({
      setAttribute: mockSetAttribute,
      click: mockClick,
      style: {},
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Import module after mocking
import { exportToCSV } from '@/lib/utils/csv-export';

describe('CSV Export Utility', () => {
  describe('CSV Header Generation', () => {
    it('generates correct headers from columns config', () => {
      exportToCSV({
        data: [{ a: 1 }],
        filename: 'test',
        columns: [
          { header: 'Column A', accessor: (d) => d.a },
          { header: 'Column B', accessor: () => 'x' },
        ],
      });

      expect(capturedContent).toContain('Column A,Column B');
    });
  });

  describe('UTF-8 BOM', () => {
    it('includes BOM at start of content', () => {
      exportToCSV({
        data: [],
        filename: 'test',
        columns: [{ header: 'X', accessor: () => null }],
      });

      expect(capturedContent.startsWith('\uFEFF')).toBe(true);
    });
  });

  describe('Value Escaping', () => {
    it('escapes commas by wrapping in quotes', () => {
      exportToCSV({
        data: [{ name: 'Doe, John' }],
        filename: 'test',
        columns: [{ header: 'Name', accessor: (d) => d.name }],
      });

      expect(capturedContent).toContain('"Doe, John"');
    });

    it('escapes double quotes by doubling them', () => {
      exportToCSV({
        data: [{ text: 'Say "Hi"' }],
        filename: 'test',
        columns: [{ header: 'Text', accessor: (d) => d.text }],
      });

      expect(capturedContent).toContain('"Say ""Hi"""');
    });

    it('escapes newlines by wrapping in quotes', () => {
      exportToCSV({
        data: [{ notes: 'Line1\nLine2' }],
        filename: 'test',
        columns: [{ header: 'Notes', accessor: (d) => d.notes }],
      });

      expect(capturedContent).toContain('"Line1\nLine2"');
    });

    it('does not escape simple values', () => {
      exportToCSV({
        data: [{ value: 'SimpleText' }],
        filename: 'test',
        columns: [{ header: 'Value', accessor: (d) => d.value }],
      });

      const lines = capturedContent.replace('\uFEFF', '').split('\n');
      expect(lines[1]).toBe('SimpleText');
    });
  });

  describe('Null/Undefined Handling', () => {
    it('converts null to empty string', () => {
      exportToCSV({
        data: [{ field: null }],
        filename: 'test',
        columns: [{ header: 'Field', accessor: (d) => d.field }],
      });

      const lines = capturedContent.replace('\uFEFF', '').split('\n');
      expect(lines[1]).toBe('');
    });

    it('converts undefined to empty string', () => {
      exportToCSV({
        data: [{ field: undefined }],
        filename: 'test',
        columns: [{ header: 'Field', accessor: (d) => d.field }],
      });

      const lines = capturedContent.replace('\uFEFF', '').split('\n');
      expect(lines[1]).toBe('');
    });
  });

  describe('Special Characters', () => {
    it('preserves Spanish characters (ñ, á, é, etc.)', () => {
      exportToCSV({
        data: [{ name: 'Peñaloza', title: 'Gerente de Administración' }],
        filename: 'test',
        columns: [
          { header: 'Nombre', accessor: (d) => d.name },
          { header: 'Título', accessor: (d) => d.title },
        ],
      });

      expect(capturedContent).toContain('Peñaloza');
      expect(capturedContent).toContain('Gerente de Administración');
    });
  });

  describe('Multiple Rows', () => {
    it('generates all rows correctly', () => {
      exportToCSV({
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        filename: 'test',
        columns: [
          { header: 'ID', accessor: (d) => d.id },
          { header: 'Name', accessor: (d) => d.name },
        ],
      });

      const lines = capturedContent.replace('\uFEFF', '').split('\n');
      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toBe('ID,Name');
      expect(lines[1]).toBe('1,Alice');
      expect(lines[2]).toBe('2,Bob');
    });
  });

  describe('Empty Data', () => {
    it('generates only header row when data is empty', () => {
      exportToCSV({
        data: [],
        filename: 'test',
        columns: [{ header: 'Empty', accessor: (d: any) => d.x }],
      });

      const lines = capturedContent.replace('\uFEFF', '').split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Empty');
    });
  });

  describe('Download Trigger', () => {
    it('sets download attribute with filename and timestamp', () => {
      exportToCSV({
        data: [{ x: 1 }],
        filename: 'empresas',
        columns: [{ header: 'X', accessor: (d) => d.x }],
      });

      expect(mockSetAttribute).toHaveBeenCalledWith('href', 'blob:mock');
      expect(mockSetAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringMatching(/^empresas-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/)
      );
    });

    it('triggers click to download', () => {
      exportToCSV({
        data: [{ x: 1 }],
        filename: 'test',
        columns: [{ header: 'X', accessor: (d) => d.x }],
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });
});
