'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import { CSVUploadZone } from '@/components/invoices/csv-upload-zone';
import { CSVPreviewTable } from '@/components/invoices/csv-preview-table';
import {
  validateCSVRows,
  type ValidatedRow,
} from '@/lib/validations/invoice-import-schema';

/**
 * Página: Importar Facturas desde CSV
 *
 * Flujo:
 * 1. Descargar template (opcional)
 * 2. Subir CSV
 * 3. Ver preview con validaciones
 * 4. Confirmar importación
 * 5. Navegar a lista de facturas
 */
export default function ImportInvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ rowNumber: number; errors: string[] }[]>([]);

  // Handler cuando se procesa el CSV
  function handleFileProcessed(rows: Record<string, unknown>[]) {
    setRawRows(rows);
    setServerErrors([]);
    const validated = validateCSVRows(rows);
    setValidatedRows(validated);
  }

  // Handler para confirmar importación
  async function handleConfirmImport() {
    setIsImporting(true);
    setShowConfirmDialog(false);

    try {
      const validRows = validatedRows
        .filter((r) => r.isValid)
        .map((r) => r.data);

      const response = await fetch('/api/invoices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Si hay errores de validación server-side, mostrarlos en la tabla
        if (result.invalidRows) {
          setServerErrors(result.invalidRows);
          // Merge server errors con validatedRows
          const updatedRows = validatedRows.map((row) => {
            const serverError = result.invalidRows.find(
              (e: { rowNumber: number }) => e.rowNumber === row.rowNumber
            );
            if (serverError) {
              return {
                ...row,
                isValid: false,
                errors: [...row.errors, ...serverError.errors],
              };
            }
            return row;
          });
          setValidatedRows(updatedRows);
        }
        throw new Error(result.error || 'Error al importar');
      }

      toast({
        title: 'Importación exitosa',
        description: result.message,
      });

      router.push('/invoices');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error en importación',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const hasErrors = validatedRows.some((r) => !r.isValid);

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Facturas
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Importar Facturas</h1>
            <p className="text-muted-foreground mt-2">
              Cargue facturas masivamente desde un archivo CSV
            </p>
          </div>

          <Button variant="outline" asChild>
            <a href="/api/invoices/import" download="facturas_template.csv">
              <Download className="mr-2 h-4 w-4" />
              Descargar Template
            </a>
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      {validatedRows.length === 0 && (
        <CSVUploadZone onFileProcessed={handleFileProcessed} />
      )}

      {/* Preview */}
      {validatedRows.length > 0 && (
        <div className="space-y-6">
          <CSVPreviewTable validatedRows={validatedRows} />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setRawRows([]);
                setValidatedRows([]);
                setServerErrors([]);
              }}
            >
              Subir otro archivo
            </Button>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={hasErrors || isImporting || validCount === 0}
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isImporting ? 'Importando...' : `Importar ${validCount} Facturas`}
            </Button>
          </div>

          {hasErrors && (
            <p className="text-sm text-red-600 text-center">
              Corrija los errores antes de importar
            </p>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de importar {validCount} facturas?
              <br />
              <br />
              Esta acción creará todas las facturas en el sistema con estado
              &quot;pendiente&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Confirmar Importación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
