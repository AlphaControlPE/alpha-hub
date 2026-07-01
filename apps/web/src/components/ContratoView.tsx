'use client';

import { api, centavosParaReal } from '@/lib/api';
import { Contrato } from '@/lib/types';

const STATUS_BADGE: Record<string, string> = {
  RASCUNHO: 'EM_NEGOCIACAO', ATIVO: 'ABERTA', CONCLUIDO: 'ACEITA', CANCELADO: 'CANCELADA', EM_DISPUTA: 'EM_NEGOCIACAO',
};

export function ContratoView({
  contrato,
  meuId,
  onChange,
}: {
  contrato: Contrato;
  meuId: string;
  onChange: () => void;
}) {
  const ehCliente = contrato.clienteId === meuId;
  const ehPrestador = contrato.prestadorId === meuId;
  const jaAssinei = ehCliente ? contrato.aceiteCliente : contrato.aceitePrestador;
  const pagamentoDe = (marcoId: string) => contrato.pagamentos.find((p) => p.marcoId === marcoId);

  const assinar = async () => { await api(`/contratos/${contrato.id}/assinar`, { method: 'POST' }); onChange(); };
  const entregar = async (m: string) => { await api(`/contratos/${contrato.id}/marcos/${m}/entregar`, { method: 'POST' }); onChange(); };
  const aprovar = async (m: string) => { await api(`/contratos/${contrato.id}/marcos/${m}/aprovar`, { method: 'POST' }); onChange(); };

  return (
    <div className="card card-pad">
      <div className="between">
        <strong className="title">Contrato · {centavosParaReal(contrato.valorTotal)}</strong>
        <span className={`badge ${STATUS_BADGE[contrato.status]}`}>{contrato.status.replace('_', ' ')}</span>
      </div>
      <p style={{ margin: '10px 0', fontSize: 14 }}>{contrato.escopo}</p>
      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="chip">{contrato.cliente.nome} (cliente) {contrato.aceiteCliente ? '✓ assinou' : '… pendente'}</span>
        <span className="chip">{contrato.prestador.nome} (prestador) {contrato.aceitePrestador ? '✓ assinou' : '… pendente'}</span>
        {contrato.prazoDias && <span className="chip">prazo {contrato.prazoDias} dias</span>}
      </div>

      {contrato.status === 'RASCUNHO' && !jaAssinei && (ehCliente || ehPrestador) && (
        <button className="btn btn-primary btn-sm" onClick={assinar}>✍️ Assinar contrato</button>
      )}
      {contrato.status === 'RASCUNHO' && jaAssinei && (
        <p className="muted" style={{ fontSize: 13 }}>Você assinou. Aguardando a outra parte.</p>
      )}

      <div className="sep" />
      <strong style={{ fontSize: 14 }}>Marcos & escrow</strong>
      <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
        Pagamento protegido <em>simulado</em> — a plataforma não movimenta dinheiro real (camada futura/opcional).
      </p>
      <div className="stack" style={{ marginTop: 10 }}>
        {contrato.marcos.map((m) => {
          const pg = pagamentoDe(m.id);
          return (
            <div key={m.id} className="card card-pad" style={{ background: 'var(--bg-soft)' }}>
              <div className="between">
                <div>
                  <strong style={{ fontSize: 14 }}>{m.titulo}</strong>
                  {m.descricao && <div className="muted" style={{ fontSize: 12 }}>{m.descricao}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{centavosParaReal(m.valor)}</div>
                  <span className={`badge ${m.status === 'PAGO' ? 'ACEITA' : 'EM_NEGOCIACAO'}`} style={{ fontSize: 11 }}>{m.status}</span>
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {pg && <span className="chip">escrow: {pg.status.toLowerCase()}</span>}
                {contrato.status === 'ATIVO' && ehPrestador && m.status === 'PENDENTE' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => entregar(m.id)}>Marcar entregue</button>
                )}
                {contrato.status === 'ATIVO' && ehCliente && m.status === 'ENTREGUE' && (
                  <button className="btn btn-accent btn-sm" onClick={() => aprovar(m.id)}>Aprovar & liberar escrow</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
