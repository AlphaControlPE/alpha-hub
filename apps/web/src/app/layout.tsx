import type { Metadata } from 'next';
import Link from 'next/link';
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
          <main className="container" style={{ paddingTop: 8, paddingBottom: 40 }}>
            {children}
          </main>
          <footer style={{ borderTop: '1px solid var(--border)', marginTop: 20 }}>
            <div className="container" style={{ padding: '20px 0', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
              <span>© {new Date().getFullYear()} Alpha Hub</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <Link href="/termos" style={{ color: 'var(--text-dim)' }}>Termos de Uso</Link>
              <Link href="/privacidade" style={{ color: 'var(--text-dim)' }}>Privacidade</Link>
              <span style={{ marginLeft: 'auto', opacity: 0.7 }}>Grátis para participar · rigoroso para proteger</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
