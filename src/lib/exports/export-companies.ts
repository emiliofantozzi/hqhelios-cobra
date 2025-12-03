/**
 * Export handler para empresas
 * Story 2.9: Exportar Datos a CSV
 *
 * @module lib/exports/export-companies
 */
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';

/**
 * Company data structure for export
 * Extended from CompanyRow to include all fields from API
 */
interface CompanyExport {
  id: string;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  risk_level: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Exports companies to CSV
 *
 * Columns exported:
 * - Nombre de Empresa
 * - RUT/NIF
 * - Email
 * - Teléfono
 * - Dirección
 * - Industria
 * - Nivel de Riesgo
 * - Estado (Activa/Inactiva)
 * - Fecha de Creación
 *
 * @param companies - Array of companies to export
 */
export function exportCompaniesToCSV(companies: CompanyExport[]): void {
  exportToCSV({
    data: companies,
    filename: 'empresas',
    columns: [
      {
        header: 'Nombre de Empresa',
        accessor: (c) => c.name,
      },
      {
        header: 'RUT/NIF',
        accessor: (c) => c.tax_id,
      },
      {
        header: 'Email',
        accessor: (c) => c.email || '',
      },
      {
        header: 'Teléfono',
        accessor: (c) => c.phone || '',
      },
      {
        header: 'Dirección',
        accessor: (c) => c.address || '',
      },
      {
        header: 'Industria',
        accessor: (c) => c.industry || '',
      },
      {
        header: 'Nivel de Riesgo',
        accessor: (c) => c.risk_level,
      },
      {
        header: 'Estado',
        accessor: (c) => (c.is_active ? 'Activa' : 'Inactiva'),
      },
      {
        header: 'Fecha de Creación',
        accessor: (c) => format(new Date(c.created_at), 'yyyy-MM-dd'),
      },
    ],
  });
}
