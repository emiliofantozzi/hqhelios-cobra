/**
 * Landing page - Dark Finance Premium
 *
 * @module app/page
 */
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Bot,
  MessageSquare,
  LineChart,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white overflow-x-hidden">
      {/* ========================================
          BACKGROUND EFFECTS
          ======================================== */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Mesh Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-600/8 rounded-full blur-[100px] animate-float animate-delay-200" />
        <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[80px] animate-float animate-delay-400" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />

        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0d14_70%)]" />
      </div>

      {/* ========================================
          NAVIGATION
          ======================================== */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover-scale">
              <Image
                src="/brand/logo.svg"
                alt="COBRA"
                width={28}
                height={28}
                className="h-7 w-auto"
              />
              <span className="text-lg font-semibold tracking-tight">
                Cobra
              </span>
            </Link>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/5 transition-smooth hidden sm:inline-flex"
              >
                <Link href="/sign-in">Iniciar sesion</Link>
              </Button>
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-smooth"
              >
                <Link href="/sign-up">
                  Comenzar gratis
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ========================================
            HERO SECTION
            ======================================== */}
        <section className="relative min-h-screen flex items-center pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <div className="mx-auto max-w-4xl text-center">
              {/* Sponsor Badge */}
              <div className="animate-fade-in-up mb-8 flex justify-center">
                <div className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-2 text-xs font-medium text-gray-400 hover-scale cursor-default">
                  <span>Sponsored by</span>
                  <Image
                    src="/brand/Logo Helios Greyscale.svg"
                    alt="Helios"
                    width={60}
                    height={16}
                    className="h-4 w-auto opacity-70"
                  />
                </div>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up animate-delay-100 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6">
                Automatiza tus cobranzas con un{' '}
                <span className="text-gradient">agente de IA</span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-in-up animate-delay-200 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Delega todo el proceso de cobranzas y seguimiento de facturas a
                un agente inteligente que contacta a tus clientes por email y
                WhatsApp.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-6 text-base font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 animate-glow transition-smooth group"
                >
                  <Link href="/sign-up">
                    Comenzar gratis
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-semibold border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-smooth"
                >
                  <Link href="/sign-in">Iniciar sesion</Link>
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="animate-fade-in-up animate-delay-400 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {[
                  { icon: CheckCircle, text: 'Empieza gratis' },
                  { icon: Shield, text: 'Sin tarjeta' },
                  { icon: Zap, text: 'Acceso inmediato' },
                ].map((item, index) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-default"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <item.icon className="w-4 h-4 text-emerald-400" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in animate-delay-700">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* ========================================
            SOCIAL PROOF SECTION
            ======================================== */}
        <section className="relative py-16 border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
              {[
                { value: '500+', label: 'Empresas activas' },
                { value: '$10M+', label: 'Cobrado con exito' },
                { value: '24/7', label: 'Automatizacion continua' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center px-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================
            FEATURES SECTION
            ======================================== */}
        <section className="relative py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
                Todo lo que necesitas para{' '}
                <span className="text-gradient">cobrar mas</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Herramientas inteligentes que trabajan por ti mientras duermes
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: Bot,
                  title: 'Agente de IA',
                  description:
                    'Un agente inteligente que gestiona automaticamente tus cobranzas, contactando clientes por email y WhatsApp con mensajes personalizados.',
                },
                {
                  icon: MessageSquare,
                  title: 'Multi-canal',
                  description:
                    'Integra email y WhatsApp para mantener comunicacion constante con tus clientes de forma automatizada y efectiva.',
                },
                {
                  icon: LineChart,
                  title: 'Trazabilidad completa',
                  description:
                    'Registra todas las interacciones y manten un historial completo de cada caso de cobranza con metricas en tiempo real.',
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group glass glass-hover rounded-2xl p-8 hover-lift animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30 transition-smooth">
                    <feature.icon className="w-7 h-7 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-50 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================
            HOW IT WORKS SECTION
            ======================================== */}
        <section className="relative py-24 sm:py-32 bg-white/[0.02]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
                Como funciona
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Tres simples pasos para automatizar tus cobranzas
              </p>
            </div>

            {/* Steps */}
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection Line */}
                <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                {[
                  {
                    step: '01',
                    title: 'Conecta tus facturas',
                    description:
                      'Importa tus facturas pendientes o conecta tu sistema de facturacion.',
                  },
                  {
                    step: '02',
                    title: 'Configura tu playbook',
                    description:
                      'Define la secuencia de mensajes y los intervalos de seguimiento.',
                  },
                  {
                    step: '03',
                    title: 'El agente trabaja por ti',
                    description:
                      'Nuestro agente de IA contacta a tus clientes y gestiona las cobranzas.',
                  },
                ].map((item, index) => (
                  <div
                    key={item.step}
                    className="relative text-center animate-fade-in-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Step Number */}
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center relative">
                      <span className="text-3xl font-display font-bold text-emerald-400">
                        {item.step}
                      </span>
                      {/* Pulse Ring */}
                      <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 animate-ping opacity-20" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            FINAL CTA SECTION
            ======================================== */}
        <section className="relative py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-medium text-emerald-400 mb-8 animate-fade-in-up">
                <Clock className="w-3.5 h-3.5" />
                <span>Configuracion en menos de 5 minutos</span>
              </div>

              {/* Headline */}
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mb-6 animate-fade-in-up animate-delay-100">
                Listo para cobrar{' '}
                <span className="text-gradient">sin esfuerzo</span>?
              </h2>

              {/* Subheadline */}
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto animate-fade-in-up animate-delay-200">
                Unete a mas de 500 empresas que ya automatizaron sus cobranzas y
                recuperaron tiempo valioso.
              </p>

              {/* CTA */}
              <div className="animate-fade-in-up animate-delay-300">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-7 text-lg font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 animate-glow transition-smooth group"
                >
                  <Link href="/sign-up">
                    Comenzar ahora - Es gratis
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500 animate-fade-in-up animate-delay-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="relative border-t border-white/5 bg-black/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.svg"
                alt="COBRA"
                width={20}
                height={20}
                className="h-5 w-auto opacity-60"
              />
              <span className="text-sm text-gray-500">
                © 2025 COBRA. Todos los derechos reservados.
              </span>
            </div>

            {/* Sponsor */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sponsored by</span>
              <Image
                src="/brand/Logo Helios Greyscale.svg"
                alt="Helios"
                width={60}
                height={16}
                className="h-4 w-auto opacity-50"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
