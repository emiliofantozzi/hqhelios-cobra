/**
 * API Routes para mensajes de un playbook
 *
 * @module app/api/playbooks/[id]/messages
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { createPlaybookMessageSchema } from '@/lib/validations/playbook-schema';
import {
  getPlaybookMessages,
  createPlaybookMessage,
  NotFoundError,
} from '@/lib/services/playbook-message-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playbooks/[id]/messages - Listar mensajes del playbook
 *
 * @returns 200 con array de mensajes ordenados por sequence_order
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 500 en error de servidor
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id: playbookId } = await params;

    const messages = await getPlaybookMessages(playbookId, tenantId);

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in GET /api/playbooks/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/playbooks/[id]/messages - Crear nuevo mensaje
 *
 * El sequence_order se calcula automáticamente como el siguiente disponible.
 *
 * @returns 201 con mensaje creado
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 500 en error de servidor
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id: playbookId } = await params;

    // Validar datos de entrada
    const body = await request.json();
    const result = createPlaybookMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const message = await createPlaybookMessage(playbookId, result.data, tenantId);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in POST /api/playbooks/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
