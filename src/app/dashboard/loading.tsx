/**
 * Loading state para el dashboard.
 * Se muestra mientras getCurrentUser() esta cargando.
 *
 * @module app/dashboard/loading
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Empty state skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
    </div>
  );
}
