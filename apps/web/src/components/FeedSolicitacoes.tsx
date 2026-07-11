'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { Paginated, Solicitacao } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { SkeletonList } from '@/components/Skeleton';

const CATEGORIAS = ['', 'design', 'desenvolvimento', 'marketing', 'redação', 'consultoria'];

// Feed público de solicitações: busca + filtro por categoria + lista, com a
// faixa "Recomendadas para você" quando há usuário logado. Usado tanto na home
// do usuário logado quanto embutido na landing de visitante (o núcleo é público).
export function FeedSolicitacoes() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<Solicitacao[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [recomendadas, setRecomendadas] = useState<(Solicitacao & { motivos: string[] })[]>([]);

  // Busca deep-linkável: semeia estado a partir de ?q=/?categoria= ao montar.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get('q');
    const c0 = sp.get('categoria');
    if (q0) setQ(q0);
    if (c0 && CATEGORIAS.includes(c0)) setCategoria(c0);
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    // Mantém a URL sincronizada com a busca (compartilhável, sem recarregar).
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `/?${qs}#solicitacoes` : '/');
    try {
      const r = await api<Paginated<Solicitacao>>(`/solicitacoes?${qs}`);
      setDados(r.dados);
      setTotal(r.meta.total);
    } catch {
      // Rede/API indisponível: mostra estado de erro com opção de tentar de novo.
      setErro(true);
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
          <SkeletonList itens={5} />
        ) : erro ? (
          <div className="empty">
            <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
            <strong>Não foi possível carregar as solicitações</strong>
            <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
              Verifique sua conexão e tente novamente.
            </p>
            <button className="btn btn-primary btn-sm" onClick={carregar}>Tentar de novo</button>
          </div>
        ) : dados.length === 0 ? (
          <div className="empty">
            <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>🔎</div>
            <strong>Nenhuma solicitação encontrada</strong>
            <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
              {q || categoria ? 'Tente ajustar a busca ou a categoria.' : 'Seja quem abre o mercado por aqui.'}
            </p>
            {usuario ? (
              <Link href="/nova" className="btn btn-primary btn-sm">+ Publicar solicitação</Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">Criar conta grátis</Link>
            )}
          </div>
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
