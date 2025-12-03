'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ValidatedRow } from '@/lib/validations/invoice-import-schema';

interface CSVPreviewTableProps {
  validatedRows: ValidatedRow[];
  maxDisplay?: number;
}

/**
 * Tabla de preview de filas del CSV
 *
 * Muestra:
 * - Status (válida/error)
 * - Datos de cada columna
 * - Errores por fila
 */
export function CSVPreviewTable({
  validatedRows,
  maxDisplay = 50,
}: CSVPreviewTableProps) {
  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;

  const displayRows = validatedRows.slice(0, maxDisplay);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-green-700 border-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          {validCount} válidas
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="outline" className="text-red-700 border-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            {invalidCount} con errores
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          de {validatedRows.length} total
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Número</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => (
                <TableRow
                  key={row.rowNumber}
                  className={!row.isValid ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-mono text-xs">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.data?.company_tax_id || (row.rawData?.company_tax_id as string) || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.data?.invoice_number || (row.rawData?.invoice_number as string) || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.data?.amount?.toFixed(2) || (row.rawData?.amount as number)?.toFixed?.(2) || '-'}
                  </TableCell>
                  <TableCell>
                    {row.data?.currency || (row.rawData?.currency as string) || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.data?.issue_date || (row.rawData?.issue_date as string) || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.data?.due_date || (row.rawData?.due_date as string) || '-'}
                  </TableCell>
                  <TableCell>
                    {row.errors.length > 0 && (
                      <ul className="text-xs text-red-600 space-y-1">
                        {row.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {validatedRows.length > maxDisplay && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando primeras {maxDisplay} de {validatedRows.length} filas
        </p>
      )}
    </div>
  );
}
