import Link from 'next/link';

// 404 com marca — renderiza dentro do layout raiz (mantém nav e rodapé).
export default function NotFound() {
  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
        </div>
        <h1 className="h2" style={{ marginBottom: 8 }}>Página não encontrada</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          O que você procura pode ter sido movido, encerrado ou nunca existiu.
          As solicitações abertas continuam na home.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">Ver solicitações</Link>
          <Link href="/comunidade" className="btn btn-ghost">Ir à comunidade</Link>
        </div>
      </div>
    </div>
  );
}
