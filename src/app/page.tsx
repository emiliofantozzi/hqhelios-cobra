/**
 * Pagina principal (landing) de la aplicacion.
 *
 * @module app/page
 */
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const { userId } = await auth();

  // Si ya esta autenticado, redirigir al dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50" />

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Sponsored Badge */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-gray-800 border border-gray-200">
                <span>Sponsored by</span>
                <Image
                  src="/brand/Logo Helios Greyscale.svg"
                  alt="Helios"
                  width={16}
                  height={16}
                  className="h-4 w-auto"
                />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6">
              Automatiza tus cobranzas con un agente de IA
            </h1>

            {/* Sub-headline */}
            <p className="text-balance text-lg text-muted-foreground sm:text-xl mb-10 max-w-2xl mx-auto">
              Delega todo el proceso de cobranzas y seguimiento de facturas a un
              agente inteligente que contacta a tus clientes por email y
              WhatsApp.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Link href="/sign-up">Comenzar gratis</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base font-semibold"
              >
                <Link href="/sign-in">Iniciar sesion</Link>
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Empieza gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Sin tarjeta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Acceso inmediato</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-200">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-semibold text-center mb-12 text-foreground">
              Automatiza tus cobranzas con inteligencia artificial
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg bg-white border border-slate-200">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Agente de IA
                </h3>
                <p className="text-muted-foreground">
                  Un agente inteligente que gestiona automaticamente tus
                  cobranzas, contactando clientes por email y WhatsApp.
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-white border border-slate-200">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Multi-canal
                </h3>
                <p className="text-muted-foreground">
                  Integra email y WhatsApp para mantener comunicacion constante
                  con tus clientes de forma automatizada.
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-white border border-slate-200">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Trazabilidad completa
                </h3>
                <p className="text-muted-foreground">
                  Registra todas las interacciones y manten un historial
                  completo de cada caso de cobranza.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/logo.svg"
                alt="COBRA Logo"
                width={24}
                height={24}
                className="h-6 w-auto"
                style={{ backgroundColor: 'transparent' }}
              />
              <span className="text-sm text-muted-foreground">
                © 2025 COBRA. Todos los derechos reservados.
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sponsored by</span>
              <Image
                src="/brand/Logo Helios Greyscale.svg"
                alt="Helios"
                width={60}
                height={16}
                className="h-4 w-auto"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
