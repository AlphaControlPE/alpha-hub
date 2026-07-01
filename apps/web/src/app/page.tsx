'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { Paginated, Solicitacao } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const CATEGORIAS = ['', 'design', 'desenvolvimento', 'marketing', 'redação', 'consultoria'];

export default function HomePage() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<Solicitacao[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [recomendadas, setRecomendadas] = useState<(Solicitacao & { motivos: string[] })[]>([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    try {
      const r = await api<Paginated<Solicitacao>>(`/solicitacoes?${params.toString()}`);
      setDados(r.dados);
      setTotal(r.meta.total);
    } finally {
      setCarregando(false);
    }
  }, [q, categoria]);

  useEffect(() => {
    const t = setTimeout(carregar, 250);
    return () => clearTimeout(t);
  }, [carregar]);

  useEffect(() => {
    if (!usuario) { setRecomendadas([]); return; }
    api<(Solicitacao & { motivos: string[] })[]>('/matching/solicitacoes')
      .then((r) => setRecomendadas(r.slice(0, 3)))
      .catch(() => {});
  }, [usuario]);

  return (
    <>
      <section className="hero">
        <span className="pill">● Grátis para participar · rigoroso para proteger</span>
        <h1 className="h1">Solicitações abertas no marketplace</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Encontre demandas reais, envie propostas e negocie no chat — sem créditos, sem
          paywall, sem cobrança por proposta.
        </p>
        {!usuario && (
          <div className="row" style={{ marginTop: 16 }}>
            <Link href="/login" className="btn btn-primary">Criar conta grátis</Link>
            <Link href="/login" className="btn btn-ghost">Entrar</Link>
          </div>
        )}
      </section>

      {usuario && recomendadas.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <h2 className="h2">✨ Recomendadas para você</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {recomendadas.map((s) => (
              <Link key={s.id} href={`/solicitacoes/${s.id}`} className="card card-pad">
                <div className="between">
                  <strong style={{ fontSize: 15 }}>{s.titulo}</strong>
                  <span className="chip">{s.categoria}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {s.motivos.slice(0, 2).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Buscar por título ou descrição…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 200 }} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c === '' ? 'Todas as categorias' : c}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{total} resultado(s)</span>
      </div>

      <div className="card">
        {carregando ? (
          <div className="empty">Carregando…</div>
        ) : dados.length === 0 ? (
          <div className="empty">Nenhuma solicitação encontrada. {usuario && <Link href="/nova" style={{ color: 'var(--primary)' }}>Publique a primeira →</Link>}</div>
        ) : (
          dados.map((s) => (
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
          ))
        )}
      </div>
    </>
  );
}
