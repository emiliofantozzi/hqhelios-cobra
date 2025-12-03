/**
 * API Routes para gestión de playbooks de cobranza
 *
 * @module app/api/playbooks
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTenantId, getCurrentUser } from '@/lib/auth/get-tenant-id';
import { createPlaybookSchema } from '@/lib/validations/playbook-schema';
import {
  createPlaybook,
  getPlaybooks,
  ConflictError,
} from '@/lib/services/playbook-service';

/**
 * POST /api/playbooks - Crear nuevo playbook
 *
 * @returns 201 con playbook creado
 * @returns 400 si validación falla
 * @returns 401 si no autenticado
 * @returns 409 si ya existe un default para el mismo trigger_type
 * @returns 500 en error de servidor
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener tenant_id y user (para created_by_user_id)
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const userId = user.id;

    // 3. Validar datos de entrada
    const body = await request.json();
    const result = createPlaybookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // 4. Crear playbook
    const playbook = await createPlaybook(result.data, tenantId, userId);

    // 5. Retornar playbook creado
    return NextResponse.json(playbook, { status: 201 });
  } catch (error) {
    // Manejar error de conflicto (default duplicado)
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Error genérico de servidor
    console.error('Error in POST /api/playbooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/playbooks - Listar playbooks del tenant
 *
 * @query includeInactive - Si incluir playbooks inactivos (default: false)
 * @returns 200 con array de playbooks con conteo de mensajes
 * @returns 401 si no autenticado
 * @returns 500 en error de servidor
 */
export async function GET(request: Request) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener tenant_id del usuario
    const tenantId = await getTenantId();

    // 3. Parsear query params
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 4. Obtener playbooks del tenant
    const playbooks = await getPlaybooks(tenantId, includeInactive);

    // 5. Retornar lista
    return NextResponse.json(playbooks);
  } catch (error) {
    console.error('Error in GET /api/playbooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
