'use client';

/**
 * Página de lista de playbooks con DataTable
 *
 * @module app/(dashboard)/playbooks
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlaybooksTable, type PlaybookRow } from '@/components/tables/playbooks-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Componente de estado vacío
 */
function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg border">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        No hay playbooks registrados
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comienza creando tu primer playbook de cobranza.
      </p>
      <div className="mt-6">
        <Link href="/playbooks/new">
          <Button>Nuevo Playbook</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Componente de loading
 */
function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-2 text-sm text-gray-500">Cargando playbooks...</p>
    </div>
  );
}

/**
 * Página principal de playbooks con DataTable
 */
export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Cargar playbooks
  const fetchPlaybooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/playbooks?includeInactive=${showInactive}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPlaybooks(data);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, [showInactive]);

  // Handler para desactivar playbook
  const handleDeactivate = async (playbookId: string) => {
    if (!confirm('¿Desactivar este playbook? Ya no aparecerá en la lista por defecto.')) {
      return;
    }

    try {
      const res = await fetch(`/api/playbooks/${playbookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (res.ok) {
        await fetchPlaybooks();
      }
    } catch (error) {
      console.error('Error deactivating playbook:', error);
    }
  };

  // Handler para duplicar playbook
  const handleDuplicate = async (playbookId: string) => {
    try {
      const res = await fetch(`/api/playbooks/${playbookId}`, {
        method: 'POST', // POST en [id] = duplicar
      });

      if (res.ok) {
        await fetchPlaybooks();
      }
    } catch (error) {
      console.error('Error duplicating playbook:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Playbooks de Cobranza</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las secuencias automatizadas de mensajes de cobranza
            </p>
          </div>
          <Link href="/playbooks/new">
            <Button>Nuevo Playbook</Button>
          </Link>
        </div>

        {/* Filtro de inactivos */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked as boolean)}
          />
          <label htmlFor="show-inactive" className="text-sm cursor-pointer">
            Mostrar playbooks inactivos
          </label>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <LoadingState />
        ) : playbooks.length === 0 && !showInactive ? (
          <EmptyState />
        ) : (
          <PlaybooksTable
            data={playbooks}
            onDeactivate={handleDeactivate}
            onDuplicate={handleDuplicate}
          />
        )}
      </div>
    </div>
  );
}
