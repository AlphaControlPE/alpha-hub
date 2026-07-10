import type { Metadata } from 'next';

// Fallback offline do service worker (precacheado em sw.js). Estilos inline
// de propósito: precisa renderizar bem mesmo sem o CSS/JS do app no cache.
// Paleta do design "Alpha Control" (dark), coerente com globals.css.
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
        background: '#0b0d12',
        color: '#f1f3f8',
        fontFamily:
          "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
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
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            fontSize: 38,
            fontWeight: 700,
            color: '#5b82ff',
            background: 'rgba(91,130,255,0.16)',
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          A
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            margin: '0 0 8px',
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          Você está offline
        </h1>
        <p style={{ color: '#98a0b3', maxWidth: 380, margin: '0 auto 22px', fontSize: 15, lineHeight: 1.5 }}>
          Não foi possível conectar ao Alpha Hub. Verifique sua internet — o
          conteúdo volta assim que a conexão retornar.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            borderRadius: 9,
            fontWeight: 600,
            fontSize: 14,
            color: '#0a0d14',
            background: '#5b82ff',
            textDecoration: 'none',
          }}
        >
          Tentar de novo
        </a>
      </div>
    </div>
  );
}
