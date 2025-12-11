/**
 * Página de listado de cobranzas
 * Story 4.5: Visibilidad de Mensajes Programados
 *
 * @module app/(dashboard)/collections
 */
'use client';

import { useState, useEffect } from 'react';
import { CollectionsTable } from '@/components/tables/collections-table';
import type { CollectionListItem } from '@/lib/services/collection-service';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          setCollections(data);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollections();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando cobranzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cobranzas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona los playbooks activos y revisa el estado de las cobranzas
          </p>
        </div>
      </div>

      <CollectionsTable data={collections} />
    </div>
  );
}
