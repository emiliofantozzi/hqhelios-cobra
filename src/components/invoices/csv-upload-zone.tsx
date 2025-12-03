'use client';

import { useCallback, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  REQUIRED_CSV_HEADERS,
  MAX_IMPORT_ROWS,
} from '@/lib/validations/invoice-import-schema';

interface CSVUploadZoneProps {
  onFileProcessed: (rows: Record<string, unknown>[]) => void;
  maxRows?: number;
}

/**
 * Zona de upload con drag & drop para archivos CSV
 *
 * - Acepta solo .csv
 * - Parsea con papaparse
 * - Valida headers requeridos
 * - Límite configurable de filas
 */
export function CSVUploadZone({
  onFileProcessed,
  maxRows = MAX_IMPORT_ROWS,
}: CSVUploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith('.csv')) {
        setError('Solo se permiten archivos .csv');
        return;
      }

      setIsProcessing(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          setIsProcessing(false);

          // Validar headers
          const headers = results.meta.fields || [];
          const missingHeaders = REQUIRED_CSV_HEADERS.filter(
            (h) => !headers.includes(h)
          );

          if (missingHeaders.length > 0) {
            setError(
              `Headers faltantes: ${missingHeaders.join(', ')}. Descargue el template para ver la estructura correcta.`
            );
            return;
          }

          // Validar límite de filas
          if (results.data.length > maxRows) {
            setError(`Máximo ${maxRows} facturas por importación`);
            return;
          }

          if (results.data.length === 0) {
            setError('El archivo está vacío');
            return;
          }

          // Transformar datos
          const transformedRows = (results.data as Record<string, string>[]).map((row) => ({
            company_tax_id: row.company_tax_id?.trim() || '',
            invoice_number: row.invoice_number?.trim() || '',
            amount: parseFloat(row.amount) || 0,
            currency: row.currency?.trim().toUpperCase() || 'USD',
            issue_date: row.issue_date?.trim() || '',
            due_date: row.due_date?.trim() || '',
            description: row.description?.trim() || '',
          }));

          onFileProcessed(transformedRows);
        },
        error: (parseError) => {
          setIsProcessing(false);
          setError(`Error al procesar el archivo: ${parseError.message}`);
        },
      });
    },
    [onFileProcessed, maxRows]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input para permitir seleccionar el mismo archivo de nuevo
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <>
              <FileText className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-lg font-medium">Procesando archivo...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {isDragActive
                  ? 'Suelte el archivo aquí'
                  : 'Arrastre un archivo CSV o haga click para seleccionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Máximo {maxRows} facturas por archivo
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
