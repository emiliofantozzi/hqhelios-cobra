'use client';

/**
 * Página para crear nuevo playbook
 *
 * @module app/(dashboard)/playbooks/new
 */
import Link from 'next/link';
import { PlaybookForm } from '@/components/forms/playbook-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Página de creación de playbook
 */
export default function NewPlaybookPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4">
          <Link href="/playbooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Playbook</h1>
          <p className="text-gray-600 mt-1">
            Crea una nueva secuencia de mensajes de cobranza
          </p>
        </div>

        {/* Formulario */}
        <div className="max-w-2xl">
          <PlaybookForm mode="create" redirectToEdit={true} />
        </div>
      </div>
    </div>
  );
}
