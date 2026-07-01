'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BiOverview, CategoriaBi, FunilEtapa, SeriePonto } from '@/lib/types';

const ehStaff = (p?: string) => p === 'ADMIN' || p === 'MODERADOR';

function Kpi({ label, valor, sufixo }: { label: string; valor: number | string; sufixo?: string }) {
  return (
    <div className="card card-pad" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{valor}{sufixo}</div>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
    </div>
  );
}

export default function BiPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [ov, setOv] = useState<BiOverview | null>(null);
  const [funil, setFunil] = useState<FunilEtapa[]>([]);
  const [cats, setCats] = useState<CategoriaBi[]>([]);
  const [serie, setSerie] = useState<SeriePonto[]>([]);

  useEffect(() => { if (!carregando && !ehStaff(usuario?.papelSistema)) router.replace('/'); }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    const [o, f, c, s] = await Promise.all([
      api<BiOverview>('/admin/bi/overview'),
      api<FunilEtapa[]>('/admin/bi/funil'),
      api<CategoriaBi[]>('/admin/bi/categorias'),
      api<SeriePonto[]>('/admin/bi/serie?dias=30'),
    ]);
    setOv(o); setFunil(f); setCats(c); setSerie(s);
  }, []);
  useEffect(() => { if (ehStaff(usuario?.papelSistema)) carregar(); }, [usuario, carregar]);

  if (!ehStaff(usuario?.papelSistema) || !ov) return <div className="empty">Carregando…</div>;

  const maxCat = Math.max(1, ...cats.map((c) => c.total));
  const maxSerie = Math.max(1, ...serie.map((s) => s.total));

  return (
    <>
      <div className="between" style={{ marginTop: 16 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>Dados & inteligência operacional</h1>
        <Link href="/admin" className="btn btn-ghost btn-sm">← moderação</Link>
      </div>
      <p className="muted" style={{ marginBottom: 18 }}>North Star: liquidez, conversão, confiança e conhecimento — a partir da trilha de auditoria.</p>

      <h2 className="h2">Liquidez</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 22 }}>
        <Kpi label="Usuários" valor={ov.liquidez.usuarios} />
        <Kpi label="Solicitações" valor={ov.liquidez.solicitacoes} />
        <Kpi label="Abertas" valor={ov.liquidez.solicitacoesAbertas} />
        <Kpi label="Taxa com resposta" valor={ov.liquidez.taxaComResposta} sufixo="%" />
        <Kpi label="Propostas/solicitação" valor={ov.liquidez.propostasPorSolicitacao} />
      </div>

      <h2 className="h2">Conversão</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 22 }}>
        <Kpi label="Propostas" valor={ov.conversao.propostas} />
        <Kpi label="Aceitas" valor={ov.conversao.propostasAceitas} />
        <Kpi label="Taxa de aceite" valor={ov.conversao.taxaAceite} sufixo="%" />
        <Kpi label="Contratos" valor={ov.conversao.contratos} />
        <Kpi label="Concluídos" valor={ov.conversao.contratosConcluidos} />
        <Kpi label="Taxa de conclusão" valor={ov.conversao.taxaConclusao} sufixo="%" />
      </div>

      <h2 className="h2">Confiança & conhecimento</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', marginBottom: 28 }}>
        <Kpi label="Avaliações" valor={ov.confianca.avaliacoes} />
        <Kpi label="Nota média" valor={ov.confianca.mediaGeral} sufixo="★" />
        <Kpi label="Denúncias abertas" valor={ov.confianca.denunciasAbertas} />
        <Kpi label="Insights" valor={ov.conhecimento.insights} />
        <Kpi label="Indicações ganhas" valor={ov.indicacoes.ganhas} />
        <Kpi label="Eventos auditados" valor={ov.eventosAuditoria} />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <h2 className="h2">Funil de conversão</h2>
          {funil.map((e) => (
            <div key={e.etapa} style={{ marginBottom: 12 }}>
              <div className="between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{e.etapa}</span>
                <span className="muted" style={{ fontSize: 12 }}>{e.valor} · {e.pct}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--bg-soft)', borderRadius: 999 }}>
                <div style={{ width: `${Math.max(2, e.pct)}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <h2 className="h2">Solicitações por categoria</h2>
          {cats.length === 0 && <div className="empty">Sem dados.</div>}
          {cats.map((c) => (
            <div key={c.categoria} style={{ marginBottom: 10 }}>
              <div className="between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{c.categoria}</span>
                <span className="muted" style={{ fontSize: 12 }}>{c.total}</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-soft)', borderRadius: 999 }}>
                <div style={{ width: `${(c.total / maxCat) * 100}%`, height: '100%', borderRadius: 999, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h2 className="h2">Atividade (eventos/dia · 30 dias)</h2>
        {serie.length === 0 ? (
          <div className="empty">Sem eventos no período.</div>
        ) : (
          <div className="row" style={{ alignItems: 'flex-end', gap: 4, height: 140, overflowX: 'auto' }}>
            {serie.map((s) => (
              <div key={s.dia} title={`${s.dia}: ${s.total}`} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 16, height: `${(s.total / maxSerie) * 110}px`, minHeight: 3, borderRadius: 4, background: 'linear-gradient(180deg, var(--accent), var(--primary))' }} />
                <span className="muted" style={{ fontSize: 9 }}>{s.dia.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
