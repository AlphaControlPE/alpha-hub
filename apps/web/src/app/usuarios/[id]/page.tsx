'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { PerfilPublico, Reputacao } from '@/lib/types';

function BarraNota({ label, valor }: { label: string; valor: number }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="muted" style={{ fontSize: 12 }}>{valor} / 5</span>
      </div>
      <div style={{ height: 10, background: 'var(--bg-soft)', borderRadius: 999 }}>
        <div
          style={{
            width: `${(valor / 5) * 100}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          }}
        />
      </div>
    </div>
  );
}

export default function PerfilPublicoPage() {
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [rep, setRep] = useState<Reputacao | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([
      api<PerfilPublico>(`/usuarios/${id}/perfil`),
      api<Reputacao>(`/usuarios/${id}/reputacao`).catch(() => null),
    ])
      .then(([p, r]) => {
        if (!ativo) return;
        setPerfil(p);
        setRep(r);
      })
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : 'Perfil não encontrado'));
    return () => {
      ativo = false;
    };
  }, [id]);

  if (erro) return <div className="empty">{erro}</div>;
  if (!perfil) return <div className="empty">Carregando…</div>;

  const desde = new Date(perfil.criadoEm).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ maxWidth: 860, margin: '16px auto' }}>
      <Link href="/" className="muted" style={{ fontSize: 13 }}>← voltar para solicitações</Link>

      {/* Cabeçalho do perfil */}
      <div className="card card-pad" style={{ marginTop: 12 }}>
        <div className="row" style={{ gap: 16 }}>
          <span className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>
            {perfil.nome.charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1 }}>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <h1 className="h1" style={{ marginBottom: 0 }}>{perfil.nome}</h1>
              {perfil.verificado && (
                <span className="badge ACEITA" title="Identidade verificada">✓ verificado</span>
              )}
            </div>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>membro desde {desde}</p>
          </div>
        </div>
        {perfil.bio && <p style={{ marginTop: 14, lineHeight: 1.55 }}>{perfil.bio}</p>}
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        {/* Coluna principal: portfólio + serviços */}
        <div className="stack">
          <h2 className="h2">Portfólio</h2>
          {perfil.portfolio.length === 0 ? (
            <div className="card card-pad empty">Nenhum caso publicado ainda.</div>
          ) : (
            perfil.portfolio.map((p) => (
              <div key={p.id} className="card card-pad">
                <h3 className="title">{p.titulo}</h3>
                <p className="muted" style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5 }}>{p.descricao}</p>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    ver trabalho ↗
                  </a>
                )}
              </div>
            ))
          )}

          <h2 className="h2" style={{ marginTop: 10 }}>Serviços</h2>
          {perfil.servicos.length === 0 ? (
            <div className="card card-pad empty">Nenhum serviço cadastrado.</div>
          ) : (
            perfil.servicos.map((s) => (
              <div key={s.id} className="card card-pad">
                <div className="between">
                  <h3 className="title">{s.titulo}</h3>
                  <span className="chip">
                    {s.precoBase != null ? `a partir de ${centavosParaReal(s.precoBase)}` : 'a combinar'}
                  </span>
                </div>
                <p className="muted" style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5 }}>{s.descricao}</p>
              </div>
            ))
          )}
        </div>

        {/* Coluna lateral: reputação multidimensional (Parte X) */}
        <div>
          <h2 className="h2">Reputação</h2>
          <div className="card card-pad">
            {!rep || rep.total === 0 ? (
              <p className="empty" style={{ padding: 10 }}>Sem avaliações ainda.</p>
            ) : (
              <>
                <div className="row" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 34, fontWeight: 800 }}>★ {rep.media.geral}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{rep.total} avaliação(ões)</span>
                </div>
                <BarraNota label="Comunicação" valor={rep.media.comunicacao} />
                <BarraNota label="Qualidade" valor={rep.media.qualidade} />
                <BarraNota label="Prazo" valor={rep.media.prazo} />
                <div className="sep" />
                <div className="stack" style={{ gap: 10 }}>
                  {rep.avaliacoes.slice(0, 5).map((a, i) =>
                    a.comentario ? (
                      <div key={i} style={{ fontSize: 13 }}>
                        <span className="muted">“{a.comentario}”</span>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>— {a.autor.nome}</div>
                      </div>
                    ) : null,
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
