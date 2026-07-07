'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, centavosParaReal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Indicacao, Paginated } from '@/lib/types';

export default function IndicacoesPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [itens, setItens] = useState<Indicacao[]>([]);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', categoria: 'desenvolvimento',
    contatoNome: '', contatoInfo: '', valorEstimado: '', comissaoPct: '', consentimento: false,
  });
  const [erro, setErro] = useState('');

  useEffect(() => { if (!carregando && !usuario) router.replace('/login'); }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    const r = await api<Paginated<Indicacao>>('/indicacoes');
    setItens(r.dados);
  }, []);
  useEffect(() => { if (usuario) carregar(); }, [usuario, carregar]);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const body: Record<string, unknown> = {
        titulo: form.titulo, descricao: form.descricao, categoria: form.categoria,
        contatoNome: form.contatoNome, contatoInfo: form.contatoInfo, consentimento: form.consentimento,
      };
      if (form.valorEstimado) body.valorEstimado = Math.round(parseFloat(form.valorEstimado) * 100);
      if (form.comissaoPct) body.comissaoPct = parseFloat(form.comissaoPct);
      await api('/indicacoes', { method: 'POST', body: JSON.stringify(body) });
      setCriando(false);
      setForm({ titulo: '', descricao: '', categoria: 'desenvolvimento', contatoNome: '', contatoInfo: '', valorEstimado: '', comissaoPct: '', consentimento: false });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao cadastrar');
    }
  }

  async function reservar(id: string) {
    await api(`/indicacoes/${id}/reservar`, { method: 'POST' });
    await carregar();
  }
  async function status(id: string, s: 'ACEITA' | 'GANHA' | 'PERDIDA') {
    await api(`/indicacoes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) });
    await carregar();
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <section className="hero">
        <span className="pill">● Indicação consentida e auditável</span>
        <h1 className="h1">Mercado de indicações</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          “Vender cliente” do jeito certo: oportunidade com origem, base legal e comissão clara.
          O contato só aparece para quem reserva — dado pessoal sem consentimento não é mercadoria.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setCriando((v) => !v)}>
          {criando ? 'Cancelar' : '+ Cadastrar indicação'}
        </button>
      </section>

      {criando && (
        <form className="card card-pad" style={{ marginBottom: 18 }} onSubmit={cadastrar}>
          <label className="field"><span className="lbl">Título</span>
            <input className="input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} required /></label>
          <label className="field"><span className="lbl">Descrição da oportunidade</span>
            <textarea className="textarea" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} required /></label>
          <div className="row" style={{ gap: 12 }}>
            <label className="field" style={{ flex: 1 }}><span className="lbl">Categoria</span>
              <select className="input" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                {['desenvolvimento', 'design', 'marketing', 'consultoria', 'outros'].map((c) => <option key={c}>{c}</option>)}
              </select></label>
            <label className="field" style={{ flex: 1 }}><span className="lbl">Nome do contato</span>
              <input className="input" value={form.contatoNome} onChange={(e) => set('contatoNome', e.target.value)} required /></label>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <label className="field" style={{ flex: 1 }}><span className="lbl">Contato (e-mail/telefone)</span>
              <input className="input" value={form.contatoInfo} onChange={(e) => set('contatoInfo', e.target.value)} required /></label>
            <label className="field" style={{ flex: 1 }}><span className="lbl">Valor estimado (R$)</span>
              <input className="input" type="number" min="0" step="0.01" value={form.valorEstimado} onChange={(e) => set('valorEstimado', e.target.value)} /></label>
            <label className="field" style={{ width: 130 }}><span className="lbl">Comissão (%)</span>
              <input className="input" type="number" min="0" max="100" value={form.comissaoPct} onChange={(e) => set('comissaoPct', e.target.value)} /></label>
          </div>
          <label className="row" style={{ gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.consentimento} onChange={(e) => set('consentimento', e.target.checked)} />
            <span style={{ fontSize: 13 }}>Confirmo ter consentimento/base legal do contato (LGPD).</span>
          </label>
          {erro && <p className="error" style={{ marginBottom: 10 }}>{erro}</p>}
          <button className="btn btn-primary" disabled={!form.consentimento}>Cadastrar indicação</button>
        </form>
      )}

      <div className="stack">
        {itens.length === 0 && (
          <div className="card card-pad empty">
            <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>🤝</div>
            <strong>Nenhuma indicação ainda</strong>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>
              Indique alguém com consentimento — o contato fica protegido até a reserva.
            </p>
          </div>
        )}
        {itens.map((i) => {
          const minha = i.indicador.id === usuario?.id;
          return (
            <div key={i.id} className="card card-pad">
              <div className="between">
                <h3 className="title">{i.titulo}</h3>
                <span className={`badge ${i.status === 'CADASTRADA' ? 'ABERTA' : 'EM_NEGOCIACAO'}`}>{i.status}</span>
              </div>
              <p className="muted" style={{ margin: '8px 0 12px', fontSize: 14 }}>{i.descricao}</p>
              <div className="row" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="chip">{i.categoria}</span>
                <span className="chip">contato: {i.contatoNome}</span>
                <span className="chip">📇 {i.contatoInfo}</span>
                {i.comissaoPct != null && <span className="chip">comissão {i.comissaoPct}%</span>}
                {i.valorEstimado != null && <span className="chip">~{centavosParaReal(i.valorEstimado)}</span>}
              </div>
              <div className="row">
                <span className="muted" style={{ fontSize: 12 }}>por {minha ? 'você' : i.indicador.nome}</span>
                <span style={{ marginLeft: 'auto' }} className="row">
                  {!minha && i.status === 'CADASTRADA' && (
                    <button className="btn btn-primary btn-sm" onClick={() => reservar(i.id)}>Reservar</button>
                  )}
                  {(minha || i.destinatario?.id === usuario?.id) && i.status !== 'CADASTRADA' && (
                    <>
                      <button className="btn btn-accent btn-sm" onClick={() => status(i.id, 'GANHA')}>Ganha</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => status(i.id, 'PERDIDA')}>Perdida</button>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
