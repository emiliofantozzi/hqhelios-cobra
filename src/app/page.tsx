/**
 * Pagina principal (landing) de la aplicacion.
 *
 * @module app/page
 */
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();

  // Si ya esta autenticado, redirigir al dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cobra Collections
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Automatiza tu proceso de cobranzas y cobra mas rapido con menos
          esfuerzo.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
