/**
 * Playbook Service - Lógica de negocio para playbooks de cobranza
 *
 * @module lib/services/playbook-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type { CreatePlaybookInput, UpdatePlaybookInput } from '@/lib/validations/playbook-schema';

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
 * Error personalizado para recursos no encontrados (404)
 */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

/**
 * Error personalizado para validaciones de negocio (422)
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Tipo de playbook con conteo de mensajes para listados.
 */
export interface PlaybookWithMessageCount {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_days: number | null;
  is_active: boolean;
  is_default: boolean;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/**
 * Obtiene todos los playbooks del tenant con conteo de mensajes.
 *
 * @param tenantId - ID del tenant (UUID validado)
 * @param includeInactive - Si incluir playbooks inactivos (default: false)
 * @returns Promise con lista de playbooks ordenados por fecha de creación
 *
 * @example
 * ```ts
 * const playbooks = await getPlaybooks(tenantId);
 * const allPlaybooks = await getPlaybooks(tenantId, true);
 * ```
 */
export async function getPlaybooks(
  tenantId: string,
  includeInactive: boolean = false
): Promise<PlaybookWithMessageCount[]> {
  const supabase = await getSupabaseClient(tenantId);

  let query = supabase
    .from('playbooks')
    .select(
      `
      *,
      playbook_messages(count)
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching playbooks:', error);
    throw new Error(`Failed to fetch playbooks: ${error.message}`);
  }

  // Transformar el conteo de mensajes
  return (data || []).map((playbook) => ({
    ...playbook,
    message_count: playbook.playbook_messages?.[0]?.count || 0,
    playbook_messages: undefined, // Remover el array anidado
  }));
}

/**
 * Obtiene un playbook por ID con sus mensajes.
 *
 * @param playbookId - ID del playbook
 * @param tenantId - ID del tenant
 * @returns Promise con el playbook y sus mensajes ordenados por sequence_order
 * @throws {NotFoundError} Si el playbook no existe
 */
export async function getPlaybookById(playbookId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('playbooks')
    .select(
      `
      *,
      playbook_messages(*)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Playbook', playbookId);
  }

  // Ordenar mensajes por sequence_order
  if (data.playbook_messages) {
    data.playbook_messages.sort(
      (a: { sequence_order: number }, b: { sequence_order: number }) =>
        a.sequence_order - b.sequence_order
    );
  }

  return data;
}

/**
 * Crea un nuevo playbook.
 *
 * @param data - Datos del playbook validados con Zod
 * @param tenantId - ID del tenant (UUID validado)
 * @param userId - ID del usuario que crea (opcional)
 * @returns Promise con el playbook creado
 * @throws {ConflictError} Si ya existe un default para el mismo trigger_type
 *
 * @example
 * ```ts
 * const playbook = await createPlaybook({
 *   name: 'Cobranza Estándar',
 *   triggerType: 'post_due',
 *   triggerDays: 3,
 *   isDefault: true
 * }, tenantId, userId);
 * ```
 */
export async function createPlaybook(
  data: CreatePlaybookInput,
  tenantId: string,
  userId?: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Si isDefault=true, verificar que no exista otro default para el mismo trigger_type en el tenant
  if (data.isDefault) {
    const { data: existingDefault } = await supabase
      .from('playbooks')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('trigger_type', data.triggerType)
      .eq('is_default', true)
      .maybeSingle();

    if (existingDefault) {
      throw new ConflictError(
        `Ya existe un playbook default para ${data.triggerType}: "${existingDefault.name}"`
      );
    }
  }

  const { data: playbook, error } = await supabase
    .from('playbooks')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description || null,
      trigger_type: data.triggerType,
      trigger_days: data.triggerDays ?? null,
      is_default: data.isDefault,
      is_active: true, // Los playbooks nuevos empiezan activos (pero sin mensajes)
      created_by_user_id: userId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating playbook:', error);
    throw new Error(`Failed to create playbook: ${error.message}`);
  }

  console.log(`Playbook created successfully: ${playbook.id} (${playbook.name}) for tenant ${tenantId}`);
  return playbook;
}

/**
 * Actualiza un playbook existente.
 *
 * @param playbookId - ID del playbook
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con el playbook actualizado
 * @throws {NotFoundError} Si el playbook no existe
 * @throws {ConflictError} Si isDefault=true y ya existe otro default
 * @throws {ValidationError} Si intenta activar sin mensajes
 */
export async function updatePlaybook(
  playbookId: string,
  data: UpdatePlaybookInput,
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que existe en el tenant y obtener estado actual
  const { data: existing, error: fetchError } = await supabase
    .from('playbooks')
    .select(
      `
      *,
      playbook_messages(count)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Playbook', playbookId);
  }

  const messageCount = existing.playbook_messages?.[0]?.count || 0;

  // Si intenta activar (isActive: true) y no tiene mensajes, bloquear
  if (data.isActive === true && !existing.is_active && messageCount === 0) {
    throw new ValidationError('No se puede activar un playbook sin mensajes. Agrega al menos un mensaje primero.');
  }

  // Si cambia isDefault a true, verificar unicidad en el tenant
  if (data.isDefault === true && !existing.is_default) {
    const triggerType = data.triggerType || existing.trigger_type;
    const { data: existingDefault } = await supabase
      .from('playbooks')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('trigger_type', triggerType)
      .eq('is_default', true)
      .neq('id', playbookId)
      .maybeSingle();

    if (existingDefault) {
      throw new ConflictError(
        `Ya existe un playbook default para ${triggerType}: "${existingDefault.name}"`
      );
    }
  }

  // Construir objeto de actualización solo con campos proporcionados
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.triggerType !== undefined) updateData.trigger_type = data.triggerType;
  if (data.triggerDays !== undefined) updateData.trigger_days = data.triggerDays;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: playbook, error } = await supabase
    .from('playbooks')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .select()
    .single();

  if (error) {
    console.error('Error updating playbook:', error);
    throw new Error(`Failed to update playbook: ${error.message}`);
  }

  console.log(`Playbook updated: ${playbook.id} (${playbook.name})`);
  return playbook;
}

/**
 * Desactiva un playbook (soft delete).
 *
 * @param playbookId - ID del playbook
 * @param tenantId - ID del tenant
 * @returns Promise con el playbook desactivado
 * @throws {NotFoundError} Si el playbook no existe
 */
export async function deactivatePlaybook(playbookId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data: playbook, error } = await supabase
    .from('playbooks')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .select()
    .single();

  if (error || !playbook) {
    throw new NotFoundError('Playbook', playbookId);
  }

  console.log(`Playbook deactivated: ${playbook.id} (${playbook.name})`);
  return playbook;
}

/**
 * Elimina un playbook permanentemente.
 * Los mensajes se eliminan automáticamente por CASCADE.
 *
 * @param playbookId - ID del playbook
 * @param tenantId - ID del tenant
 * @throws {NotFoundError} Si el playbook no existe
 */
export async function deletePlaybook(playbookId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que existe en el tenant
  const { data: existing } = await supabase
    .from('playbooks')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('id', playbookId)
    .single();

  if (!existing) {
    throw new NotFoundError('Playbook', playbookId);
  }

  const { error } = await supabase.from('playbooks').delete().eq('tenant_id', tenantId).eq('id', playbookId);

  if (error) {
    console.error('Error deleting playbook:', error);
    throw new Error(`Failed to delete playbook: ${error.message}`);
  }

  console.log(`Playbook deleted: ${playbookId} (${existing.name})`);
}

/**
 * Duplica un playbook con todos sus mensajes.
 *
 * @param playbookId - ID del playbook a duplicar
 * @param tenantId - ID del tenant
 * @param userId - ID del usuario que crea la copia
 * @returns Promise con el nuevo playbook duplicado (sin mensajes cargados)
 * @throws {NotFoundError} Si el playbook no existe
 *
 * @remarks
 * - El nombre del nuevo playbook será "Copia de [nombre original]"
 * - isDefault siempre será false en la copia
 * - Todos los mensajes se copian con sus mismos sequence_order
 */
export async function duplicatePlaybook(
  playbookId: string,
  tenantId: string,
  userId?: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Obtener playbook original con mensajes
  const original = await getPlaybookById(playbookId, tenantId);

  // Crear nuevo playbook
  const { data: newPlaybook, error: createError } = await supabase
    .from('playbooks')
    .insert({
      tenant_id: tenantId,
      name: `Copia de ${original.name}`,
      description: original.description,
      trigger_type: original.trigger_type,
      trigger_days: original.trigger_days,
      is_default: false, // La copia nunca es default
      is_active: false, // La copia empieza inactiva
      created_by_user_id: userId || null,
    })
    .select()
    .single();

  if (createError || !newPlaybook) {
    console.error('Error duplicating playbook:', createError);
    throw new Error(`Failed to duplicate playbook: ${createError?.message}`);
  }

  // Copiar mensajes si existen
  if (original.playbook_messages && original.playbook_messages.length > 0) {
    const messagesToCopy = original.playbook_messages.map(
      (msg: {
        sequence_order: number;
        channel: string;
        temperature: string;
        subject_template: string | null;
        body_template: string;
        use_ai_generation: boolean;
        ai_instructions: string | null;
        wait_days: number;
        send_only_if_no_response: boolean;
      }) => ({
        playbook_id: newPlaybook.id,
        sequence_order: msg.sequence_order,
        channel: msg.channel,
        temperature: msg.temperature,
        subject_template: msg.subject_template,
        body_template: msg.body_template,
        use_ai_generation: msg.use_ai_generation,
        ai_instructions: msg.ai_instructions,
        wait_days: msg.wait_days,
        send_only_if_no_response: msg.send_only_if_no_response,
      })
    );

    const { error: messagesError } = await supabase
      .from('playbook_messages')
      .insert(messagesToCopy);

    if (messagesError) {
      // Si falla la copia de mensajes, eliminar el playbook creado
      await supabase.from('playbooks').delete().eq('id', newPlaybook.id);
      console.error('Error copying messages:', messagesError);
      throw new Error(`Failed to copy messages: ${messagesError.message}`);
    }
  }

  console.log(
    `Playbook duplicated: ${original.id} -> ${newPlaybook.id} (${newPlaybook.name})`
  );
  return newPlaybook;
}
