'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { ResultadoBusca } from '@/lib/types';
import { SkeletonList } from '@/components/Skeleton';
import { IconSearch } from '@/components/icons';

// Busca global (solicitações + comunidade), consumindo GET /api/busca?q=.
// Complementa a busca local da home (FeedSolicitacoes, que filtra só
// solicitações): esta página é o destino de "buscar em tudo".
export default function BuscaPage() {
  const [q, setQ] = useState('');
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  // Busca deep-linkável: semeia o campo a partir de ?q= ao montar.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get('q');
    if (q0) setQ(q0);
  }, []);

  const carregar = useCallback(async () => {
    const termo = q.trim();
    // Mantém a URL sincronizada com a busca (compartilhável, sem recarregar).
    window.history.replaceState(null, '', termo ? `/busca?q=${encodeURIComponent(termo)}` : '/busca');

    if (!termo) {
      setResultado(null);
      setErro(false);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(false);
    try {
      const r = await api<ResultadoBusca>(`/busca?q=${encodeURIComponent(termo)}`);
      setResultado(r);
    } catch {
      // Rede/API indisponível: mostra estado de erro com opção de tentar de novo.
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(carregar, 250);
    return () => clearTimeout(t);
  }, [carregar]);

  const total = (resultado?.solicitacoes.length ?? 0) + (resultado?.insights.length ?? 0);

  return (
    <>
      <section className="hero">
        <h1 className="h1">Busca</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Encontre solicitações e conteúdo da comunidade em um só lugar.
        </p>
      </section>

      <div className="filtros">
        <div className="search-box">
          <IconSearch />
          <input
            aria-label="Buscar em tudo"
            placeholder="Buscar solicitações e comunidade…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        {!carregando && !erro && q.trim() && (
          <span className="cont-resultados">{total} resultado(s)</span>
        )}
      </div>

      {carregando ? (
        <div className="card">
          <SkeletonList itens={4} />
        </div>
      ) : erro ? (
        <div className="card empty">
          <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
          <strong>Não foi possível buscar</strong>
          <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
            Verifique sua conexão e tente novamente.
          </p>
          <button className="btn btn-primary btn-sm" onClick={carregar}>Tentar de novo</button>
        </div>
      ) : !q.trim() ? (
        <div className="card empty">
          <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>🔎</div>
          <strong>Busque por qualquer coisa</strong>
          <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
            Digite um termo acima para buscar em solicitações e na comunidade.
          </p>
        </div>
      ) : total === 0 ? (
        <div className="card empty">
          <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>🤷</div>
          <strong>Nada encontrado para &quot;{q}&quot;</strong>
          <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
            Tente outro termo de busca.
          </p>
        </div>
      ) : (
        <>
          {resultado!.solicitacoes.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <h2 className="h2">Solicitações</h2>
              <div className="card">
                {resultado!.solicitacoes.map((s) => (
                  <Link key={s.id} href={`/solicitacoes/${s.id}`} className="sol-item">
                    <div className="between">
                      <h3 className="title">{s.titulo}</h3>
                      <span className={`badge ${s.status}`}>{s.status.replace('_', ' ')}</span>
                    </div>
                    <p className="muted" style={{ margin: '6px 0 10px', fontSize: 14 }}>
                      {s.descricao.length > 160 ? `${s.descricao.slice(0, 160)}…` : s.descricao}
                    </p>
                    <div className="row" style={{ flexWrap: 'wrap' }}>
                      <span className="chip">{s.categoria}</span>
                      <span className="chip">orçamento {centavosParaReal(s.orcamento)}</span>
                      <span className="chip">{s._count?.propostas ?? 0} proposta(s)</span>
                      <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>por {s.autor.nome}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {resultado!.insights.length > 0 && (
            <div>
              <h2 className="h2">Comunidade</h2>
              <div className="stack">
                {resultado!.insights.map((i) => (
                  <Link key={i.id} href={`/comunidade/${i.id}`} className="card card-pad" style={{ display: 'block' }}>
                    <div className="between">
                      <h3 className="title">{i.titulo}</h3>
                      <span className="chip">{i.categoria}</span>
                    </div>
                    <p className="muted" style={{ margin: '8px 0 12px', fontSize: 14 }}>
                      {i.conteudo.length > 180 ? `${i.conteudo.slice(0, 180)}…` : i.conteudo}
                    </p>
                    <div className="row">
                      <span className="muted" style={{ fontSize: 12.5 }}>▲ {i._count?.votos ?? 0} votos · {i._count?.comentarios ?? 0} comentários</span>
                      <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>por {i.autor.nome}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
