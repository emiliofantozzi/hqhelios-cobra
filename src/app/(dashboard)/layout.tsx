/**
 * Layout para las rutas del dashboard (route group).
 * Incluye sidebar y header para todas las páginas dentro de (dashboard).
 *
 * @module app/(dashboard)/layout
 */
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Cobra
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)]">
          <nav className="p-4 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
            <Link
              href="/companies"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Empresas
            </Link>
            <Link
              href="/invoices"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Facturas
            </Link>
            <Link
              href="/collections"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cobranzas
            </Link>
            <Link
              href="/playbooks"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Playbooks
            </Link>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
