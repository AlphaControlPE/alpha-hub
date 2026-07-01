import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Alpha Hub — marketplace gratuito de solicitações e propostas',
  description:
    'Publique solicitações, receba propostas, negocie no chat. Grátis para participar, rigoroso para proteger.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <Nav />
          <main className="container" style={{ paddingTop: 8, paddingBottom: 60 }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
