'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const MOTIVOS = ['spam', 'conteúdo impróprio', 'golpe/fraude', 'dados sem consentimento', 'outro'];

export function ReportButton({ alvoTipo, alvoId }: { alvoTipo: string; alvoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [descricao, setDescricao] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    await api('/denuncias', { method: 'POST', body: JSON.stringify({ alvoTipo, alvoId, motivo, descricao }) });
    setEnviado(true);
    setAberto(false);
  }

  if (enviado) return <span className="success" style={{ fontSize: 13 }}>✓ denúncia enviada</span>;

  return (
    <span style={{ position: 'relative' }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAberto((v) => !v)}>⚑ denunciar</button>
      {aberto && (
        <form
          onSubmit={enviar}
          className="card card-pad"
          style={{ position: 'absolute', zIndex: 20, top: '110%', right: 0, width: 280 }}
        >
          <label className="field">
            <span className="lbl">Motivo</span>
            <select className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="lbl">Detalhes (opcional)</span>
            <textarea className="textarea" style={{ minHeight: 70 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Enviar denúncia</button>
        </form>
      )}
    </span>
  );
}
