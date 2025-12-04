/**
 * Función de seed para crear playbooks por defecto en nuevos tenants.
 *
 * @module lib/seed/create-default-playbooks
 */
import { createClient } from '@supabase/supabase-js';
import { supabaseEnv, validateEnv } from '@/lib/config/env';
import { DEFAULT_PLAYBOOKS } from '@/lib/constants/default-playbooks';

/**
 * Crea los playbooks por defecto para un tenant nuevo.
 *
 * Esta función es idempotente: si ya existen playbooks para el tenant,
 * no crea duplicados y retorna silenciosamente.
 *
 * @param tenantId - ID del tenant (UUID)
 * @param userId - ID del usuario que crea los playbooks (opcional)
 * @throws {Error} Si falla la creación de playbooks
 *
 * @example
 * ```ts
 * await createDefaultPlaybooks(tenantId, userId);
 * ```
 */
export async function createDefaultPlaybooks(
  tenantId: string,
  userId?: string
): Promise<void> {
  validateEnv();

  const supabase = createClient(supabaseEnv.url!, supabaseEnv.serviceKey!);

  // 1. Verificar idempotencia - si ya existen playbooks, no crear
  const { data: existingPlaybooks, error: checkError } = await supabase
    .from('playbooks')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1);

  if (checkError) {
    console.error('Error checking existing playbooks:', checkError);
    throw new Error(`Failed to check existing playbooks: ${checkError.message}`);
  }

  if (existingPlaybooks && existingPlaybooks.length > 0) {
    console.log(`Playbooks already exist for tenant ${tenantId}, skipping seed`);
    return;
  }

  // 2. Crear cada playbook con sus mensajes
  for (const playbookDef of DEFAULT_PLAYBOOKS) {
    try {
      // Crear el playbook
      const { data: playbook, error: playbookError } = await supabase
        .from('playbooks')
        .insert({
          tenant_id: tenantId,
          name: playbookDef.name,
          description: playbookDef.description,
          trigger_type: playbookDef.triggerType,
          trigger_days: playbookDef.triggerDays,
          is_default: playbookDef.isDefault,
          is_active: true,
          created_by_user_id: userId || null,
        })
        .select('id')
        .single();

      if (playbookError || !playbook) {
        console.error(`Error creating playbook "${playbookDef.name}":`, playbookError);
        throw new Error(`Failed to create playbook "${playbookDef.name}": ${playbookError?.message}`);
      }

      // Crear los mensajes del playbook
      if (playbookDef.messages.length > 0) {
        const messagesToInsert = playbookDef.messages.map((msg, index) => ({
          playbook_id: playbook.id,
          sequence_order: index + 1,
          channel: msg.channel,
          temperature: msg.temperature,
          subject_template: msg.subjectTemplate || null,
          body_template: msg.bodyTemplate,
          wait_days: msg.waitDays,
          send_only_if_no_response: msg.sendOnlyIfNoResponse,
          use_ai_generation: false,
          ai_instructions: null,
        }));

        const { error: messagesError } = await supabase
          .from('playbook_messages')
          .insert(messagesToInsert);

        if (messagesError) {
          console.error(`Error creating messages for playbook "${playbookDef.name}":`, messagesError);
          // Intentar limpiar el playbook creado
          await supabase.from('playbooks').delete().eq('id', playbook.id);
          throw new Error(`Failed to create messages for playbook "${playbookDef.name}": ${messagesError.message}`);
        }
      }

      console.log(`Created playbook "${playbookDef.name}" with ${playbookDef.messages.length} messages`);
    } catch (error) {
      // Re-throw para que el caller maneje el error
      throw error;
    }
  }

  console.log(`Successfully created ${DEFAULT_PLAYBOOKS.length} default playbooks for tenant ${tenantId}`);
}
