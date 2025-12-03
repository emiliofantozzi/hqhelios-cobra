/**
 * Contact Service - Lógica de negocio para contactos de empresa
 *
 * @module lib/services/contact-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { ContactFormData, ContactUpdateData } from '@/lib/validations/contact-schema';

/**
 * Error para validaciones de negocio
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error para recursos no encontrados
 */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

/**
 * Crea un nuevo contacto para una empresa.
 *
 * @param data - Datos del contacto validados
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto creado
 * @throws {ValidationError} Si la empresa no existe
 */
export async function createContact(data: ContactFormData, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Validar que la empresa pertenece al tenant
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', data.companyId)
    .single();

  if (!company) {
    throw new ValidationError('Empresa no encontrada o no pertenece al tenant');
  }

  // Crear el contacto
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      tenant_id: tenantId,
      company_id: data.companyId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      position: data.position || null,
      is_primary_contact: data.isPrimaryContact,
      is_escalation_contact: data.isEscalationContact,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  // Si es primary, hacer swap atómico (desmarca otros)
  if (data.isPrimaryContact) {
    await supabase.rpc('swap_primary_contact', {
      p_company_id: data.companyId,
      p_new_primary_id: contact.id,
    });
  }

  // Si es escalation, hacer swap atómico
  if (data.isEscalationContact) {
    await supabase.rpc('swap_escalation_contact', {
      p_company_id: data.companyId,
      p_new_escalation_id: contact.id,
    });
  }

  console.log(`Contact created: ${contact.id} for company ${data.companyId}`);
  return contact;
}

/**
 * Obtiene todos los contactos de una empresa.
 *
 * @param companyId - ID de la empresa
 * @param tenantId - ID del tenant
 * @returns Promise con lista de contactos ordenados (primary first)
 */
export async function getContactsByCompany(companyId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('is_primary_contact', { ascending: false })
    .order('is_escalation_contact', { ascending: false })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene un contacto por ID.
 *
 * @param contactId - ID del contacto
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto
 * @throws {NotFoundError} Si el contacto no existe
 */
export async function getContactById(contactId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Contact', contactId);
  }

  return data;
}

/**
 * Actualiza un contacto existente.
 *
 * @param contactId - ID del contacto
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto actualizado
 * @throws {NotFoundError} Si el contacto no existe
 * @throws {ValidationError} Si intenta desmarcar único primary
 */
export async function updateContact(
  contactId: string,
  data: ContactUpdateData,
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Obtener contacto actual
  const { data: current } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!current) {
    throw new NotFoundError('Contact', contactId);
  }

  // Validar: si es el único primary y se intenta desmarcar
  if (current.is_primary_contact && data.isPrimaryContact === false) {
    const { data: primaryCount } = await supabase.rpc('count_primary_contacts', {
      p_company_id: current.company_id,
    });

    if (primaryCount <= 1) {
      throw new ValidationError('Debe haber un contacto principal');
    }
  }

  // Actualizar campos básicos
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.firstName !== undefined) updateData.first_name = data.firstName;
  if (data.lastName !== undefined) updateData.last_name = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.position !== undefined) updateData.position = data.position || null;

  const { data: updated, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  // Si cambió isPrimaryContact a true, hacer swap
  if (data.isPrimaryContact === true && !current.is_primary_contact) {
    await supabase.rpc('swap_primary_contact', {
      p_company_id: current.company_id,
      p_new_primary_id: contactId,
    });
  }

  // Si cambió isEscalationContact, hacer swap o desmarcar
  if (data.isEscalationContact !== undefined && data.isEscalationContact !== current.is_escalation_contact) {
    if (data.isEscalationContact) {
      await supabase.rpc('swap_escalation_contact', {
        p_company_id: current.company_id,
        p_new_escalation_id: contactId,
      });
    } else {
      // Desmarcar escalation
      await supabase
        .from('contacts')
        .update({ is_escalation_contact: false })
        .eq('id', contactId);
    }
  }

  console.log(`Contact updated: ${contactId}`);
  return updated;
}

/**
 * Desactiva un contacto (soft delete).
 *
 * @param contactId - ID del contacto
 * @param tenantId - ID del tenant
 * @returns Promise con el contacto desactivado
 * @throws {NotFoundError} Si el contacto no existe
 * @throws {ValidationError} Si es el único primary contact
 */
export async function deactivateContact(contactId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Obtener contacto
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!contact) {
    throw new NotFoundError('Contact', contactId);
  }

  // Validar que no sea el único primary
  if (contact.is_primary_contact) {
    const { data: primaryCount } = await supabase.rpc('count_primary_contacts', {
      p_company_id: contact.company_id,
    });

    if (primaryCount <= 1) {
      throw new ValidationError('Asigne otro contacto principal primero');
    }
  }

  const { data: deactivated, error } = await supabase
    .from('contacts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error('Error deactivating contact:', error);
    throw new Error(`Failed to deactivate contact: ${error.message}`);
  }

  console.log(`Contact deactivated: ${contactId}`);
  return deactivated;
}
