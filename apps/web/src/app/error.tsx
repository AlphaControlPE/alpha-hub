'use client';

import Link from 'next/link';

// Error boundary com marca — captura erros de renderização das páginas
// e oferece recuperação sem perder o usuário.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            borderRadius: 18,
            background: 'rgba(255,107,107,0.12)',
            border: '1px solid rgba(255,107,107,0.35)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 28,
          }}
        >
          ⚠️
        </div>
        <h1 className="h2" style={{ marginBottom: 8 }}>Algo deu errado</h1>
        <p className="muted" style={{ marginBottom: 6 }}>
          Um erro inesperado aconteceu ao carregar esta página. Seus dados estão
          seguros — tente de novo.
        </p>
        {error?.digest && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            código: <code>{error.digest}</code>
          </p>
        )}
        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => reset()}>Tentar de novo</button>
          <Link href="/" className="btn btn-ghost">Voltar à home</Link>
        </div>
      </div>
    </div>
  );
}
