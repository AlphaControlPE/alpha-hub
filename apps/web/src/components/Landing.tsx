'use client';

import Link from 'next/link';
import { FeedSolicitacoes } from '@/components/FeedSolicitacoes';

// Landing para visitante (não logado). Apresenta o produto antes de mostrar o
// feed público de solicitações (que segue acessível, embutido no fim). Linguagem
// visual "Alpha Control" via tokens: funciona em dark e light.

const PASSOS = [
  { n: '01', t: 'Publique', d: 'Descreva o que precisa em minutos. É grátis e sem compromisso.' },
  { n: '02', t: 'Receba propostas', d: 'Prestadores enviam valor, prazo e mensagem. Você compara lado a lado.' },
  { n: '03', t: 'Negocie no chat', d: 'Converse em tempo real, alinhe detalhes e ajuste o escopo.' },
  { n: '04', t: 'Feche e avalie', d: 'Aceite a melhor proposta e avalie ao final. Reputação de verdade.' },
];

const DIFERENCIAIS = [
  {
    t: 'Núcleo 100% gratuito',
    d: 'Publicar, propor, conversar e avaliar nunca custa. Sem crédito, sem cobrança por proposta.',
    destaque: true,
  },
  {
    t: 'Reputação que significa algo',
    d: 'Notas de comunicação, qualidade e prazo, ligadas a negócios reais, não a estrelas soltas.',
    destaque: false,
  },
  {
    t: 'Indicações com consentimento',
    d: 'Indique contatos com base legal (LGPD). O contato fica mascarado até a reserva.',
    destaque: false,
  },
  {
    t: 'Negociação em tempo real',
    d: 'Chat com histórico e sala privada por proposta. Formalize com contrato quando fechar.',
    destaque: false,
  },
];

const CATEGORIAS = ['design', 'desenvolvimento', 'marketing', 'redação', 'consultoria'];

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ maxWidth: 680 }}>
        <p className="pill">
          <span
            aria-hidden="true"
            style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--ok)', display: 'inline-block' }}
          />
          Grátis para participar, rigoroso para proteger
        </p>
        <h1 className="h1">Peça, receba propostas e feche no chat.</h1>
        <p className="muted" style={{ maxWidth: 560, fontSize: 16, lineHeight: 1.6 }}>
          Publique uma solicitação, receba propostas reais e negocie direto com quem faz.
          Sem créditos, sem paywall, sem cobrança por proposta.
        </p>
        <div className="row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
          <Link href="/login" className="btn btn-primary">Criar conta grátis</Link>
          <a href="#solicitacoes" className="btn btn-ghost">Ver solicitações abertas</a>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ padding: '10px 0 8px' }}>
        <h2 className="h2">Como funciona</h2>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}
        >
          {PASSOS.map((p) => (
            <div key={p.n}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: 'var(--accent-tint)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {p.n}
              </span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, margin: '0 0 6px' }}>
                {p.t}
              </h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferenciais */}
      <section style={{ padding: '22px 0 8px' }}>
        <h2 className="h2">Por que o Alpha Hub</h2>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}
        >
          {DIFERENCIAIS.map((c) => (
            <div
              key={c.t}
              className="card card-pad"
              style={
                c.destaque
                  ? { background: 'var(--accent-tint)', borderColor: 'var(--accent-border)' }
                  : undefined
              }
            >
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
                {c.t}
              </h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section style={{ padding: '22px 0 8px' }}>
        <div className="between" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Explore por categoria</h2>
          <Link href="/planos" className="muted" style={{ fontSize: 13 }}>Ver planos opcionais →</Link>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIAS.map((c) => (
            <Link
              key={c}
              href={`/?categoria=${encodeURIComponent(c)}#solicitacoes`}
              className="chip"
              style={{ padding: '7px 14px', fontSize: 13 }}
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section
        style={{
          marginTop: 28,
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          borderRadius: 'var(--radius-card)',
          padding: 'clamp(28px, 5vw, 44px)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem, 1.1rem + 1vw, 1.9rem)', fontWeight: 600, margin: '0 0 8px', color: 'var(--accent-fg)' }}>
          Comece agora. É grátis.
        </h2>
        <p style={{ margin: '0 auto 18px', maxWidth: 460, opacity: 0.85, fontSize: 15 }}>
          Crie sua conta e publique a primeira solicitação hoje. Sem cartão, sem cobrança por proposta.
        </p>
        <Link
          href="/login"
          className="btn"
          style={{ background: 'var(--surface)', color: 'var(--text)', fontWeight: 600 }}
        >
          Criar conta grátis
        </Link>
      </section>

      {/* Feed público */}
      <section id="solicitacoes" style={{ paddingTop: 34, scrollMarginTop: 80 }}>
        <h2 className="h2">Solicitações abertas</h2>
        <FeedSolicitacoes />
      </section>
    </>
  );
}
