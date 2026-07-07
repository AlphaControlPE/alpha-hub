import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Nav } from '@/components/Nav';
import { SwRegister } from '@/components/SwRegister';
import { SITE_URL } from '@/lib/site';

const DESCRICAO =
  'Publique solicitações, receba propostas e negocie no chat em tempo real. Grátis para participar, rigoroso para proteger.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Alpha Hub',
  title: {
    default: 'Alpha Hub — marketplace gratuito de solicitações e propostas',
    template: '%s · Alpha Hub',
  },
  description: DESCRICAO,
  keywords: [
    'marketplace',
    'solicitações',
    'propostas',
    'orçamentos',
    'serviços',
    'freelancer',
    'indicações',
    'Brasil',
    'gratuito',
  ],
  authors: [{ name: 'Alpha Hub' }],
  creator: 'Alpha Hub',
  category: 'business',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alpha Hub',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Alpha Hub',
    title: 'Alpha Hub — marketplace gratuito de solicitações e propostas',
    description: DESCRICAO,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Alpha Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Hub — marketplace gratuito de solicitações e propostas',
    description: DESCRICAO,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Alpha Hub',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: DESCRICAO,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Alpha Hub',
      url: SITE_URL,
      description: DESCRICAO,
      inLanguage: 'pt-BR',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        <SwRegister />
        <AuthProvider>
          <Nav />
          <main id="conteudo" tabIndex={-1} className="container" style={{ paddingTop: 8, paddingBottom: 40 }}>
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
