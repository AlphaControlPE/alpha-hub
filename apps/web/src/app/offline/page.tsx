import type { Metadata } from 'next';

// Fallback offline do service worker (precacheado em sw.js). Estilos inline
// de propósito: precisa renderizar bem mesmo sem o CSS/JS do app no cache.
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
        background: '#0b1020',
        color: '#eaf0ff',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
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
            borderRadius: 20,
            background: 'linear-gradient(135deg, #5b7cff, #2ee6a6)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 40,
            fontWeight: 800,
            color: '#0b1020',
          }}
        >
          A
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Você está offline
        </h1>
        <p style={{ color: '#9fb0d8', maxWidth: 380, margin: '0 auto 22px', fontSize: 15, lineHeight: 1.5 }}>
          Não foi possível conectar ao Alpha Hub. Verifique sua internet — o
          conteúdo volta assim que a conexão retornar.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            color: '#fff',
            background: 'linear-gradient(135deg, #5b7cff, #4361ff)',
            textDecoration: 'none',
          }}
        >
          Tentar de novo
        </a>
      </div>
    </div>
  );
}
