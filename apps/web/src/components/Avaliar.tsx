'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

function Estrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <span className="row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: n <= valor ? 'var(--warn)' : 'var(--text-faint)', padding: 0 }}
          aria-label={`${n} estrelas`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function Avaliar({ propostaId, onDone }: { propostaId: string; onDone: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [comunicacao, setComunicacao] = useState(5);
  const [qualidade, setQualidade] = useState(5);
  const [prazo, setPrazo] = useState(5);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api('/avaliacoes', {
        method: 'POST',
        body: JSON.stringify({ propostaId, notaComunicacao: comunicacao, notaQualidade: qualidade, notaPrazo: prazo, comentario }),
      });
      setFeito(true);
      setAberto(false);
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao avaliar');
    }
  }

  if (feito) return <span className="success" style={{ fontSize: 13 }}>✓ avaliação enviada</span>;

  return (
    <span>
      <button type="button" className="btn btn-accent btn-sm" onClick={() => setAberto((v) => !v)}>★ Avaliar</button>
      {aberto && (
        <form className="card card-pad" style={{ marginTop: 10 }} onSubmit={enviar}>
          <div className="between" style={{ marginBottom: 8 }}><span className="lbl">Comunicação</span><Estrelas valor={comunicacao} onChange={setComunicacao} /></div>
          <div className="between" style={{ marginBottom: 8 }}><span className="lbl">Qualidade</span><Estrelas valor={qualidade} onChange={setQualidade} /></div>
          <div className="between" style={{ marginBottom: 8 }}><span className="lbl">Prazo</span><Estrelas valor={prazo} onChange={setPrazo} /></div>
          <textarea className="textarea" style={{ minHeight: 60 }} placeholder="Comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          {erro && <p className="error" style={{ margin: '8px 0' }}>{erro}</p>}
          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Enviar avaliação</button>
        </form>
      )}
    </span>
  );
}
