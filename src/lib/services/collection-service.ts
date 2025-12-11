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
 * Estados terminales (no permiten más acciones)
 */
const TERMINAL_STATUSES = ['completed', 'escalated'];

/**
 * State machine - transiciones válidas de collection status
 * Story 3.7: Control Manual de Playbook Activo
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ['paused', 'awaiting_response', 'completed', 'escalated'],
  paused: ['active', 'completed'],
  awaiting_response: ['active', 'pending_review'],
  pending_review: ['active', 'completed'],
  escalated: ['completed'],
};

/**
 * Valida si una transición de estado es permitida
 */
function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Resultado genérico de operaciones del servicio
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

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

/**
 * Pausa una collection activa
 * Story 3.7: Control Manual de Playbook Activo
 *
 * @param tenantId - ID del tenant
 * @param collectionId - ID de la collection
 * @param userId - ID del usuario que realiza la acción
 * @param note - Nota opcional
 * @returns Resultado con collection actualizada o error
 */
export async function pauseCollection(
  tenantId: string,
  collectionId: string,
  userId: string,
  note?: string
): Promise<ServiceResult<ActiveCollection>> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Fetch collection
  const { data: collection, error } = await supabase
    .from('collections')
    .select(`id, status, playbooks:playbook_id(id, name)`)
    .eq('tenant_id', tenantId)
    .eq('id', collectionId)
    .single();

  if (error || !collection) {
    return {
      success: false,
      error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection no encontrada' },
    };
  }

  // 2. Validar transición
  if (!canTransition(collection.status, 'paused')) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message:
          collection.status === 'paused'
            ? 'El playbook ya está pausado'
            : `No se puede pausar un playbook con estado "${collection.status}"`,
      },
    };
  }

  // 3. Update
  const { error: updateError } = await supabase
    .from('collections')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error('Error pausing collection:', updateError);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Error al pausar playbook' },
    };
  }

  console.log(`Collection ${collectionId} paused by user ${userId}${note ? ` with note: ${note}` : ''}`);

  const playbookData = collection.playbooks as unknown as { id: string; name: string };
  return {
    success: true,
    data: { id: collection.id, status: 'paused', playbook: playbookData },
  };
}

/**
 * Reanuda una collection pausada
 * Story 3.7: Control Manual de Playbook Activo
 *
 * @param tenantId - ID del tenant
 * @param collectionId - ID de la collection
 * @param userId - ID del usuario que realiza la acción
 * @param note - Nota opcional
 * @returns Resultado con collection actualizada o error
 */
export async function resumeCollection(
  tenantId: string,
  collectionId: string,
  userId: string,
  note?: string
): Promise<ServiceResult<ActiveCollection>> {
  const supabase = await getSupabaseClient(tenantId);

  const { data: collection, error } = await supabase
    .from('collections')
    .select(`id, status, playbooks:playbook_id(id, name)`)
    .eq('tenant_id', tenantId)
    .eq('id', collectionId)
    .single();

  if (error || !collection) {
    return {
      success: false,
      error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection no encontrada' },
    };
  }

  if (!canTransition(collection.status, 'active')) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message:
          collection.status === 'active'
            ? 'El playbook ya está activo'
            : `No se puede reanudar un playbook con estado "${collection.status}"`,
      },
    };
  }

  // Update con next_action_at = now para procesamiento inmediato
  const { error: updateError } = await supabase
    .from('collections')
    .update({
      status: 'active',
      next_action_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', collectionId)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error('Error resuming collection:', updateError);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Error al reanudar playbook' },
    };
  }

  console.log(`Collection ${collectionId} resumed by user ${userId}${note ? ` with note: ${note}` : ''}`);

  const playbookData = collection.playbooks as unknown as { id: string; name: string };
  return {
    success: true,
    data: { id: collection.id, status: 'active', playbook: playbookData },
  };
}

/**
 * Completa manualmente una collection
 * Story 3.7: Control Manual de Playbook Activo
 *
 * @param tenantId - ID del tenant
 * @param collectionId - ID de la collection
 * @param userId - ID del usuario que realiza la acción
 * @param note - Nota opcional
 * @returns Resultado con collection actualizada o error
 */
export async function completeCollection(
  tenantId: string,
  collectionId: string,
  userId: string,
  note?: string
): Promise<ServiceResult<ActiveCollection>> {
  const supabase = await getSupabaseClient(tenantId);

  const { data: collection, error } = await supabase
    .from('collections')
    .select(`id, status, playbooks:playbook_id(id, name)`)
    .eq('tenant_id', tenantId)
    .eq('id', collectionId)
    .single();

  if (error || !collection) {
    return {
      success: false,
      error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection no encontrada' },
    };
  }

  if (TERMINAL_STATUSES.includes(collection.status)) {
    return {
      success: false,
      error: { code: 'INVALID_TRANSITION', message: 'El playbook ya está completado' },
    };
  }

  const { error: updateError } = await supabase
    .from('collections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', collectionId)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error('Error completing collection:', updateError);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Error al completar playbook' },
    };
  }

  console.log(`Collection ${collectionId} completed by user ${userId}${note ? ` with note: ${note}` : ''}`);

  const playbookData = collection.playbooks as unknown as { id: string; name: string };
  return {
    success: true,
    data: { id: collection.id, status: 'completed', playbook: playbookData },
  };
}

/**
 * Evento de timeline de comunicaciones
 */
export interface TimelineEvent {
  id: string;
  type: 'playbook_started' | 'playbook_paused' | 'playbook_resumed' | 'playbook_completed';
  timestamp: string;
  note?: string;
  metadata?: { playbookName?: string };
}

/**
 * Obtiene el timeline de eventos de una collection
 * Story 3.7: Control Manual de Playbook Activo
 *
 * Nota: Esta es una implementación básica que muestra eventos de inicio y completado.
 * Epic 4 agregará mensajes enviados y respuestas recibidas.
 *
 * @param tenantId - ID del tenant
 * @param collectionId - ID de la collection
 * @returns Array de eventos ordenados por timestamp DESC
 */
export async function getCollectionTimeline(
  tenantId: string,
  collectionId: string
): Promise<TimelineEvent[]> {
  const supabase = await getSupabaseClient(tenantId);

  const { data: collection } = await supabase
    .from('collections')
    .select(`id, status, started_at, completed_at, playbooks:playbook_id(name)`)
    .eq('tenant_id', tenantId)
    .eq('id', collectionId)
    .single();

  if (!collection) return [];

  const playbookData = collection.playbooks as unknown as { name: string };
  const events: TimelineEvent[] = [];

  // Evento de inicio siempre presente
  if (collection.started_at) {
    events.push({
      id: `${collection.id}-started`,
      type: 'playbook_started',
      timestamp: collection.started_at,
      metadata: { playbookName: playbookData.name },
    });
  }

  // Evento de completado si aplica
  if (collection.completed_at) {
    events.push({
      id: `${collection.id}-completed`,
      type: 'playbook_completed',
      timestamp: collection.completed_at,
    });
  }

  // Ordenar DESC (más reciente primero)
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Item de lista de collections
 * Story 4.5: Visibilidad de Mensajes Programados
 */
export interface CollectionListItem {
  id: string;
  status: string;
  startedAt: string;
  nextActionAt: string | null;
  messagesSentCount: number;
  currentMessageIndex: number;
  totalMessages: number;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: string;
  };
  company: {
    id: string;
    name: string;
  };
  playbook: {
    id: string;
    name: string;
  };
}

/**
 * Filtros para listado de collections
 */
interface ListCollectionsFilters {
  status?: string;
  companyId?: string;
}

/**
 * Lista todas las collections del tenant con filtros opcionales
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * @param tenantId - ID del tenant
 * @param filters - Filtros opcionales (status, companyId)
 * @returns Lista de collections con datos relacionados
 */
export async function listCollections(
  tenantId: string,
  filters?: ListCollectionsFilters
): Promise<CollectionListItem[]> {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('collections')
    .select(`
      id,
      status,
      started_at,
      next_action_at,
      messages_sent_count,
      current_message_index,
      invoices:invoice_id (
        id,
        invoice_number,
        amount,
        currency,
        due_date
      ),
      companies:company_id (
        id,
        name
      ),
      playbooks:playbook_id (
        id,
        name,
        playbook_messages (count)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('next_action_at', { ascending: true, nullsFirst: false });

  // Aplicar filtros
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing collections:', error);
    return [];
  }

  return (data || []).map((collection) => {
    const invoiceData = collection.invoices as unknown as {
      id: string;
      invoice_number: string;
      amount: number;
      currency: string;
      due_date: string;
    };
    const companyData = collection.companies as unknown as {
      id: string;
      name: string;
    };
    const playbookData = collection.playbooks as unknown as {
      id: string;
      name: string;
      playbook_messages: Array<{ count: number }>;
    };

    return {
      id: collection.id,
      status: collection.status,
      startedAt: collection.started_at,
      nextActionAt: collection.next_action_at,
      messagesSentCount: collection.messages_sent_count,
      currentMessageIndex: collection.current_message_index,
      totalMessages: playbookData.playbook_messages?.[0]?.count || 0,
      invoice: {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoice_number,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        dueDate: invoiceData.due_date,
      },
      company: {
        id: companyData.id,
        name: companyData.name,
      },
      playbook: {
        id: playbookData.id,
        name: playbookData.name,
      },
    };
  });
}
