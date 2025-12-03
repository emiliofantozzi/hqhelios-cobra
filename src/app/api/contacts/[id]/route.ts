/**
 * API Routes para Contacto individual
 *
 * GET /api/contacts/[id] - Obtener contacto
 * PATCH /api/contacts/[id] - Actualizar contacto
 *
 * @module api/contacts/[id]
 */
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantId } from '@/lib/auth/get-tenant-id';
import { contactUpdateSchema } from '@/lib/validations/contact-schema';
import {
  getContactById,
  updateContact,
  deactivateContact,
  NotFoundError,
  ValidationError,
} from '@/lib/services/contact-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contacts/[id]
 * Obtiene un contacto por ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const { id } = await params;
    const contact = await getContactById(id, tenantId);

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Actualiza un contacto existente
 *
 * Si body contiene { is_active: false }, desactiva el contacto
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Si es soft delete
    if (body.is_active === false) {
      const deactivated = await deactivateContact(id, tenantId);
      return NextResponse.json(deactivated);
    }

    // Validar con Zod
    const validation = contactUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateContact(id, validation.data, tenantId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating contact:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
