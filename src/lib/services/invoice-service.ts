/**
 * Invoice Service - Lógica de negocio para facturas
 * Story 2.5: Crear Facturas Manualmente
 * Story 2.6: Gestionar Estados de Facturas
 * Story 2.7: Importar Facturas desde CSV
 * Story 3.4.1: Editar Facturas
 *
 * @module lib/services/invoice-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { CreateInvoiceInput, EditInvoiceInput } from '@/lib/validations/invoice-schema';
import type { InvoiceStatusTransition } from '@/lib/validations/invoice-status-schema';
import {
  INVOICE_STATUS,
  isTransitionAllowed,
  type InvoiceStatus,
} from '@/lib/constants/invoice-status-transitions';
import { ConflictError, NotFoundError } from './company-service';

/**
 * Resultado de operación de creación de factura
 */
interface CreateInvoiceResult {
  success: boolean;
  invoice?: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    company: {
      id: string;
      name: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Crea una nueva factura en el sistema
 *
 * Validaciones de negocio:
 * 1. Verifica que la empresa esté activa
 * 2. Verifica que invoiceNumber sea único dentro del tenant
 * 3. Setea payment_status = 'pendiente' por defecto
 * 4. Asocia tenant_id del usuario autenticado
 *
 * @param tenantId - ID del tenant (obtenido del JWT)
 * @param data - Datos validados de la factura
 * @returns Resultado con factura creada o error
 */
export async function createInvoice(
  tenantId: string,
  data: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Verificar que la empresa esté activa y pertenezca al tenant
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, is_active')
    .eq('tenant_id', tenantId)
    .eq('id', data.companyId)
    .single();

  if (companyError || !company) {
    return {
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'La empresa seleccionada no existe',
      },
    };
  }

  if (!company.is_active) {
    return {
      success: false,
      error: {
        code: 'COMPANY_INACTIVE',
        message: 'No se pueden crear facturas para empresas inactivas',
      },
    };
  }

  // 2. Verificar que invoiceNumber sea único en el tenant
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('invoice_number', data.invoiceNumber)
    .maybeSingle();

  if (existingInvoice) {
    return {
      success: false,
      error: {
        code: 'DUPLICATE_INVOICE_NUMBER',
        message: `El número de factura ${data.invoiceNumber} ya existe`,
      },
    };
  }

  // 3. Crear la factura
  const { data: invoice, error: insertError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      company_id: data.companyId,
      invoice_number: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
      issue_date: data.issueDate.toISOString().split('T')[0], // YYYY-MM-DD
      due_date: data.dueDate.toISOString().split('T')[0],
      payment_terms_days: data.paymentTermsDays ?? 30,
      payment_status: data.paymentStatus ?? 'pendiente',
      projected_payment_date: data.projectedPaymentDate
        ? data.projectedPaymentDate.toISOString().split('T')[0]
        : null,
      confirmed_payment_date: data.confirmedPaymentDate
        ? data.confirmedPaymentDate.toISOString().split('T')[0]
        : null,
      description: data.description || null,
      notes: data.notes || null,
      is_active: true,
    })
    .select(
      `
      id,
      invoice_number,
      amount,
      currency,
      companies:company_id(id, name)
    `
    )
    .single();

  if (insertError) {
    console.error('Error creating invoice:', insertError);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Error al crear la factura. Intente nuevamente.',
      },
    };
  }

  console.log(
    `Invoice created: ${invoice.id} (${invoice.invoice_number}) for company ${company.name}`
  );

  // El join devuelve un objeto, no un array
  const companyData = invoice.companies as unknown as { id: string; name: string };

  return {
    success: true,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      company: {
        id: companyData.id,
        name: companyData.name,
      },
    },
  };
}

/**
 * Obtiene lista de empresas activas para el selector de facturas
 *
 * @param tenantId - ID del tenant
 * @returns Array de empresas activas con id y name
 */
export async function getActiveCompaniesForSelect(tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies for select:', error);
    return [];
  }

  return companies || [];
}

/**
 * Obtiene una factura por ID
 *
 * @param invoiceId - ID de la factura
 * @param tenantId - ID del tenant
 * @returns Promise con la factura
 * @throws {NotFoundError} Si la factura no existe
 */
export async function getInvoiceById(invoiceId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      companies:company_id(id, name, tax_id)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Invoice', invoiceId);
  }

  return data;
}

/**
 * Opciones para filtrar facturas
 */
interface GetInvoicesOptions {
  includeInactive?: boolean;
  companyId?: string;
}

/**
 * Obtiene todas las facturas del tenant
 *
 * @param tenantId - ID del tenant
 * @param options - Opciones de filtrado
 * @param options.includeInactive - Si incluir facturas inactivas (default: false)
 * @param options.companyId - Filtrar por empresa específica (opcional)
 * @returns Promise con lista de facturas
 */
export async function getInvoices(
  tenantId: string,
  options: GetInvoicesOptions = {}
) {
  const { includeInactive = false, companyId } = options;
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      companies:company_id(id, name)
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Story 2.6: Gestionar Estados de Facturas
// ============================================

/**
 * Resultado de actualización de estado
 */
interface UpdateStatusResult {
  success: boolean;
  invoice?: {
    id: string;
    paymentStatus: InvoiceStatus;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Actualiza el estado de una factura con validaciones de state machine
 *
 * Flujo:
 * 1. Verifica que factura existe y pertenece al tenant
 * 2. Valida transición permitida según state machine
 * 3. Actualiza invoice
 * 4. Crea registro en status_history
 *
 * @param invoiceId - ID de la factura
 * @param tenantId - ID del tenant (del JWT)
 * @param userId - Clerk User ID del usuario que hace el cambio
 * @param transition - Datos de la transición validados con Zod
 * @returns Resultado con factura actualizada o error
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  tenantId: string,
  userId: string,
  transition: InvoiceStatusTransition
): Promise<UpdateStatusResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Obtener factura actual del tenant
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, payment_status, issue_date')
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    return {
      success: false,
      error: {
        code: 'INVOICE_NOT_FOUND',
        message: 'Factura no encontrada',
      },
    };
  }

  const currentStatus = invoice.payment_status as InvoiceStatus;

  // 2. Validar transición permitida
  if (!isTransitionAllowed(currentStatus, transition.newStatus)) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `No se puede cambiar de "${currentStatus}" a "${transition.newStatus}"`,
      },
    };
  }

  // 3. Preparar datos de actualización según tipo de transición
  const updateData: Record<string, unknown> = {
    payment_status: transition.newStatus,
    updated_at: new Date().toISOString(),
  };

  const metadata: Record<string, unknown> = {};

  // Agregar campos específicos según transición
  if (transition.newStatus === INVOICE_STATUS.PAGADA && 'paymentReference' in transition) {
    updateData.payment_reference = transition.paymentReference;
    updateData.paid_date = transition.paidDate.toISOString().split('T')[0];
    metadata.payment_reference = transition.paymentReference;
    metadata.paid_date = transition.paidDate.toISOString().split('T')[0];
  }

  if (
    transition.newStatus === INVOICE_STATUS.FECHA_CONFIRMADA &&
    'confirmedPaymentDate' in transition
  ) {
    updateData.confirmed_payment_date = transition.confirmedPaymentDate.toISOString().split('T')[0];
    metadata.confirmed_payment_date = transition.confirmedPaymentDate.toISOString().split('T')[0];
  }

  // 4. Actualizar factura (con filtro de tenant)
  const { error: updateError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId);

  if (updateError) {
    console.error('Error updating invoice:', updateError);
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Error al actualizar la factura',
      },
    };
  }

  // 5. Crear registro en status_history
  const { error: historyError } = await supabase.from('invoice_status_history').insert({
    tenant_id: tenantId,
    invoice_id: invoiceId,
    old_status: currentStatus,
    new_status: transition.newStatus,
    changed_by: userId,
    note: transition.note || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  });

  if (historyError) {
    console.error('Error creating status history:', historyError);
    // No falla la operación si falla el historial, pero se logea
  }

  return {
    success: true,
    invoice: {
      id: invoiceId,
      paymentStatus: transition.newStatus,
    },
  };
}

/**
 * Obtiene el historial de cambios de estado de una factura
 *
 * @param invoiceId - ID de la factura
 * @param tenantId - ID del tenant
 * @returns Array de registros de historial ordenados DESC (más reciente primero)
 */
export async function getInvoiceStatusHistory(invoiceId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data: history, error } = await supabase
    .from('invoice_status_history')
    .select(
      `
      id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      note,
      metadata
    `
    )
    .eq('tenant_id', tenantId)
    .eq('invoice_id', invoiceId)
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Error fetching status history:', error);
    return [];
  }

  return history || [];
}

/**
 * Crea registro inicial en status_history al crear factura
 * Llamar después de crear la factura exitosamente
 *
 * @param invoiceId - ID de la factura recién creada
 * @param tenantId - ID del tenant
 * @param userId - Clerk User ID del creador
 */
export async function createInitialStatusHistory(
  invoiceId: string,
  tenantId: string,
  userId: string
): Promise<void> {
  const supabase = await getSupabaseClient(tenantId);

  const { error } = await supabase.from('invoice_status_history').insert({
    tenant_id: tenantId,
    invoice_id: invoiceId,
    old_status: null,
    new_status: INVOICE_STATUS.PENDIENTE,
    changed_by: userId,
    note: 'Factura creada',
  });

  if (error) {
    console.error('Error creating initial status history:', error);
    // No falla la operación principal
  }
}

// ============================================
// Story 3.4.1: Editar Facturas
// ============================================

/**
 * Resultado de operación de actualización de factura
 */
interface UpdateInvoiceResult {
  success: boolean;
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Actualiza una factura existente
 *
 * Validaciones de negocio:
 * 1. Verifica que la factura existe y pertenece al tenant
 * 2. Si se cambia companyId, verifica que la empresa esté activa
 * 3. Si se cambia invoiceNumber, verifica que sea único en el tenant
 * 4. No permite cambiar paymentStatus (usar updateInvoiceStatus)
 *
 * @param invoiceId - ID de la factura a actualizar
 * @param tenantId - ID del tenant (obtenido del JWT)
 * @param data - Datos validados con editInvoiceSchema
 * @returns Resultado con factura actualizada o error
 */
export async function updateInvoice(
  invoiceId: string,
  tenantId: string,
  data: EditInvoiceInput
): Promise<UpdateInvoiceResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Verificar que la factura existe y pertenece al tenant
  const { data: existingInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, invoice_number, company_id')
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .single();

  if (fetchError || !existingInvoice) {
    return {
      success: false,
      error: {
        code: 'INVOICE_NOT_FOUND',
        message: 'Factura no encontrada',
      },
    };
  }

  // 2. Si se cambia companyId, verificar que la empresa esté activa
  if (data.companyId && data.companyId !== existingInvoice.company_id) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, is_active')
      .eq('tenant_id', tenantId)
      .eq('id', data.companyId)
      .single();

    if (companyError || !company) {
      return {
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'La empresa seleccionada no existe',
        },
      };
    }

    if (!company.is_active) {
      return {
        success: false,
        error: {
          code: 'COMPANY_INACTIVE',
          message: 'No se pueden asignar facturas a empresas inactivas',
        },
      };
    }
  }

  // 3. Si se cambia invoiceNumber, verificar unicidad en el tenant
  if (data.invoiceNumber && data.invoiceNumber !== existingInvoice.invoice_number) {
    const { data: duplicateInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('invoice_number', data.invoiceNumber)
      .neq('id', invoiceId)
      .maybeSingle();

    if (duplicateInvoice) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_INVOICE_NUMBER',
          message: `El número de factura ${data.invoiceNumber} ya existe`,
        },
      };
    }
  }

  // 4. Preparar datos para actualización
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.companyId !== undefined) updateData.company_id = data.companyId;
  if (data.invoiceNumber !== undefined) updateData.invoice_number = data.invoiceNumber;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.issueDate !== undefined) updateData.issue_date = data.issueDate.toISOString().split('T')[0];
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate.toISOString().split('T')[0];
  if (data.paymentTermsDays !== undefined) updateData.payment_terms_days = data.paymentTermsDays;
  if (data.projectedPaymentDate !== undefined) {
    updateData.projected_payment_date = data.projectedPaymentDate
      ? data.projectedPaymentDate.toISOString().split('T')[0]
      : null;
  }
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  // 5. Actualizar factura
  const { error: updateError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId);

  if (updateError) {
    console.error('Error updating invoice:', updateError);
    return {
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Error al actualizar la factura',
      },
    };
  }

  const finalInvoiceNumber = data.invoiceNumber || existingInvoice.invoice_number;
  console.log(`Invoice updated: ${invoiceId} (${finalInvoiceNumber})`);

  return {
    success: true,
    invoice: {
      id: invoiceId,
      invoiceNumber: finalInvoiceNumber,
    },
  };
}

// ============================================
// Story 2.7: Importar Facturas desde CSV
// ============================================

import type { CSVInvoiceRow } from '@/lib/validations/invoice-import-schema';

/**
 * Resultado de importación masiva
 */
interface BulkImportResult {
  success: boolean;
  importedCount?: number;
  errors?: Array<{
    rowNumber: number;
    message: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Error de validación de reglas de negocio para una fila
 */
interface BusinessRuleError {
  rowNumber: number;
  errors: string[];
}

/**
 * Valida reglas de negocio server-side para las filas del CSV
 *
 * Validaciones:
 * 1. company_tax_id existe en tenant
 * 2. invoice_number único en tenant
 *
 * @param tenantId - ID del tenant
 * @param rows - Filas ya validadas por Zod
 * @returns Array de errores por fila (vacío si todo OK)
 */
export async function validateBusinessRules(
  tenantId: string,
  rows: CSVInvoiceRow[]
): Promise<BusinessRuleError[]> {
  const supabase = await getSupabaseClient(tenantId);
  const results: BusinessRuleError[] = [];

  // 1. Obtener todos los tax_ids únicos del CSV
  const taxIds = Array.from(new Set(rows.map((r) => r.company_tax_id)));

  // 2. Lookup de companies en batch (solo del tenant)
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, tax_id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .in('tax_id', taxIds);

  if (companiesError) {
    throw new Error('Error al validar empresas');
  }

  const taxIdToCompanyId = new Map(companies?.map((c) => [c.tax_id, c.id]) || []);

  // 3. Obtener todos los invoice_numbers ya existentes en el tenant
  const invoiceNumbers = rows.map((r) => r.invoice_number);

  const { data: existingInvoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('tenant_id', tenantId)
    .in('invoice_number', invoiceNumbers);

  if (invoicesError) {
    throw new Error('Error al validar facturas existentes');
  }

  const existingInvoiceNumbers = new Set(
    existingInvoices?.map((i) => i.invoice_number) || []
  );

  // 4. Validar cada fila
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 por header y 0-index
    const errors: string[] = [];

    // Validar company exists
    if (!taxIdToCompanyId.has(row.company_tax_id)) {
      errors.push(`Empresa con Tax ID '${row.company_tax_id}' no encontrada`);
    }

    // Validar invoice_number único
    if (existingInvoiceNumbers.has(row.invoice_number)) {
      errors.push(`Número de factura '${row.invoice_number}' ya existe`);
    }

    if (errors.length > 0) {
      results.push({ rowNumber, errors });
    }
  });

  return results;
}

/**
 * Importa facturas masivamente en una transacción
 *
 * Proceso:
 * 1. Re-valida reglas de negocio server-side
 * 2. Si todas válidas, hace batch insert
 * 3. Supabase batch insert es atómico (all-or-nothing)
 *
 * @param tenantId - ID del tenant
 * @param userId - Clerk User ID para status history
 * @param rows - Filas validadas del CSV
 * @returns Resultado con count de importadas o errores
 */
export async function bulkImportInvoices(
  tenantId: string,
  userId: string,
  rows: CSVInvoiceRow[]
): Promise<BulkImportResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Validar reglas de negocio
  const businessErrors = await validateBusinessRules(tenantId, rows);

  if (businessErrors.length > 0) {
    return {
      success: false,
      errors: businessErrors.map((e) => ({
        rowNumber: e.rowNumber,
        message: e.errors.join(', '),
      })),
    };
  }

  // 2. Obtener mapping tax_id → company_id (solo del tenant)
  const taxIds = Array.from(new Set(rows.map((r) => r.company_tax_id)));
  const { data: companies } = await supabase
    .from('companies')
    .select('id, tax_id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .in('tax_id', taxIds);

  const taxIdToCompanyId = new Map(companies?.map((c) => [c.tax_id, c.id]) || []);

  // 3. Preparar datos para batch insert
  const invoicesToInsert = rows.map((row) => ({
    tenant_id: tenantId,
    company_id: taxIdToCompanyId.get(row.company_tax_id)!,
    invoice_number: row.invoice_number,
    amount: row.amount,
    currency: row.currency,
    issue_date: row.issue_date,
    due_date: row.due_date,
    description: row.description || null,
    payment_status: 'pendiente',
    is_active: true,
  }));

  // 4. Batch insert (atómico en Supabase)
  const { data: insertedInvoices, error: insertError } = await supabase
    .from('invoices')
    .insert(invoicesToInsert)
    .select('id');

  if (insertError) {
    console.error('Error in bulk import:', insertError);
    return {
      success: false,
      error: {
        code: 'IMPORT_FAILED',
        message: 'Error al importar facturas. Ninguna fue creada.',
      },
    };
  }

  // 5. Crear registros de historial para todas las facturas
  if (insertedInvoices && insertedInvoices.length > 0) {
    const historyRecords = insertedInvoices.map((inv) => ({
      tenant_id: tenantId,
      invoice_id: inv.id,
      old_status: null,
      new_status: INVOICE_STATUS.PENDIENTE,
      changed_by: userId,
      note: 'Importada desde CSV',
    }));

    const { error: historyError } = await supabase
      .from('invoice_status_history')
      .insert(historyRecords);

    if (historyError) {
      console.error('Error creating bulk status history:', historyError);
      // No falla la operación principal
    }
  }

  console.log(`Bulk import: ${insertedInvoices?.length || 0} invoices imported for tenant ${tenantId}`);

  return {
    success: true,
    importedCount: insertedInvoices?.length || 0,
  };
}
