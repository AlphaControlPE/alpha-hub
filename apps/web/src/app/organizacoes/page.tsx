'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Organizacao, PapelMembro } from '@/lib/types';

const badgeVerificacao: Record<string, string> = {
  NAO_SOLICITADA: 'CANCELADA',
  PENDENTE: 'EM_NEGOCIACAO',
  APROVADA: 'ACEITA',
  REJEITADA: 'CANCELADA',
};

export default function OrganizacoesPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [orgs, setOrgs] = useState<Organizacao[]>([]);
  const [aberta, setAberta] = useState<Organizacao | null>(null);
  const [erro, setErro] = useState('');

  // criar org
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [documento, setDocumento] = useState('');
  const [criando, setCriando] = useState(false);

  // gestão
  const [emailMembro, setEmailMembro] = useState('');
  const [cnpjVerif, setCnpjVerif] = useState('');

  useEffect(() => {
    if (!carregando && !usuario) router.replace('/login');
  }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    setOrgs(await api<Organizacao[]>('/organizacoes/minhas'));
  }, []);
  useEffect(() => {
    if (usuario) carregar();
  }, [usuario, carregar]);

  const abrir = async (id: string) => {
    setErro('');
    setAberta(await api<Organizacao>(`/organizacoes/${id}`));
  };

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const body: Record<string, unknown> = { nome };
      if (descricao) body.descricao = descricao;
      if (documento) body.documento = documento;
      await api('/organizacoes', { method: 'POST', body: JSON.stringify(body) });
      setNome(''); setDescricao(''); setDocumento(''); setCriando(false);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao criar');
    }
  }

  async function addMembro(e: React.FormEvent) {
    e.preventDefault();
    if (!aberta) return;
    setErro('');
    try {
      await api(`/organizacoes/${aberta.id}/membros`, { method: 'POST', body: JSON.stringify({ email: emailMembro }) });
      setEmailMembro('');
      await abrir(aberta.id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao adicionar');
    }
  }

  async function removerMembro(userId: string) {
    if (!aberta) return;
    await api(`/organizacoes/${aberta.id}/membros/${userId}`, { method: 'DELETE' });
    await abrir(aberta.id);
    await carregar();
  }

  async function alternarPapel(userId: string, papel: PapelMembro) {
    if (!aberta) return;
    const novo = papel === 'ADMIN' ? 'MEMBRO' : 'ADMIN';
    await api(`/organizacoes/${aberta.id}/membros/${userId}`, { method: 'PATCH', body: JSON.stringify({ papel: novo }) });
    await abrir(aberta.id);
  }

  async function pedirVerificacao(e: React.FormEvent) {
    e.preventDefault();
    if (!aberta) return;
    setErro('');
    try {
      const body: Record<string, unknown> = {};
      if (cnpjVerif) body.documento = cnpjVerif;
      await api(`/organizacoes/${aberta.id}/verificacao`, { method: 'POST', body: JSON.stringify(body) });
      setCnpjVerif('');
      await abrir(aberta.id);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao pedir verificação');
    }
  }

  if (!usuario) return <div className="empty">Carregando…</div>;

  const souGestor = aberta?.meuPapel === 'DONO' || aberta?.meuPapel === 'ADMIN';

  return (
    <>
      <section className="hero">
        <span className="pill">● Equipes e organizações</span>
        <h1 className="h1">Organizações</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          Reúna sua equipe, atue como empresa e solicite o selo de verificação (CNPJ).
        </p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setCriando((v) => !v)}>
          {criando ? 'Cancelar' : '+ Nova organização'}
        </button>
      </section>

      {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}

      {criando && (
        <form className="card card-pad" style={{ marginBottom: 18 }} onSubmit={criar}>
          <label className="field"><span className="lbl">Nome</span>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
          <label className="field"><span className="lbl">Descrição (opcional)</span>
            <textarea className="textarea" style={{ minHeight: 60 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
          <label className="field"><span className="lbl">CNPJ (opcional)</span>
            <input className="input" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="00.000.000/0001-00" /></label>
          <button className="btn btn-primary">Criar organização</button>
        </form>
      )}

      <div className="grid grid-2">
        {/* Lista */}
        <div className="stack">
          <h2 className="h2">Minhas organizações</h2>
          {orgs.length === 0 && <div className="card card-pad empty">Você ainda não participa de nenhuma organização.</div>}
          {orgs.map((o) => (
            <div key={o.id} className={`card card-pad`} style={aberta?.id === o.id ? { borderColor: 'var(--primary)' } : undefined}>
              <div className="between">
                <button onClick={() => abrir(o.id)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <strong style={{ fontSize: 16 }}>{o.nome}</strong>
                  {o.verificado && <span className="badge ACEITA" style={{ marginLeft: 8 }}>✓ verificada</span>}
                </button>
                <span className="chip">{o.meuPapel?.toLowerCase()}</span>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <span className="muted" style={{ fontSize: 12 }}>{o.totalMembros} membro(s)</span>
                {!o.verificado && (
                  <span className={`badge ${badgeVerificacao[o.verificacaoStatus]}`} style={{ fontSize: 11 }}>
                    verificação: {o.verificacaoStatus.replace('_', ' ').toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gestão da org aberta */}
        <div>
          <h2 className="h2">Gestão</h2>
          {!aberta ? (
            <div className="card card-pad empty">Selecione uma organização para gerenciar.</div>
          ) : (
            <div className="stack">
              <div className="card card-pad">
                <div className="between">
                  <strong>{aberta.nome}</strong>
                  {aberta.verificado ? (
                    <span className="badge ACEITA">✓ verificada</span>
                  ) : (
                    <span className={`badge ${badgeVerificacao[aberta.verificacaoStatus]}`}>{aberta.verificacaoStatus.replace('_', ' ').toLowerCase()}</span>
                  )}
                </div>
                {aberta.descricao && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{aberta.descricao}</p>}

                <div className="sep" />
                <strong style={{ fontSize: 14 }}>Membros</strong>
                <div className="stack" style={{ marginTop: 8 }}>
                  {aberta.membros?.map((m) => (
                    <div key={m.userId} className="between">
                      <span>
                        <span className="avatar" style={{ width: 26, height: 26, fontSize: 12, display: 'inline-grid', verticalAlign: 'middle', marginRight: 8 }}>{m.nome.charAt(0).toUpperCase()}</span>
                        {m.nome} <span className="chip" style={{ marginLeft: 4 }}>{m.papel.toLowerCase()}</span>
                      </span>
                      {aberta.meuPapel === 'DONO' && m.papel !== 'DONO' && (
                        <span className="row">
                          <button className="btn btn-ghost btn-sm" onClick={() => alternarPapel(m.userId, m.papel)}>
                            {m.papel === 'ADMIN' ? '↓ membro' : '↑ admin'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => removerMembro(m.userId)}>remover</button>
                        </span>
                      )}
                      {m.userId === usuario.id && m.papel !== 'DONO' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => removerMembro(m.userId)}>sair</button>
                      )}
                    </div>
                  ))}
                </div>

                {souGestor && (
                  <>
                    <div className="sep" />
                    <form className="row" onSubmit={addMembro}>
                      <input className="input" type="email" placeholder="adicionar por e-mail" value={emailMembro} onChange={(e) => setEmailMembro(e.target.value)} required />
                      <button className="btn btn-primary btn-sm">Adicionar</button>
                    </form>
                  </>
                )}
              </div>

              {/* Verificação */}
              {souGestor && !aberta.verificado && aberta.verificacaoStatus !== 'PENDENTE' && (
                <form className="card card-pad" onSubmit={pedirVerificacao}>
                  <strong style={{ fontSize: 14 }}>Selo de verificação</strong>
                  <p className="muted" style={{ fontSize: 12, margin: '4px 0 10px' }}>Informe o CNPJ para a equipe analisar.</p>
                  <div className="row">
                    <input className="input" placeholder={aberta.documento ?? 'CNPJ'} value={cnpjVerif} onChange={(e) => setCnpjVerif(e.target.value)} />
                    <button className="btn btn-accent btn-sm">Pedir verificação</button>
                  </div>
                </form>
              )}
              {aberta.verificacaoStatus === 'PENDENTE' && (
                <div className="card card-pad muted">Pedido de verificação em análise pela equipe.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
