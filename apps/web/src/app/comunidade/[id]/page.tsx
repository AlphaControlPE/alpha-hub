'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Insight } from '@/lib/types';
import { ReportButton } from '@/components/ReportButton';

export default function InsightDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [comentario, setComentario] = useState('');

  const carregar = useCallback(async () => {
    setInsight(await api<Insight>(`/insights/${id}`));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!insight) return <div className="empty">Carregando…</div>;

  async function comentar(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;
    await api(`/insights/${id}/comentarios`, { method: 'POST', body: JSON.stringify({ conteudo: comentario }) });
    setComentario('');
    await carregar();
  }

  async function votar() {
    if (!usuario) { window.location.href = '/login'; return; }
    await api(`/insights/${id}/voto`, { method: 'POST' });
    await carregar();
  }

  async function removerInsight() {
    await api(`/insights/${id}`, { method: 'DELETE' });
    router.push('/comunidade');
  }

  async function removerComentario(comentarioId: string) {
    await api(`/insights/${id}/comentarios/${comentarioId}`, { method: 'DELETE' });
    await carregar();
  }

  const ehAutor = usuario?.id === insight.autor.id;

  return (
    <div style={{ maxWidth: 720, margin: '16px auto' }}>
      <Link href="/comunidade" className="muted" style={{ fontSize: 13 }}>← voltar para comunidade</Link>
      <div className="card card-pad" style={{ marginTop: 12 }}>
        <div className="between">
          <h1 className="h1" style={{ marginBottom: 0 }}>{insight.titulo}</h1>
          <span className="chip">{insight.categoria}</span>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '8px 0 16px' }}>por {insight.autor.nome}</p>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{insight.conteudo}</p>
        <div className="sep" />
        <div className="row">
          <button className={`btn btn-sm ${insight.votou ? 'btn-accent' : 'btn-ghost'}`} onClick={votar}>
            ▲ {insight._count?.votos ?? 0} {insight.votou ? 'votado' : 'votar'}
          </button>
          {ehAutor && <button className="btn btn-ghost btn-sm" onClick={removerInsight}>Remover insight</button>}
          {usuario && !ehAutor && <ReportButton alvoTipo="INSIGHT" alvoId={insight.id} />}
        </div>
      </div>

      <h2 className="h2" style={{ marginTop: 24 }}>Comentários</h2>
      {usuario && (
        <form className="card card-pad" style={{ marginBottom: 12 }} onSubmit={comentar}>
          <div className="row">
            <input className="input" placeholder="Escreva um comentário…" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            <button className="btn btn-primary">Enviar</button>
          </div>
        </form>
      )}
      <div className="stack">
        {(insight.comentarios ?? []).length === 0 && <div className="card card-pad empty">Sem comentários ainda.</div>}
        {(insight.comentarios ?? []).map((c) => (
          <div key={c.id} className="card card-pad">
            <div className="between" style={{ marginBottom: 6 }}>
              <div className="row" style={{ marginBottom: 0 }}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{c.autor.nome.charAt(0).toUpperCase()}</span>
                <strong style={{ fontSize: 14 }}>{c.autor.nome}</strong>
              </div>
              {usuario && usuario.id === c.autor.id && (
                <button className="btn btn-ghost btn-sm" onClick={() => removerComentario(c.id)}>remover</button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>{c.conteudo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
