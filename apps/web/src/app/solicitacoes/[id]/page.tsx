'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Contrato, Proposta, Solicitacao } from '@/lib/types';
import { Chat } from '@/components/Chat';
import { Avaliar } from '@/components/Avaliar';
import { ReputacaoBadge } from '@/components/ReputacaoBadge';
import { ReportButton } from '@/components/ReportButton';
import { ContratoView } from '@/components/ContratoView';
import { FormalizarContrato } from '@/components/FormalizarContrato';

export default function DetalheSolicitacao() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [sol, setSol] = useState<Solicitacao | null>(null);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Record<string, Contrato>>({});
  const [erro, setErro] = useState('');

  // formulário de proposta
  const [msg, setMsg] = useState('');
  const [valor, setValor] = useState('');
  const [prazo, setPrazo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const s = await api<Solicitacao>(`/solicitacoes/${id}`);
    setSol(s);
    if (usuario) {
      try {
        const ps = await api<Proposta[]>(`/solicitacoes/${id}/propostas`);
        setPropostas(ps);
        const comConversa = ps.find((p) => p.conversa?.id);
        if (comConversa?.conversa?.id) setConversaAtiva((c) => c ?? comConversa.conversa!.id);
      } catch {
        /* sem acesso às propostas */
      }
      try {
        const cs = await api<Contrato[]>('/contratos');
        const mapa: Record<string, Contrato> = {};
        cs.forEach((c) => { if (c.proposta?.id) mapa[c.proposta.id] = c; });
        setContratos(mapa);
      } catch {
        /* sem contratos */
      }
    }
  }, [id, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!sol) return <div className="empty">Carregando…</div>;

  const ehAutor = usuario?.id === sol.autor.id;
  const minhaProposta = propostas.find((p) => p.autor.id === usuario?.id);
  const podePropor = usuario && !ehAutor && !minhaProposta && sol.status === 'ABERTA';

  async function enviarProposta(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const body: Record<string, unknown> = { mensagem: msg };
      if (valor) body.valor = Math.round(parseFloat(valor) * 100);
      if (prazo) body.prazoDias = parseInt(prazo, 10);
      const p = await api<Proposta & { conversaId: string }>(
        `/solicitacoes/${id}/propostas`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      setMsg(''); setValor(''); setPrazo('');
      await carregar();
      if (p.conversaId) setConversaAtiva(p.conversaId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao enviar proposta');
    } finally {
      setEnviando(false);
    }
  }

  async function aceitar(propostaId: string) {
    await api(`/propostas/${propostaId}/aceitar`, { method: 'POST' });
    await carregar();
  }

  return (
    <>
      <Link href="/" className="muted" style={{ fontSize: 13 }}>← voltar para solicitações</Link>

      <div className="card card-pad" style={{ marginTop: 12 }}>
        <div className="between">
          <h1 className="h1" style={{ marginBottom: 0 }}>{sol.titulo}</h1>
          <span className={`badge ${sol.status}`}>{sol.status.replace('_', ' ')}</span>
        </div>
        <div className="row" style={{ margin: '10px 0 14px', flexWrap: 'wrap' }}>
          <span className="chip">{sol.categoria}</span>
          <span className="chip">orçamento {centavosParaReal(sol.orcamento)}</span>
          <span className="chip">por {sol.autor.nome}</span>
        </div>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{sol.descricao}</p>
        {usuario && !ehAutor && (
          <div className="row" style={{ marginTop: 12 }}>
            <ReportButton alvoTipo="SOLICITACAO" alvoId={sol.id} />
          </div>
        )}
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="stack">
          <h2 className="h2">Propostas {ehAutor && `(${propostas.length})`}</h2>

          {podePropor && (
            <form className="card card-pad" onSubmit={enviarProposta}>
              <h3 className="title" style={{ marginBottom: 12 }}>Enviar proposta</h3>
              <label className="field">
                <span className="lbl">Mensagem</span>
                <textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Como você resolve, prazo, o que está incluso…" required />
              </label>
              <div className="row" style={{ gap: 12 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="lbl">Valor (R$)</span>
                  <input className="input" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1800.00" />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="lbl">Prazo (dias)</span>
                  <input className="input" type="number" min="1" value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="14" />
                </label>
              </div>
              {erro && <p className="error" style={{ marginBottom: 10 }}>{erro}</p>}
              <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar proposta'}</button>
            </form>
          )}

          {!usuario && (
            <div className="card card-pad muted">
              <Link href="/login" style={{ color: 'var(--primary)' }}>Entre</Link> para enviar uma proposta e conversar.
            </div>
          )}

          {ehAutor && propostas.length === 0 && (
            <div className="card card-pad empty">Ainda sem propostas. Compartilhe sua solicitação!</div>
          )}

          {propostas.map((p) => (
            <div key={p.id} className="card card-pad">
              <div className="between">
                <div className="row">
                  <span className="avatar">{p.autor.nome.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{p.autor.nome}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {centavosParaReal(p.valor)} · {p.prazoDias ? `${p.prazoDias} dias` : 'prazo a combinar'}
                    </div>
                  </div>
                </div>
                <span className={`badge ${p.status}`}>{p.status}</span>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <ReputacaoBadge userId={p.autor.id} />
              </div>
              <p style={{ margin: '12px 0', fontSize: 14, lineHeight: 1.5 }}>{p.mensagem}</p>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {p.conversa?.id && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setConversaAtiva(p.conversa!.id)}>
                    Abrir chat
                  </button>
                )}
                {ehAutor && p.status === 'ENVIADA' && (
                  <button className="btn btn-accent btn-sm" onClick={() => aceitar(p.id)}>Aceitar proposta</button>
                )}
                {p.status === 'ACEITA' && <Avaliar propostaId={p.id} onDone={carregar} />}
                {usuario && p.autor.id !== usuario.id && <ReportButton alvoTipo="PROPOSTA" alvoId={p.id} />}
              </div>
              {p.status === 'ACEITA' && usuario && (ehAutor || p.autor.id === usuario.id) && (
                <div style={{ marginTop: 12 }}>
                  {contratos[p.id] ? (
                    <ContratoView contrato={contratos[p.id]} meuId={usuario.id} onChange={carregar} />
                  ) : (
                    <FormalizarContrato
                      propostaId={p.id}
                      escopoInicial={sol.titulo}
                      onCriado={carregar}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h2 className="h2">Negociação</h2>
          {conversaAtiva && usuario ? (
            <Chat conversaId={conversaAtiva} meuId={usuario.id} />
          ) : (
            <div className="card card-pad empty">
              {usuario ? 'Selecione ou crie uma proposta para abrir o chat.' : 'Entre para negociar no chat.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
