'use client';

import { useAuth } from '@/lib/auth';
import { Landing } from '@/components/Landing';
import { FeedSolicitacoes } from '@/components/FeedSolicitacoes';
import { SkeletonList } from '@/components/Skeleton';

export default function HomePage() {
  const { usuario, carregando } = useAuth();

  // Enquanto resolve a sessão, evita "piscar" a landing para quem está logado.
  if (carregando) {
    return (
      <section className="hero">
        <SkeletonList itens={4} />
      </section>
    );
  }

  // Visitante: landing de apresentação (com o feed público embutido no fim).
  if (!usuario) return <Landing />;

  // Logado: direto ao feed de trabalho.
  return (
    <>
      <section className="hero">
        <p className="pill">● Grátis para participar · rigoroso para proteger</p>
        <h1 className="h1">Solicitações abertas no marketplace</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Encontre demandas reais, envie propostas e negocie no chat, sem créditos, sem
          paywall, sem cobrança por proposta.
        </p>
      </section>
      <FeedSolicitacoes />
    </>
  );
}
