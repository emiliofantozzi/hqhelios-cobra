import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Representa un mensaje enviado de una collection con datos del contacto.
 */
export interface CollectionMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  deliveryStatus: string;
  sentAt: string | null;
  deliveredAt: string | null;
  externalMessageId: string | null;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface ContactData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

/**
 * Obtiene todos los mensajes enviados de una collection.
 *
 * @param collectionId - ID de la collection
 * @param tenantId - ID del tenant para verificación de acceso
 * @returns Array de mensajes con datos del contacto, ordenados por sent_at ASC
 * @throws Error si la query falla
 */
export async function getCollectionMessages(
  collectionId: string,
  tenantId: string
): Promise<CollectionMessage[]> {
  const supabase = await getSupabaseClient(tenantId);

  const { data, error } = await supabase
    .from('sent_messages')
    .select(
      `
      id,
      channel,
      subject,
      body,
      delivery_status,
      sent_at,
      delivered_at,
      external_message_id,
      contact:contacts(
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .eq('tenant_id', tenantId)
    .eq('collection_id', collectionId)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error('[message-service] Error fetching messages:', error);
    throw error;
  }

  return (data || []).map((msg) => {
    // Supabase returns contact as single object for many-to-one relationship
    const contact = msg.contact as unknown as ContactData;
    return {
      id: msg.id,
      channel: msg.channel,
      subject: msg.subject,
      body: msg.body,
      deliveryStatus: msg.delivery_status,
      sentAt: msg.sent_at,
      deliveredAt: msg.delivered_at,
      externalMessageId: msg.external_message_id,
      contact: {
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
      },
    };
  });
}
