/**
 * Pagina de dashboard (protegida por middleware).
 *
 * @module app/dashboard/page
 */
import { UserButton } from '@clerk/nextjs';

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <p className="text-gray-600">
        Bienvenido al dashboard. Esta pagina esta protegida por autenticacion.
      </p>
    </div>
  );
}
