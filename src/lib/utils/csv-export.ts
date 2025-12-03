/**
 * CSV Export Utility
 * Story 2.9: Exportar Datos a CSV
 *
 * Client-side CSV generation with UTF-8 BOM for Excel compatibility.
 *
 * @module lib/utils/csv-export
 */
import { format } from 'date-fns';

/**
 * Configuration for CSV export
 */
export interface ExportConfig<T> {
  /** Array of data to export */
  data: T[];

  /** Base filename (without extension) */
  filename: string;

  /** Column definitions */
  columns: Array<{
    /** Column header text */
    header: string;

    /** Function to extract value from row */
    accessor: (row: T) => string | number | null | undefined;
  }>;
}

/**
 * Formats a value for CSV output
 *
 * Rules:
 * - null/undefined → empty string
 * - Values with commas, quotes, or newlines → wrapped in quotes
 * - Quotes inside value → escaped as ""
 */
function formatCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If contains special characters, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Exports data to CSV file with UTF-8 BOM
 *
 * Features:
 * - UTF-8 with BOM for Excel compatibility
 * - Automatic escaping of commas, quotes, newlines
 * - Timestamp in filename
 * - Immediate browser download
 *
 * @param config - Export configuration
 *
 * @example
 * ```typescript
 * exportToCSV({
 *   data: companies,
 *   filename: 'empresas',
 *   columns: [
 *     { header: 'Nombre', accessor: (c) => c.name },
 *     { header: 'Tax ID', accessor: (c) => c.tax_id },
 *   ],
 * });
 * ```
 */
export function exportToCSV<T>(config: ExportConfig<T>): void {
  const { data, filename, columns } = config;

  // Build CSV header row
  const headers = columns.map((col) => col.header);

  // Build CSV data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = col.accessor(row);
      return formatCSVValue(value);
    })
  );

  // Combine headers + rows
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Trigger browser download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
}
