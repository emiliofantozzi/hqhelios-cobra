/**
 * Export handler para contactos
 * Story 2.9: Exportar Datos a CSV
 *
 * @module lib/exports/export-contacts
 */
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils/csv-export';

/**
 * Contact data structure for export
 */
interface ContactExport {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  is_primary_contact: boolean;
  is_escalation_contact: boolean;
  is_active: boolean;
  created_at?: string;
}

/**
 * Exports contacts to CSV
 *
 * Columns exported:
 * - Nombre Completo
 * - Email
 * - Teléfono
 * - Cargo
 * - Estado (Activo/Inactivo)
 * - Contacto Principal (Sí/No)
 * - Contacto de Escalamiento (Sí/No)
 * - Fecha de Creación
 *
 * @param contacts - Array of contacts to export
 * @param companyName - Name of the company for filename
 */
export function exportContactsToCSV(
  contacts: ContactExport[],
  companyName?: string
): void {
  // Sanitize company name for filename (remove special chars)
  const sanitizedCompanyName = companyName
    ? `-${companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`
    : '';

  exportToCSV({
    data: contacts,
    filename: `contactos${sanitizedCompanyName}`,
    columns: [
      {
        header: 'Nombre Completo',
        accessor: (c) => `${c.first_name} ${c.last_name}`,
      },
      {
        header: 'Email',
        accessor: (c) => c.email,
      },
      {
        header: 'Teléfono',
        accessor: (c) => c.phone || '',
      },
      {
        header: 'Cargo',
        accessor: (c) => c.position || '',
      },
      {
        header: 'Estado',
        accessor: (c) => (c.is_active ? 'Activo' : 'Inactivo'),
      },
      {
        header: 'Contacto Principal',
        accessor: (c) => (c.is_primary_contact ? 'Sí' : 'No'),
      },
      {
        header: 'Contacto de Escalamiento',
        accessor: (c) => (c.is_escalation_contact ? 'Sí' : 'No'),
      },
      {
        header: 'Fecha de Creación',
        accessor: (c) =>
          c.created_at ? format(new Date(c.created_at), 'yyyy-MM-dd') : '',
      },
    ],
  });
}
