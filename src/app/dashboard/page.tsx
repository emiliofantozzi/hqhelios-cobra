/**
 * Pagina principal del dashboard.
 * Muestra mensaje de bienvenida y KPIs basicos.
 *
 * @module app/(dashboard)/page
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-tenant-id';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user;
  let userError: string | null = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    // FIX 5: Differentiate between "user not found" and real errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('User not found in database')) {
      // Usuario nuevo, webhook aun no ha terminado de procesar
      console.log('User not found in DB yet, showing welcome message');
      userError = null; // This is expected for new users
    } else if (errorMessage.includes('User does not have a tenant assigned')) {
      // Tenant not set in Clerk - webhook might have failed
      console.error('User has no tenant_id in Clerk metadata');
      userError =
        'Tu cuenta está siendo configurada. Por favor intenta nuevamente en unos segundos.';
    } else if (errorMessage.includes('User is inactive')) {
      // User was soft-deleted
      console.error('User account is inactive');
      userError = 'Tu cuenta ha sido desactivada. Contacta a soporte.';
    } else {
      // Real error - don't hide it
      console.error('Error loading user:', error);
      userError =
        'Error cargando tu perfil. Por favor intenta nuevamente o contacta a soporte.';
    }
  }

  return (
    <div className="space-y-6">
      {/* Error message if user loading failed */}
      {userError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{userError}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-gray-600 mt-1">Panel de control de cobranzas</p>
      </div>

      {/* Placeholder KPIs - se completaran en historias posteriores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Facturas Pendientes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Facturas Vencidas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Cobranzas Activas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Monto Pendiente</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$0.00</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          Comienza agregando tu primera empresa
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Para comenzar a usar Cobra, agrega tus empresas cliente y sus
          facturas. El sistema se encargara de automatizar el proceso de
          cobranzas.
        </p>
        <button
          disabled
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
        >
          Agregar Empresa (proximamente)
        </button>
      </div>
    </div>
  );
}
