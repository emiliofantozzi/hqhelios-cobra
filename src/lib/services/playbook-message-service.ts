/**
 * Playbook Message Service - Lógica de negocio para mensajes de playbooks
 *
 * @module lib/services/playbook-message-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';
import type {
  CreatePlaybookMessageInput,
  UpdatePlaybookMessageInput,
  ReorderMessagesInput,
} from '@/lib/validations/playbook-schema';

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
 * Obtiene todos los mensajes de un playbook ordenados por sequence_order.
 *
 * @param playbookId - ID del playbook
 * @param tenantId - ID del tenant
 * @returns Promise con lista de mensajes ordenados
 *
 * @example
 * ```ts
 * const messages = await getPlaybookMessages(playbookId, tenantId);
 * ```
 */
export async function getPlaybookMessages(playbookId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Primero verificar que el playbook existe (RLS se encarga del tenant)
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('id')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new NotFoundError('Playbook', playbookId);
  }

  const { data, error } = await supabase
    .from('playbook_messages')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('sequence_order', { ascending: true });

  if (error) {
    console.error('Error fetching playbook messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene un mensaje individual por ID.
 *
 * @param messageId - ID del mensaje
 * @param tenantId - ID del tenant
 * @returns Promise con el mensaje
 * @throws {NotFoundError} Si el mensaje no existe
 */
export async function getPlaybookMessageById(messageId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('playbook_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (error || !data) {
    throw new NotFoundError('PlaybookMessage', messageId);
  }

  return data;
}

/**
 * Crea un nuevo mensaje en un playbook.
 * El sequence_order se calcula automáticamente como el siguiente disponible.
 *
 * @param playbookId - ID del playbook
 * @param data - Datos del mensaje validados con Zod
 * @param tenantId - ID del tenant
 * @returns Promise con el mensaje creado
 * @throws {NotFoundError} Si el playbook no existe
 *
 * @example
 * ```ts
 * const message = await createPlaybookMessage(playbookId, {
 *   channel: 'email',
 *   temperature: 'amigable',
 *   subjectTemplate: 'Recordatorio de pago',
 *   bodyTemplate: 'Hola {{contact_first_name}}...',
 *   waitDays: 0,
 *   sendOnlyIfNoResponse: true
 * }, tenantId);
 * ```
 */
export async function createPlaybookMessage(
  playbookId: string,
  data: CreatePlaybookMessageInput,
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que el playbook existe
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('id')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new NotFoundError('Playbook', playbookId);
  }

  // Obtener el siguiente sequence_order
  const { data: lastMessage } = await supabase
    .from('playbook_messages')
    .select('sequence_order')
    .eq('playbook_id', playbookId)
    .order('sequence_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSequenceOrder = (lastMessage?.sequence_order || 0) + 1;

  const { data: message, error } = await supabase
    .from('playbook_messages')
    .insert({
      playbook_id: playbookId,
      sequence_order: nextSequenceOrder,
      channel: data.channel,
      temperature: data.temperature,
      subject_template: data.subjectTemplate || null,
      body_template: data.bodyTemplate,
      use_ai_generation: data.useAiGeneration,
      ai_instructions: data.aiInstructions || null,
      wait_days: data.waitDays,
      send_only_if_no_response: data.sendOnlyIfNoResponse,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating playbook message:', error);
    throw new Error(`Failed to create message: ${error.message}`);
  }

  console.log(`Message created: ${message.id} (seq: ${nextSequenceOrder}) for playbook ${playbookId}`);
  return message;
}

/**
 * Actualiza un mensaje existente.
 *
 * @param messageId - ID del mensaje
 * @param data - Datos a actualizar
 * @param tenantId - ID del tenant
 * @returns Promise con el mensaje actualizado
 * @throws {NotFoundError} Si el mensaje no existe
 */
export async function updatePlaybookMessage(
  messageId: string,
  data: UpdatePlaybookMessageInput,
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que existe
  const { data: existing } = await supabase
    .from('playbook_messages')
    .select('id')
    .eq('id', messageId)
    .single();

  if (!existing) {
    throw new NotFoundError('PlaybookMessage', messageId);
  }

  // Construir objeto de actualización solo con campos proporcionados
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.channel !== undefined) updateData.channel = data.channel;
  if (data.temperature !== undefined) updateData.temperature = data.temperature;
  if (data.subjectTemplate !== undefined) updateData.subject_template = data.subjectTemplate || null;
  if (data.bodyTemplate !== undefined) updateData.body_template = data.bodyTemplate;
  if (data.useAiGeneration !== undefined) updateData.use_ai_generation = data.useAiGeneration;
  if (data.aiInstructions !== undefined) updateData.ai_instructions = data.aiInstructions || null;
  if (data.waitDays !== undefined) updateData.wait_days = data.waitDays;
  if (data.sendOnlyIfNoResponse !== undefined) updateData.send_only_if_no_response = data.sendOnlyIfNoResponse;

  const { data: message, error } = await supabase
    .from('playbook_messages')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error updating playbook message:', error);
    throw new Error(`Failed to update message: ${error.message}`);
  }

  console.log(`Message updated: ${message.id}`);
  return message;
}

/**
 * Elimina un mensaje y reordena los restantes.
 *
 * @param messageId - ID del mensaje a eliminar
 * @param tenantId - ID del tenant
 * @throws {NotFoundError} Si el mensaje no existe
 *
 * @remarks
 * Después de eliminar, los mensajes restantes se reordenan
 * automáticamente para mantener secuencia continua (1, 2, 3...).
 */
export async function deletePlaybookMessage(messageId: string, tenantId: string) {
  const supabase = await getSupabaseClient(tenantId);

  // Obtener el mensaje para saber su playbook_id y sequence_order
  const { data: message } = await supabase
    .from('playbook_messages')
    .select('id, playbook_id, sequence_order')
    .eq('id', messageId)
    .single();

  if (!message) {
    throw new NotFoundError('PlaybookMessage', messageId);
  }

  // Eliminar el mensaje
  const { error: deleteError } = await supabase
    .from('playbook_messages')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    console.error('Error deleting playbook message:', deleteError);
    throw new Error(`Failed to delete message: ${deleteError.message}`);
  }

  // Reordenar los mensajes restantes que tenían sequence_order mayor
  const { data: remainingMessages } = await supabase
    .from('playbook_messages')
    .select('id, sequence_order')
    .eq('playbook_id', message.playbook_id)
    .gt('sequence_order', message.sequence_order)
    .order('sequence_order', { ascending: true });

  if (remainingMessages && remainingMessages.length > 0) {
    // Actualizar sequence_order de cada mensaje restante
    for (const msg of remainingMessages) {
      await supabase
        .from('playbook_messages')
        .update({
          sequence_order: msg.sequence_order - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', msg.id);
    }
  }

  console.log(`Message deleted: ${messageId} from playbook ${message.playbook_id}`);
}

/**
 * Reordena los mensajes de un playbook.
 *
 * @param playbookId - ID del playbook
 * @param messages - Array de {id, sequenceOrder} con el nuevo orden
 * @param tenantId - ID del tenant
 * @throws {NotFoundError} Si el playbook no existe
 *
 * @remarks
 * Esta función actualiza todos los mensajes proporcionados
 * con sus nuevos sequence_order en una sola transacción.
 */
export async function reorderPlaybookMessages(
  playbookId: string,
  messages: ReorderMessagesInput['messages'],
  tenantId: string
) {
  const supabase = await getSupabaseClient(tenantId);

  // Verificar que el playbook existe
  const { data: playbook } = await supabase
    .from('playbooks')
    .select('id')
    .eq('id', playbookId)
    .single();

  if (!playbook) {
    throw new NotFoundError('Playbook', playbookId);
  }

  // Actualizar cada mensaje con su nuevo sequence_order
  // Primero seteamos a valores temporales negativos para evitar conflictos de unicidad
  for (let i = 0; i < messages.length; i++) {
    const { id, sequenceOrder } = messages[i];
    await supabase
      .from('playbook_messages')
      .update({
        sequence_order: -(i + 1), // Valores negativos temporales
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('playbook_id', playbookId);
  }

  // Luego seteamos los valores finales
  for (const { id, sequenceOrder } of messages) {
    const { error } = await supabase
      .from('playbook_messages')
      .update({
        sequence_order: sequenceOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('playbook_id', playbookId);

    if (error) {
      console.error(`Error reordering message ${id}:`, error);
      throw new Error(`Failed to reorder messages: ${error.message}`);
    }
  }

  console.log(`Messages reordered for playbook ${playbookId}: ${messages.length} messages`);

  // Retornar los mensajes actualizados ordenados
  return getPlaybookMessages(playbookId, tenantId);
}
