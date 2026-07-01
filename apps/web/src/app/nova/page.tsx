'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Solicitacao } from '@/lib/types';

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('design');
  const [orcamento, setOrcamento] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && !usuario) router.replace('/login');
  }, [carregando, usuario, router]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const body: Record<string, unknown> = { titulo, descricao, categoria };
      if (orcamento) body.orcamento = Math.round(parseFloat(orcamento) * 100);
      const s = await api<Solicitacao>('/solicitacoes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/solicitacoes/${s.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao publicar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '24px auto' }}>
      <h1 className="h1">Publicar solicitação</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        Descreva sua necessidade com clareza — quanto melhor o briefing, melhores as propostas.
      </p>
      <form className="card card-pad" onSubmit={submeter}>
        <label className="field">
          <span className="lbl">Título</span>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Identidade visual para minha marca" required />
        </label>
        <label className="field">
          <span className="lbl">Descrição / briefing</span>
          <textarea className="textarea" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Contexto, objetivo, escopo, referências, prazo desejado…" required />
        </label>
        <div className="row" style={{ gap: 12 }}>
          <label className="field" style={{ flex: 1 }}>
            <span className="lbl">Categoria</span>
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {['design', 'desenvolvimento', 'marketing', 'redação', 'consultoria', 'outros'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span className="lbl">Orçamento (R$, opcional)</span>
            <input className="input" type="number" min="0" step="0.01" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} placeholder="2500.00" />
          </label>
        </div>

        {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}
        <button className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Publicando…' : 'Publicar solicitação'}
        </button>
      </form>
    </div>
  );
}
