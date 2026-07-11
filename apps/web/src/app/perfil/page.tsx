'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PortfolioItem, ServicoOferecido } from '@/lib/types';

interface MeuPerfil {
  nome: string;
  bio: string | null;
  portfolio: PortfolioItem[];
  servicos: ServicoOferecido[];
}

export default function MeuPerfilPage() {
  const router = useRouter();
  const { usuario, carregando, atualizarUsuario } = useAuth();
  const [dados, setDados] = useState<MeuPerfil>({ nome: '', bio: null, portfolio: [], servicos: [] });
  const [erro, setErro] = useState('');

  // "Sobre você" (nome + bio)
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // formulário de portfólio
  const [pTitulo, setPTitulo] = useState('');
  const [pDescricao, setPDescricao] = useState('');
  const [pLink, setPLink] = useState('');

  // formulário de serviço
  const [sTitulo, setSTitulo] = useState('');
  const [sDescricao, setSDescricao] = useState('');
  const [sPreco, setSPreco] = useState('');

  useEffect(() => {
    if (!carregando && !usuario) router.replace('/login');
  }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    const r = await api<MeuPerfil>('/perfil/me');
    setDados(r);
    setNome(r.nome);
    setBio(r.bio ?? '');
  }, []);
  useEffect(() => {
    if (usuario) carregar();
  }, [usuario, carregar]);

  async function salvarSobre(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvo(false);
    setSalvando(true);
    try {
      const r = await api<{ nome: string; bio: string | null }>('/perfil/me', {
        method: 'PATCH',
        body: JSON.stringify({ nome, bio }),
      });
      setDados((d) => ({ ...d, nome: r.nome, bio: r.bio }));
      atualizarUsuario({ nome: r.nome });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function addPortfolio(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const body: Record<string, unknown> = { titulo: pTitulo, descricao: pDescricao };
      if (pLink) body.link = pLink;
      await api('/perfil/portfolio', { method: 'POST', body: JSON.stringify(body) });
      setPTitulo(''); setPDescricao(''); setPLink('');
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao adicionar');
    }
  }

  async function addServico(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      const body: Record<string, unknown> = { titulo: sTitulo, descricao: sDescricao };
      if (sPreco) body.precoBase = Math.round(parseFloat(sPreco) * 100);
      await api('/perfil/servicos', { method: 'POST', body: JSON.stringify(body) });
      setSTitulo(''); setSDescricao(''); setSPreco('');
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao adicionar');
    }
  }

  async function remover(tipo: 'portfolio' | 'servicos', id: string) {
    await api(`/perfil/${tipo}/${id}`, { method: 'DELETE' });
    await carregar();
  }

  if (!usuario) return <div className="empty">Carregando…</div>;

  return (
    <div style={{ maxWidth: 760, margin: '16px auto' }}>
      <div className="between">
        <h1 className="h1" style={{ marginBottom: 0 }}>Meu perfil</h1>
        <Link href={`/usuarios/${usuario.id}`} className="btn btn-ghost btn-sm">ver perfil público ↗</Link>
      </div>
      <p className="muted" style={{ margin: '6px 0 18px' }}>
        Portfólio e serviços aparecem no seu perfil público e ajudam clientes a te escolher.
      </p>

      {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}

      {/* Sobre você */}
      <h2 className="h2">Sobre você</h2>
      <form className="card card-pad" style={{ marginBottom: 24 }} onSubmit={salvarSobre}>
        <label className="field">
          <span className="lbl">Nome público</span>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} minLength={2} maxLength={120} required />
        </label>
        <label className="field">
          <span className="lbl">Bio (aparece no seu perfil público)</span>
          <textarea
            className="textarea"
            style={{ minHeight: 80 }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={600}
            placeholder="Conte em poucas linhas o que você faz e sua experiência."
          />
          <span className="muted" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{bio.length}/600</span>
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          {salvo && <span className="success" style={{ fontSize: 13 }}>✓ salvo</span>}
        </div>
      </form>

      {/* Portfólio */}
      <h2 className="h2">Portfólio</h2>
      <form className="card card-pad" style={{ marginBottom: 12 }} onSubmit={addPortfolio}>
        <label className="field">
          <span className="lbl">Título do caso</span>
          <input className="input" value={pTitulo} onChange={(e) => setPTitulo(e.target.value)} placeholder="Ex.: Identidade visual para cafeteria" required />
        </label>
        <label className="field">
          <span className="lbl">Descrição</span>
          <textarea className="textarea" style={{ minHeight: 70 }} value={pDescricao} onChange={(e) => setPDescricao(e.target.value)} placeholder="O que foi feito, resultado, prazo…" required />
        </label>
        <div className="row">
          <label className="field" style={{ flex: 1, marginBottom: 0 }}>
            <span className="lbl">Link (opcional)</span>
            <input className="input" type="url" value={pLink} onChange={(e) => setPLink(e.target.value)} placeholder="https://…" />
          </label>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Adicionar</button>
        </div>
      </form>
      <div className="stack" style={{ marginBottom: 24 }}>
        {dados.portfolio.length === 0 && <div className="card card-pad empty">Nenhum caso ainda.</div>}
        {dados.portfolio.map((p) => (
          <div key={p.id} className="card card-pad between">
            <div>
              <strong>{p.titulo}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{p.descricao.slice(0, 120)}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => remover('portfolio', p.id)}>remover</button>
          </div>
        ))}
      </div>

      {/* Serviços */}
      <h2 className="h2">Serviços</h2>
      <form className="card card-pad" style={{ marginBottom: 12 }} onSubmit={addServico}>
        <label className="field">
          <span className="lbl">Serviço</span>
          <input className="input" value={sTitulo} onChange={(e) => setSTitulo(e.target.value)} placeholder="Ex.: Landing page institucional" required />
        </label>
        <label className="field">
          <span className="lbl">Descrição</span>
          <textarea className="textarea" style={{ minHeight: 70 }} value={sDescricao} onChange={(e) => setSDescricao(e.target.value)} placeholder="O que está incluso…" required />
        </label>
        <div className="row">
          <label className="field" style={{ flex: 1, marginBottom: 0 }}>
            <span className="lbl">Preço base (R$, opcional)</span>
            <input className="input" type="number" min="0" step="0.01" value={sPreco} onChange={(e) => setSPreco(e.target.value)} placeholder="2500.00" />
          </label>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Adicionar</button>
        </div>
      </form>
      <div className="stack">
        {dados.servicos.length === 0 && <div className="card card-pad empty">Nenhum serviço ainda.</div>}
        {dados.servicos.map((s) => (
          <div key={s.id} className="card card-pad between">
            <div>
              <strong>{s.titulo}</strong>
              <div className="row" style={{ marginTop: 4 }}>
                <span className="chip">{s.precoBase != null ? `a partir de ${centavosParaReal(s.precoBase)}` : 'a combinar'}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => remover('servicos', s.id)}>remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}
