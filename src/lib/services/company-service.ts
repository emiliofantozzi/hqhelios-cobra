/**
 * Company Service - Lógica de negocio para empresas cliente
 *
 * @module lib/services/company-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { CompanyFormData } from '@/lib/validations/company-schema';

/**
 * Error personalizado para conflictos de negocio (409)
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Crea una nueva empresa cliente en el sistema.
 *
 * @param data - Datos de la empresa validados con Zod
 * @param tenantId - ID del tenant (UUID validado)
 * @returns Promise con la empresa creada
 * @throws {ConflictError} Si el taxId ya existe para este tenant
 *
 * @example
 * ```ts
 * const company = await createCompany({
 *   name: 'Acme Corp',
 *   taxId: 'RFC123456',
 *   email: 'contact@acme.com',
 *   paymentTermsDays: 30,
 *   riskLevel: 'medio'
 * }, tenantId);
 * ```
 */
export async function createCompany(data: CompanyFormData, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar duplicado de taxId (RLS filtra automáticamente por tenant)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('tax_id', data.taxId)
    .maybeSingle();

  if (existing) {
    throw new ConflictError('RFC/Tax ID ya registrado');
  }

  // Crear empresa (convertir empty strings a null)
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      tax_id: data.taxId,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      industry: data.industry || null,
      payment_terms_days: data.paymentTermsDays,
      risk_level: data.riskLevel,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw new Error(`Failed to create company: ${error.message}`);
  }

  console.log(`Company created successfully: ${company.id} (${company.name}) for tenant ${tenantId}`);
  return company;
}

/**
 * Error personalizado para recursos no encontrados (404)
 */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

/**
 * Obtiene todas las empresas del tenant con conteo de facturas.
 *
 * @param tenantId - ID del tenant (UUID validado)
 * @param includeInactive - Si incluir empresas inactivas (default: false)
 * @returns Promise con lista de empresas ordenadas por fecha de creación
 *
 * @example
 * ```ts
 * const companies = await getCompanies(tenantId);
 * const allCompanies = await getCompanies(tenantId, true);
 * ```
 */
export async function getCompanies(tenantId: string, includeInactive: boolean = false) {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching companies:', error);
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  // Agregar invoice_count = 0 por ahora (se actualizará cuando existan invoices)
  return (data || []).map((company) => ({
    ...company,
    invoice_count: 0,
  }));
}

/**
 * Obtiene una empresa por ID.
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa
 * @throws {NotFoundError} Si la empresa no existe
 */
export async function getCompanyById(companyId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Company', companyId);
  }

  return data;
}

/**
 * Actualiza una empresa existente.
 *
 * @param companyId - ID de la empresa
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa actualizada
 * @throws {NotFoundError} Si la empresa no existe
 * @throws {ConflictError} Si el taxId ya existe
 */
export async function updateCompany(
  companyId: string,
  data: Partial<CompanyFormData>,
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que existe
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .single();

  if (!existing) {
    throw new NotFoundError('Company', companyId);
  }

  // Si taxId cambió, verificar unicidad
  if (data.taxId) {
    const { data: duplicate } = await supabase
      .from('companies')
      .select('id')
      .eq('tax_id', data.taxId)
      .neq('id', companyId)
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError('RFC/Tax ID ya registrado');
    }
  }

  const { data: company, error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      tax_id: data.taxId,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      industry: data.industry || null,
      payment_terms_days: data.paymentTermsDays,
      risk_level: data.riskLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw new Error(`Failed to update company: ${error.message}`);
  }

  console.log(`Company updated: ${company.id} (${company.name})`);
  return company;
}

/**
 * Desactiva una empresa (soft delete).
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con la empresa desactivada
 * @throws {NotFoundError} Si la empresa no existe
 */
export async function deactivateCompany(companyId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data: company, error } = await supabase
    .from('companies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single();

  if (error || !company) {
    throw new NotFoundError('Company', companyId);
  }

  console.log(`Company deactivated: ${company.id} (${company.name})`);
  return company;
}
