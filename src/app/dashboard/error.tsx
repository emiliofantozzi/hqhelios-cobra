'use client';

/**
 * Error boundary para el dashboard.
 * Captura errores en el Server Component y muestra un mensaje amigable.
 *
 * @module app/dashboard/error
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Dashboard error:', error);

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Error al cargar el dashboard
        </h2>
        <p className="text-red-700 mb-4">
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        {error.digest && (
          <p className="text-sm text-red-600 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
