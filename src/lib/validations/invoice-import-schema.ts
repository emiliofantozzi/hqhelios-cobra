import { z } from "zod";

/**
 * Schema para una fila individual del CSV de importación de facturas
 *
 * Validaciones:
 * - company_tax_id: Requerido, se valida existencia server-side
 * - invoice_number: Requerido, se valida unicidad server-side
 * - amount: Número positivo, máximo 2 decimales
 * - currency: Enum (USD, MXN, EUR)
 * - issue_date: Formato YYYY-MM-DD
 * - due_date: Formato YYYY-MM-DD, >= issue_date
 * - description: Opcional, max 500 caracteres
 */
export const csvInvoiceRowSchema = z
  .object({
    company_tax_id: z
      .string({
        required_error: "Tax ID de empresa es requerido",
      })
      .min(1, "Tax ID de empresa es requerido")
      .max(50, "Tax ID no puede exceder 50 caracteres")
      .trim(),

    invoice_number: z
      .string({
        required_error: "Número de factura es requerido",
      })
      .min(1, "Número de factura es requerido")
      .max(100, "Número de factura no puede exceder 100 caracteres")
      .trim(),

    amount: z
      .number({
        required_error: "Monto es requerido",
        invalid_type_error: "Monto debe ser un número",
      })
      .positive("Monto debe ser mayor a 0")
      .multipleOf(0.01, "Monto solo puede tener hasta 2 decimales"),

    currency: z
      .enum(["USD", "MXN", "EUR"], {
        errorMap: () => ({
          message: "Moneda no soportada. Use: USD, MXN, EUR",
        }),
      })
      .default("USD"),

    issue_date: z
      .string({
        required_error: "Fecha de emisión es requerida",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Fecha de emisión debe estar en formato YYYY-MM-DD"
      ),

    due_date: z
      .string({
        required_error: "Fecha de vencimiento es requerida",
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Fecha de vencimiento debe estar en formato YYYY-MM-DD"
      ),

    description: z
      .string()
      .max(500, "Descripción no puede exceder 500 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => new Date(data.due_date) >= new Date(data.issue_date), {
    message: "Fecha de vencimiento debe ser >= fecha de emisión",
    path: ["due_date"],
  });

/**
 * Schema para el array completo de filas (límite 1000)
 */
export const csvImportSchema = z.array(csvInvoiceRowSchema).max(1000, {
  message: "Máximo 1000 facturas por importación",
});

export type CSVInvoiceRow = z.infer<typeof csvInvoiceRowSchema>;
export type CSVImport = z.infer<typeof csvImportSchema>;

/**
 * Resultado de validación de una fila con información adicional
 */
export interface ValidatedRow {
  rowNumber: number; // 1-indexed (línea en CSV, considerando header)
  data: CSVInvoiceRow | null;
  rawData: Record<string, unknown>; // Datos originales sin transformar
  errors: string[];
  isValid: boolean;
}

/**
 * Valida un array de filas parseadas del CSV y retorna resultados detallados
 *
 * @param rows - Filas parseadas del CSV (ya transformadas con tipos correctos)
 * @returns Array de ValidatedRow con errores por fila
 */
export function validateCSVRows(rows: Record<string, unknown>[]): ValidatedRow[] {
  const results: ValidatedRow[] = [];
  const seenInvoiceNumbers = new Set<string>();

  rows.forEach((row, index) => {
    // +2 porque index es 0-based y CSV tiene header en fila 1
    const rowNumber = index + 2;
    const errors: string[] = [];

    // Validar con Zod
    const validation = csvInvoiceRowSchema.safeParse(row);

    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        errors.push(err.message);
      });
    }

    // Validar unicidad de invoice_number dentro del CSV
    const invoiceNumber = row.invoice_number as string | undefined;
    if (invoiceNumber) {
      if (seenInvoiceNumbers.has(invoiceNumber)) {
        errors.push("Número de factura duplicado en el archivo");
      } else {
        seenInvoiceNumbers.add(invoiceNumber);
      }
    }

    results.push({
      rowNumber,
      data: validation.success ? validation.data : null,
      rawData: row,
      errors,
      isValid: errors.length === 0 && validation.success,
    });
  });

  return results;
}

/**
 * Headers requeridos en el CSV
 */
export const REQUIRED_CSV_HEADERS = [
  "company_tax_id",
  "invoice_number",
  "amount",
  "currency",
  "issue_date",
  "due_date",
  "description",
] as const;

/**
 * Límite máximo de filas por importación
 */
export const MAX_IMPORT_ROWS = 1000;
