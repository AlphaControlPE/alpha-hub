'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Contrato } from '@/lib/types';

interface MarcoForm { titulo: string; valor: string }

export function FormalizarContrato({
  propostaId,
  escopoInicial,
  onCriado,
}: {
  propostaId: string;
  escopoInicial: string;
  onCriado: (c: Contrato) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [escopo, setEscopo] = useState(escopoInicial);
  const [prazoDias, setPrazoDias] = useState('');
  const [marcos, setMarcos] = useState<MarcoForm[]>([{ titulo: 'Entrega final', valor: '' }]);
  const [erro, setErro] = useState('');

  const setMarco = (i: number, k: keyof MarcoForm, v: string) =>
    setMarcos((ms) => ms.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const body = {
        propostaId,
        escopo,
        prazoDias: prazoDias ? parseInt(prazoDias, 10) : undefined,
        marcos: marcos
          .filter((m) => m.titulo && m.valor)
          .map((m) => ({ titulo: m.titulo, valor: Math.round(parseFloat(m.valor) * 100) })),
      };
      const c = await api<Contrato>('/contratos', { method: 'POST', body: JSON.stringify(body) });
      setAberto(false);
      onCriado(c);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao formalizar');
    }
  }

  if (!aberto) {
    return <button className="btn btn-primary btn-sm" onClick={() => setAberto(true)}>📄 Formalizar contrato</button>;
  }

  return (
    <form className="card card-pad" style={{ marginTop: 10 }} onSubmit={criar}>
      <label className="field">
        <span className="lbl">Escopo do contrato</span>
        <textarea className="textarea" style={{ minHeight: 70 }} value={escopo} onChange={(e) => setEscopo(e.target.value)} required />
      </label>
      <label className="field">
        <span className="lbl">Prazo (dias, opcional)</span>
        <input className="input" type="number" min="1" value={prazoDias} onChange={(e) => setPrazoDias(e.target.value)} />
      </label>
      <span className="lbl">Marcos / entregáveis</span>
      {marcos.map((m, i) => (
        <div className="row" key={i} style={{ marginBottom: 8 }}>
          <input className="input" placeholder="Título do marco" value={m.titulo} onChange={(e) => setMarco(i, 'titulo', e.target.value)} />
          <input className="input" style={{ maxWidth: 130 }} type="number" min="0" step="0.01" placeholder="R$" value={m.valor} onChange={(e) => setMarco(i, 'valor', e.target.value)} />
          {marcos.length > 1 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMarcos((ms) => ms.filter((_, idx) => idx !== i))}>×</button>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMarcos((ms) => [...ms, { titulo: '', valor: '' }])}>+ marco</button>
      {erro && <p className="error" style={{ margin: '10px 0' }}>{erro}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary btn-sm">Criar contrato</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  );
}
