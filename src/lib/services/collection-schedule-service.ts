/**
 * Collection Schedule Service
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * Calcula el cronograma completo de mensajes de una collection,
 * incluyendo mensajes enviados (con datos reales) y pendientes (con fechas calculadas).
 *
 * @module lib/services/collection-schedule-service
 */
import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Estado de un mensaje en el schedule
 */
export type MessageStatus = 'sent' | 'scheduled' | 'pending';

/**
 * Mensaje programado con información de estado y fechas
 */
export interface ScheduledMessage {
  id: string;
  sequenceOrder: number;
  channel: 'email' | 'whatsapp';
  subjectTemplate: string | null;
  waitDays: number;
  status: MessageStatus;
  // Solo si status === 'sent'
  sentAt?: string;
  deliveredAt?: string;
  deliveryStatus?: string;
  // Solo si status === 'scheduled' o 'pending'
  scheduledAt?: string;
}

/**
 * Cronograma completo de una collection
 */
export interface CollectionSchedule {
  collectionId: string;
  playbookId: string;
  playbookName: string;
  startedAt: string;
  status: string;
  currentMessageIndex: number;
  totalMessages: number;
  messagesSentCount: number;
  nextActionAt: string | null;
  messages: ScheduledMessage[];
}

/**
 * Calcula la fecha programada para un mensaje basándose en started_at y wait_days acumulados
 */
function calculateScheduledDate(
  startedAt: Date,
  messages: { wait_days: number }[],
  targetIndex: number
): Date {
  let totalDays = 0;
  for (let i = 0; i <= targetIndex; i++) {
    totalDays += messages[i]?.wait_days || 0;
  }
  const result = new Date(startedAt);
  result.setDate(result.getDate() + totalDays);
  return result;
}

/**
 * Obtiene el cronograma completo de mensajes de una collection
 *
 * @param tenantId - ID del tenant
 * @param collectionId - ID de la collection
 * @returns CollectionSchedule con todos los mensajes y sus estados
 */
export async function getCollectionSchedule(
  tenantId: string,
  collectionId: string
): Promise<CollectionSchedule | null> {
  const supabase = await getSupabaseClient(tenantId);

  // 1. Obtener collection con playbook y sus mensajes
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select(`
      id,
      status,
      current_message_index,
      messages_sent_count,
      started_at,
      next_action_at,
      playbooks:playbook_id (
        id,
        name,
        playbook_messages (
          id,
          sequence_order,
          channel,
          subject_template,
          wait_days
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('id', collectionId)
    .single();

  if (collectionError || !collection) {
    console.error('[collection-schedule] Error fetching collection:', collectionError);
    return null;
  }

  // 2. Obtener mensajes enviados de esta collection
  const { data: sentMessages, error: sentError } = await supabase
    .from('sent_messages')
    .select(`
      id,
      playbook_message_id,
      delivery_status,
      sent_at,
      delivered_at
    `)
    .eq('tenant_id', tenantId)
    .eq('collection_id', collectionId)
    .order('sent_at', { ascending: true });

  if (sentError) {
    console.error('[collection-schedule] Error fetching sent messages:', sentError);
  }

  // 3. Mapear mensajes enviados por playbook_message_id para lookup rápido
  const sentByMessageId = new Map<string, {
    deliveryStatus: string;
    sentAt: string;
    deliveredAt: string | null;
  }>();

  (sentMessages || []).forEach((msg) => {
    if (msg.playbook_message_id) {
      sentByMessageId.set(msg.playbook_message_id, {
        deliveryStatus: msg.delivery_status,
        sentAt: msg.sent_at,
        deliveredAt: msg.delivered_at,
      });
    }
  });

  // 4. Procesar playbook y mensajes
  const playbookData = collection.playbooks as unknown as {
    id: string;
    name: string;
    playbook_messages: Array<{
      id: string;
      sequence_order: number;
      channel: string;
      subject_template: string | null;
      wait_days: number;
    }>;
  };

  const playbookMessages = (playbookData.playbook_messages || [])
    .sort((a, b) => a.sequence_order - b.sequence_order);

  const startedAt = new Date(collection.started_at);
  const currentIndex = collection.current_message_index;

  // 5. Construir array de mensajes con estados
  const scheduledMessages: ScheduledMessage[] = playbookMessages.map((msg, index) => {
    const sentData = sentByMessageId.get(msg.id);

    if (sentData) {
      // Mensaje ya enviado
      return {
        id: msg.id,
        sequenceOrder: msg.sequence_order,
        channel: msg.channel as 'email' | 'whatsapp',
        subjectTemplate: msg.subject_template,
        waitDays: msg.wait_days,
        status: 'sent' as MessageStatus,
        sentAt: sentData.sentAt,
        deliveredAt: sentData.deliveredAt || undefined,
        deliveryStatus: sentData.deliveryStatus,
      };
    } else if (index === currentIndex) {
      // Mensaje próximo (scheduled)
      return {
        id: msg.id,
        sequenceOrder: msg.sequence_order,
        channel: msg.channel as 'email' | 'whatsapp',
        subjectTemplate: msg.subject_template,
        waitDays: msg.wait_days,
        status: 'scheduled' as MessageStatus,
        scheduledAt: collection.next_action_at || calculateScheduledDate(startedAt, playbookMessages, index).toISOString(),
      };
    } else {
      // Mensaje pendiente (futuro)
      return {
        id: msg.id,
        sequenceOrder: msg.sequence_order,
        channel: msg.channel as 'email' | 'whatsapp',
        subjectTemplate: msg.subject_template,
        waitDays: msg.wait_days,
        status: 'pending' as MessageStatus,
        scheduledAt: calculateScheduledDate(startedAt, playbookMessages, index).toISOString(),
      };
    }
  });

  return {
    collectionId: collection.id,
    playbookId: playbookData.id,
    playbookName: playbookData.name,
    startedAt: collection.started_at,
    status: collection.status,
    currentMessageIndex: currentIndex,
    totalMessages: playbookMessages.length,
    messagesSentCount: collection.messages_sent_count,
    nextActionAt: collection.next_action_at,
    messages: scheduledMessages,
  };
}
