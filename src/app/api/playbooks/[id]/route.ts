/**
 * API Routes para playbook específico
 *
 * @module app/api/playbooks/[id]
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId, getCurrentUser } from '@/lib/auth/get-tenant-id';
import { updatePlaybookSchema } from '@/lib/validations/playbook-schema';
import {
  getPlaybookById,
  updatePlaybook,
  deactivatePlaybook,
  deletePlaybook,
  duplicatePlaybook,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '@/lib/services/playbook-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playbooks/[id] - Obtener playbook por ID con sus mensajes
 *
 * @returns 200 con playbook y mensajes ordenados
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
    const { id } = await params;
    const playbook = await getPlaybookById(id, tenantId);

    return NextResponse.json(playbook);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in GET /api/playbooks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/playbooks/[id] - Actualizar playbook
 *
 * Soporta:
 * - Actualización de campos (name, description, triggerType, etc.)
 * - Soft delete con { is_active: false }
 *
 * @returns 200 con playbook actualizado
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 409 si isDefault=true y ya existe otro default
 * @returns 422 si intenta activar sin mensajes
 * @returns 500 en error de servidor
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id } = await params;
    const body = await request.json();

    // Caso especial: soft delete
    if (body.is_active === false && Object.keys(body).length === 1) {
      const playbook = await deactivatePlaybook(id, tenantId);
      return NextResponse.json(playbook);
    }

    // Validar con Zod (schema parcial para updates)
    const result = updatePlaybookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const playbook = await updatePlaybook(id, result.data, tenantId);
    return NextResponse.json(playbook);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error('Error in PATCH /api/playbooks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/playbooks/[id] - Eliminar playbook permanentemente
 *
 * Los mensajes se eliminan automáticamente por CASCADE.
 *
 * @returns 204 sin contenido
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 500 en error de servidor
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const { id } = await params;

    await deletePlaybook(id, tenantId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in DELETE /api/playbooks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/playbooks/[id] - Duplicar playbook
 *
 * Copia el playbook y todos sus mensajes.
 * El nuevo playbook tendrá nombre "Copia de [original]" y isDefault=false.
 *
 * @returns 201 con nuevo playbook duplicado
 * @returns 401 si no autenticado
 * @returns 404 si playbook no existe
 * @returns 500 en error de servidor
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const { id } = await params;

    const newPlaybook = await duplicatePlaybook(id, tenantId, user.id);

    return NextResponse.json(newPlaybook, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error in POST /api/playbooks/[id] (duplicate):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
