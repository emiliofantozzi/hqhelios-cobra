/**
 * API Routes para mensaje específico de un playbook
 *
 * @module app/api/playbooks/[id]/messages/[messageId]
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { updatePlaybookMessageSchema } from '@/lib/validations/playbook-schema';
import {
  getPlaybookMessageById,
  updatePlaybookMessage,
  deletePlaybookMessage,
  NotFoundError,
} from '@/lib/services/playbook-message-service';

interface RouteParams {
  params: Promise<{ id: string; messageId: string }>;
}

/**
 * GET /api/playbooks/[id]/messages/[messageId] - Obtener mensaje por ID
 *
 * @returns 200 con mensaje
 * @returns 401 si no autenticado
 * @returns 404 si mensaje no existe
 * @returns 500 en error de servidor
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { messageId } = await params;

    const message = await getPlaybookMessageById(messageId, tenantId);

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in GET /api/playbooks/[id]/messages/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/playbooks/[id]/messages/[messageId] - Actualizar mensaje
 *
 * @returns 200 con mensaje actualizado
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 404 si mensaje no existe
 * @returns 500 en error de servidor
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { messageId } = await params;

    // Validar datos de entrada
    const body = await request.json();
    const result = updatePlaybookMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const message = await updatePlaybookMessage(messageId, result.data, tenantId);

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in PATCH /api/playbooks/[id]/messages/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/playbooks/[id]/messages/[messageId] - Eliminar mensaje
 *
 * Los mensajes restantes se reordenan automáticamente.
 *
 * @returns 204 sin contenido
 * @returns 401 si no autenticado
 * @returns 404 si mensaje no existe
 * @returns 500 en error de servidor
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { messageId } = await params;

    await deletePlaybookMessage(messageId, tenantId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in DELETE /api/playbooks/[id]/messages/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
