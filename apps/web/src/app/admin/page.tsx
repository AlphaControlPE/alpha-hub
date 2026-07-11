'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Denuncia, Metricas, Organizacao, Sancao } from '@/lib/types';

const ehStaff = (p?: string) => p === 'ADMIN' || p === 'MODERADOR';

export default function AdminPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [verificacoes, setVerificacoes] = useState<Organizacao[]>([]);
  const [sancoes, setSancoes] = useState<Sancao[]>([]);

  useEffect(() => {
    if (!carregando && !ehStaff(usuario?.papelSistema)) router.replace('/');
  }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    const [m, d, v, s] = await Promise.all([
      api<Metricas>('/admin/metricas'),
      api<Denuncia[]>('/admin/denuncias'),
      api<Organizacao[]>('/admin/verificacoes'),
      api<Sancao[]>('/admin/sancoes'),
    ]);
    setMetricas(m);
    setDenuncias(d);
    setVerificacoes(v);
    setSancoes(s);
  }, []);

  useEffect(() => { if (ehStaff(usuario?.papelSistema)) carregar(); }, [usuario, carregar]);

  async function resolver(id: string, status: 'PROCEDENTE' | 'IMPROCEDENTE') {
    await api(`/admin/denuncias/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await carregar();
  }

  async function decidirVerificacao(orgId: string, decisao: 'APROVADA' | 'REJEITADA') {
    await api(`/admin/verificacoes/${orgId}`, { method: 'PATCH', body: JSON.stringify({ decisao }) });
    await carregar();
  }

  async function revogarSancao(id: string) {
    await api(`/admin/sancoes/${id}/desativar`, { method: 'PATCH', body: JSON.stringify({}) });
    await carregar();
  }

  if (!ehStaff(usuario?.papelSistema)) return <div className="empty">Acesso restrito.</div>;

  const cards: [string, number | undefined][] = [
    ['Usuários', metricas?.usuarios],
    ['Solicitações', metricas?.solicitacoes],
    ['Propostas', metricas?.propostas],
    ['Indicações', metricas?.indicacoes],
    ['Insights', metricas?.insights],
    ['Denúncias abertas', metricas?.denunciasAbertas],
    ['Sanções ativas', metricas?.sancoesAtivas],
    ['Eventos de auditoria', metricas?.eventosAuditoria],
  ];

  return (
    <>
      <div className="between" style={{ marginTop: 16 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>Painel de moderação</h1>
        <Link href="/admin/bi" className="btn btn-primary btn-sm">📊 Dados & BI</Link>
      </div>
      <p className="muted" style={{ marginBottom: 18 }}>Operação, transparência e prestação de contas.</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginBottom: 24 }}>
        {cards.map(([label, val]) => (
          <div key={label} className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{val ?? '—'}</div>
            <div className="muted" style={{ fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 className="h2">Verificações de organização pendentes</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        {verificacoes.length === 0 ? (
          <div className="empty">Nenhuma verificação pendente.</div>
        ) : (
          verificacoes.map((o) => (
            <div key={o.id} className="sol-item between">
              <div>
                <strong>{o.nome}</strong>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  CNPJ: {o.documento ?? '—'} · dono: {o.dono?.nome ?? '—'}
                </div>
              </div>
              <span className="row">
                <button className="btn btn-accent btn-sm" onClick={() => decidirVerificacao(o.id, 'APROVADA')}>Aprovar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => decidirVerificacao(o.id, 'REJEITADA')}>Rejeitar</button>
              </span>
            </div>
          ))
        )}
      </div>

      <h2 className="h2">Sanções ativas</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        {sancoes.filter((s) => s.ativa).length === 0 ? (
          <div className="empty">Nenhuma sanção ativa.</div>
        ) : (
          sancoes.filter((s) => s.ativa).map((s) => (
            <div key={s.id} className="sol-item between">
              <div>
                <strong>{s.usuario.nome}</strong>
                <span className="chip" style={{ marginLeft: 8 }}>{s.tipo.toLowerCase()}</span>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {s.motivo} · aplicada por {s.aplicadaPor.nome} em {new Date(s.criadoEm).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {usuario?.papelSistema === 'ADMIN' && (
                <button className="btn btn-ghost btn-sm" onClick={() => revogarSancao(s.id)}>Revogar</button>
              )}
            </div>
          ))
        )}
      </div>

      <h2 className="h2">Denúncias</h2>
      <div className="card">
        {denuncias.length === 0 ? (
          <div className="empty">Nenhuma denúncia.</div>
        ) : (
          denuncias.map((d) => (
            <div key={d.id} className="sol-item">
              <div className="between">
                <strong>{d.alvoTipo} · {d.motivo}</strong>
                <span className={`badge ${d.status === 'ABERTA' ? 'EM_NEGOCIACAO' : d.status === 'PROCEDENTE' ? 'CANCELADA' : 'ABERTA'}`}>{d.status}</span>
              </div>
              {d.descricao && <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>{d.descricao}</p>}
              <div className="row">
                <span className="muted" style={{ fontSize: 12 }}>alvo: {d.alvoId.slice(0, 10)}… · por {d.denunciante.nome}</span>
                {d.status === 'ABERTA' && (
                  <span className="row" style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-accent btn-sm" onClick={() => resolver(d.id, 'PROCEDENTE')}>Procedente</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => resolver(d.id, 'IMPROCEDENTE')}>Improcedente</button>
                  </span>
                )}
                {d.resolucao && <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{d.resolucao}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
