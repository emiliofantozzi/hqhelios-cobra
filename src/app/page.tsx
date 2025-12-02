/**
 * Pagina principal publica.
 *
 * @module app/page
 */
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Cobra Collections</h1>
      <p className="text-gray-600 mb-8">
        Plataforma de automatizacion de cobranzas
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Iniciar Sesion
        </Link>
        <Link
          href="/sign-up"
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}
