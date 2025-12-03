/**
 * API Route para reordenar mensajes de un playbook
 *
 * @module app/api/playbooks/[id]/messages/reorder
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { reorderMessagesSchema } from '@/lib/validations/playbook-schema';
import {
  reorderPlaybookMessages,
  NotFoundError,
} from '@/lib/services/playbook-message-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/playbooks/[id]/messages/reorder - Reordenar mensajes
 *
 * Recibe un array de {id, sequenceOrder} y actualiza todos los mensajes.
 *
 * @body { messages: Array<{ id: string, sequenceOrder: number }> }
 * @returns 200 con mensajes reordenados
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 500 en error de servidor
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id: playbookId } = await params;

    // Validar datos de entrada
    const body = await request.json();
    const result = reorderMessagesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const messages = await reorderPlaybookMessages(
      playbookId,
      result.data.messages,
      tenantId
    );

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in PATCH /api/playbooks/[id]/messages/reorder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
