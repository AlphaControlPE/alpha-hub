import type { Metadata } from 'next';

// Fallback offline do service worker (precacheado em sw.js). Estilos inline
// de propósito: precisa renderizar bem mesmo sem o CSS/JS do app no cache.
// Paleta do tema "Editorial sério" (globals.css).
export const metadata: Metadata = {
  title: 'Você está offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'grid',
        placeItems: 'center',
        background: '#f1f1ef',
        color: '#1a1c20',
        fontFamily:
          "'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div>
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 20px',
            border: '1px solid #1a1c20',
            display: 'grid',
            placeItems: 'center',
            fontSize: 40,
            fontWeight: 600,
            color: '#1a1c20',
            background: '#ffffff',
            fontFamily: "'Newsreader', Georgia, serif",
          }}
        >
          A
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            fontFamily: "'Newsreader', Georgia, serif",
          }}
        >
          Você está offline
        </h1>
        <p style={{ color: '#565a63', maxWidth: 380, margin: '0 auto 22px', fontSize: 15, lineHeight: 1.5 }}>
          Não foi possível conectar ao Alpha Hub. Verifique sua internet — o
          conteúdo volta assim que a conexão retornar.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            fontWeight: 600,
            fontSize: 14,
            color: '#fcfcfb',
            background: '#1a1c20',
            textDecoration: 'none',
          }}
        >
          Tentar de novo
        </a>
      </div>
    </div>
  );
}
