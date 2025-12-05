/**
 * Collection Service - Lógica de negocio para collections de cobranza
 * Story 3.5: Activar Playbook en Factura
 *
 * @module lib/services/collection-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Estados de factura válidos para activar un playbook
 */
const VALID_STATUSES_FOR_ACTIVATION = ['pendiente', 'fecha_confirmada'];

/**
 * Estados de collection que se consideran "activos" (no terminales)
 */
const NON_TERMINAL_STATUSES = ['active', 'paused', 'awaiting_response', 'pending_review'];

/**
 * Resultado de operación de creación de collection
 */
interface CreateCollectionResult {
  success: boolean;
  collection?: {
    id: string;
    status: string;
    playbook: {
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
 * Collection activa con datos del playbook para mostrar en UI
 */
export interface ActiveCollection {
  id: string;
  status: string;
  playbook: {
    id: string;
    name: string;
  };
}

/**
 * Crea una nueva collection para activar un playbook en una factura
 *
 * Validaciones de negocio:
 * 1. Verifica que la factura existe y pertenece al tenant
 * 2. Verifica que la factura tiene status válido (pendiente, fecha_confirmada)
 * 3. Verifica que NO existe collection activa para la factura
 * 4. Obtiene company_id de la factura
 * 5. Obtiene primary_contact_id de la empresa
 * 6. Obtiene primer mensaje del playbook para calcular next_action_at
 * 7. Crea registro en collections
 *
 * @param tenantId - ID del tenant (obtenido del JWT)
 * @param invoiceId - ID de la factura
 * @param playbookId - ID del playbook a activar
 * @param userId - Clerk User ID del usuario que activa
 * @returns Resultado con collection creada o error
 */
export async function createCollection(
  tenantId: string,
  invoiceId: string,
  playbookId: string,
  userId: string
): Promise<CreateCollectionResult> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Verificar factura existe y tiene status válido
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, company_id, payment_status')
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return {
      success: false,
      error: {
        code: 'INVOICE_NOT_FOUND',
        message: 'Factura no encontrada',
      },
    };
  }

  // 2. Validar status de factura
  if (!VALID_STATUSES_FOR_ACTIVATION.includes(invoice.payment_status)) {
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: `No se puede activar playbook en factura con estado "${invoice.payment_status}". Solo facturas pendientes o con fecha confirmada.`,
      },
    };
  }

  // 3. Verificar no existe collection activa
  const { data: existingCollection } = await supabase
    .from('collections')
    .select('id')
    .eq('invoice_id', invoiceId)
    .in('status', NON_TERMINAL_STATUSES)
    .maybeSingle();

  if (existingCollection) {
    return {
      success: false,
      error: {
        code: 'COLLECTION_EXISTS',
        message: 'Esta factura ya tiene un playbook activo',
      },
    };
  }

  // 4. Obtener contacto primario de la empresa
  const { data: primaryContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('company_id', invoice.company_id)
    .eq('is_primary_contact', true)
    .eq('is_active', true)
    .single();

  if (!primaryContact) {
    return {
      success: false,
      error: {
        code: 'NO_PRIMARY_CONTACT',
        message: 'La empresa no tiene contacto primario definido',
      },
    };
  }

  // 5. Obtener playbook y primer mensaje
  const { data: playbook, error: playbookError } = await supabase
    .from('playbooks')
    .select(`
      id, name,
      playbook_messages(sequence_order, wait_days)
    `)
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .eq('is_active', true)
    .single();

  if (playbookError || !playbook) {
    return {
      success: false,
      error: {
        code: 'PLAYBOOK_NOT_FOUND',
        message: 'Playbook no encontrado o inactivo',
      },
    };
  }

  // 6. Calcular next_action_at basado en primer mensaje
  const sortedMessages = (playbook.playbook_messages || [])
    .sort((a: { sequence_order: number }, b: { sequence_order: number }) =>
      a.sequence_order - b.sequence_order
    );
  const waitDays = sortedMessages[0]?.wait_days || 0;

  const nextActionAt = new Date();
  nextActionAt.setDate(nextActionAt.getDate() + waitDays);

  // 7. Crear collection
  const { data: collection, error: insertError } = await supabase
    .from('collections')
    .insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      company_id: invoice.company_id,
      primary_contact_id: primaryContact.id,
      playbook_id: playbookId,
      status: 'active',
      current_message_index: 0,
      started_at: new Date().toISOString(),
      next_action_at: nextActionAt.toISOString(),
    })
    .select('id, status')
    .single();

  if (insertError) {
    // Partial unique index violation (23505)
    if (insertError.code === '23505') {
      return {
        success: false,
        error: {
          code: 'COLLECTION_EXISTS',
          message: 'Esta factura ya tiene un playbook activo',
        },
      };
    }
    console.error('Error creating collection:', insertError);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Error al crear la collection. Intente nuevamente.',
      },
    };
  }

  console.log(
    `Collection created: ${collection.id} for invoice ${invoiceId} with playbook ${playbook.name} by user ${userId}`
  );

  return {
    success: true,
    collection: {
      id: collection.id,
      status: collection.status,
      playbook: {
        id: playbook.id,
        name: playbook.name,
      },
    },
  };
}

/**
 * Obtiene la collection activa para una factura
 *
 * @param tenantId - ID del tenant
 * @param invoiceId - ID de la factura
 * @returns Collection activa con datos del playbook, o null si no existe
 */
export async function getActiveCollectionForInvoice(
  tenantId: string,
  invoiceId: string
): Promise<ActiveCollection | null> {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id,
      status,
      playbooks:playbook_id(id, name)
    `)
    .eq('tenant_id', tenantId)
    .eq('invoice_id', invoiceId)
    .in('status', NON_TERMINAL_STATUSES)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // El join devuelve un objeto, no un array
  const playbookData = data.playbooks as unknown as { id: string; name: string };

  return {
    id: data.id,
    status: data.status,
    playbook: {
      id: playbookData.id,
      name: playbookData.name,
    },
  };
}

/**
 * Obtiene playbooks activos para el selector de activación
 *
 * @param tenantId - ID del tenant
 * @returns Lista de playbooks activos con conteo de mensajes
 */
export async function getPlaybooksForActivation(tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('playbooks')
    .select(`
      id,
      name,
      description,
      playbook_messages(count)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching playbooks for activation:', error);
    return [];
  }

  // Transformar el conteo de mensajes
  return (data || []).map((playbook) => ({
    id: playbook.id,
    name: playbook.name,
    description: playbook.description,
    message_count: playbook.playbook_messages?.[0]?.count || 0,
  }));
}
