/**
 * Invoice Service - Lógica de negocio para facturas
 * Story 2.5: Crear Facturas Manualmente
 *
 * @module lib/services/invoice-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { CreateInvoiceInput } from '@/lib/validations/invoice-schema';
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
