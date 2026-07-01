'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Insight } from '@/lib/types';

export default function ComunidadePage() {
  const { usuario } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [ordenar, setOrdenar] = useState<'top' | 'recentes'>('top');
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState('design');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const r = await api<Insight[]>(`/insights?ordenar=${ordenar}`);
    setInsights(r);
  }, [ordenar]);

  useEffect(() => { carregar(); }, [carregar]);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api<Insight>('/insights', { method: 'POST', body: JSON.stringify({ titulo, conteudo, categoria }) });
      setTitulo(''); setConteudo(''); setCriando(false);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao publicar');
    }
  }

  async function votar(id: string) {
    const r = await api<{ votou: boolean; total: number }>(`/insights/${id}/voto`, { method: 'POST' });
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, votou: r.votou, _count: { ...(i._count ?? { votos: 0, comentarios: 0 }), votos: r.total } } : i)));
  }

  return (
    <>
      <section className="hero">
        <span className="pill">● Inteligência coletiva</span>
        <h1 className="h1">Comunidade & Insights</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Conhecimento prático preservado e pesquisável — vote no que ajuda e some à conversa.
        </p>
      </section>

      <div className="between" style={{ marginBottom: 16 }}>
        <div className="tabs" style={{ maxWidth: 260, marginBottom: 0 }}>
          <button className={ordenar === 'top' ? 'active' : ''} onClick={() => setOrdenar('top')}>Mais votados</button>
          <button className={ordenar === 'recentes' ? 'active' : ''} onClick={() => setOrdenar('recentes')}>Recentes</button>
        </div>
        {usuario && (
          <button className="btn btn-primary btn-sm" onClick={() => setCriando((v) => !v)}>
            {criando ? 'Cancelar' : '+ Novo insight'}
          </button>
        )}
      </div>

      {criando && usuario && (
        <form className="card card-pad" style={{ marginBottom: 16 }} onSubmit={publicar}>
          <label className="field">
            <span className="lbl">Título</span>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </label>
          <label className="field">
            <span className="lbl">Conteúdo</span>
            <textarea className="textarea" value={conteudo} onChange={(e) => setConteudo(e.target.value)} required />
          </label>
          <div className="row">
            <select className="input" style={{ maxWidth: 200 }} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {['design', 'desenvolvimento', 'marketing', 'consultoria', 'redação', 'outros'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary">Publicar</button>
          </div>
          {erro && <p className="error" style={{ marginTop: 10 }}>{erro}</p>}
        </form>
      )}

      <div className="stack">
        {insights.length === 0 && <div className="card card-pad empty">Nenhum insight ainda.</div>}
        {insights.map((i) => (
          <div key={i.id} className="card card-pad">
            <div className="between">
              <Link href={`/comunidade/${i.id}`}><h3 className="title">{i.titulo}</h3></Link>
              <span className="chip">{i.categoria}</span>
            </div>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: 14 }}>
              {i.conteudo.length > 180 ? `${i.conteudo.slice(0, 180)}…` : i.conteudo}
            </p>
            <div className="row">
              <button
                className={`btn btn-sm ${i.votou ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => (usuario ? votar(i.id) : (window.location.href = '/login'))}
              >
                ▲ {i._count?.votos ?? 0} {i.votou ? 'votado' : 'votar'}
              </button>
              <Link href={`/comunidade/${i.id}`} className="btn btn-ghost btn-sm">💬 {i._count?.comentarios ?? 0} comentários</Link>
              <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>por {i.autor.nome}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
