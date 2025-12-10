/**
 * Layout raiz de la aplicacion con ClerkProvider.
 *
 * @module app/layout
 */
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, DM_Serif_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Cobra Collections',
  description: 'Plataforma de automatizacion de cobranzas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${inter.className} ${dmSerif.variable}`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
