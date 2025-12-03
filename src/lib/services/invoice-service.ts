/**
 * Invoice Service - Lógica de negocio para facturas
 * Story 2.5: Crear Facturas Manualmente
 * Story 2.6: Gestionar Estados de Facturas
 *
 * @module lib/services/invoice-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { CreateInvoiceInput } from '@/lib/validations/invoice-schema';
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
      description: data.description || null,
      notes: data.notes || null,
      payment_status: 'pendiente',
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
    .eq('id', invoiceId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Invoice', invoiceId);
  }

  return data;
}

/**
 * Obtiene todas las facturas del tenant
 *
 * @param tenantId - ID del tenant
 * @param includeInactive - Si incluir facturas inactivas (default: false)
 * @returns Promise con lista de facturas
 */
export async function getInvoices(
  tenantId: string,
  includeInactive: boolean = false
) {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      companies:company_id(id, name)
    `
    )
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
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

  // 1. Obtener factura actual
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, payment_status, issue_date')
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

  // 4. Actualizar factura
  const { error: updateError } = await supabase
    .from('invoices')
    .update(updateData)
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
