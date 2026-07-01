'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Notificacao, NotificacaoPreferencias } from '@/lib/types';

const CATEGORIAS: { chave: keyof NotificacaoPreferencias; label: string }[] = [
  { chave: 'proposta', label: 'Propostas' },
  { chave: 'mensagem', label: 'Mensagens' },
  { chave: 'contrato', label: 'Contratos e marcos' },
  { chave: 'indicacao', label: 'Indicações' },
  { chave: 'comunidade', label: 'Comunidade' },
  { chave: 'moderacao', label: 'Moderação' },
];

export default function NotificacoesPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [prefs, setPrefs] = useState<NotificacaoPreferencias | null>(null);

  useEffect(() => { if (!carregando && !usuario) router.replace('/login'); }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    const [lista, p] = await Promise.all([
      api<Notificacao[]>('/notificacoes'),
      api<NotificacaoPreferencias>('/notificacoes/preferencias'),
    ]);
    setItens(lista);
    setPrefs(p);
  }, []);
  useEffect(() => { if (usuario) carregar(); }, [usuario, carregar]);

  async function abrir(n: Notificacao) {
    if (!n.lida) await api(`/notificacoes/${n.id}/lida`, { method: 'PATCH' });
    if (n.link) router.push(n.link); else carregar();
  }
  async function marcarTodas() { await api('/notificacoes/lidas', { method: 'PATCH' }); carregar(); }
  async function alternar(chave: keyof NotificacaoPreferencias) {
    if (!prefs) return;
    const novo = { ...prefs, [chave]: !prefs[chave] };
    setPrefs(novo);
    await api('/notificacoes/preferencias', { method: 'PATCH', body: JSON.stringify({ [chave]: novo[chave] }) });
  }

  return (
    <div style={{ maxWidth: 720, margin: '16px auto' }}>
      <div className="between">
        <h1 className="h1" style={{ marginBottom: 0 }}>Notificações</h1>
        <button className="btn btn-ghost btn-sm" onClick={marcarTodas}>marcar todas como lidas</button>
      </div>

      <div className="card" style={{ margin: '16px 0' }}>
        {itens.length === 0 ? (
          <div className="empty">Sem notificações ainda.</div>
        ) : (
          itens.map((n) => (
            <button key={n.id} onClick={() => abrir(n)} className="sol-item" style={{ width: '100%', textAlign: 'left', background: n.lida ? 'transparent' : 'var(--surface-2)', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
              <div className="row" style={{ gap: 8 }}>
                {!n.lida && <span className="dotlive" style={{ width: 7, height: 7 }} />}
                <strong className="title" style={{ fontSize: 15 }}>{n.titulo}</strong>
                <span className="chip" style={{ marginLeft: 'auto' }}>{n.categoria}</span>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>{n.corpo}</p>
            </button>
          ))
        )}
      </div>

      <h2 className="h2">Preferências</h2>
      <div className="card card-pad">
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Escolha o que deseja receber. Desligar uma categoria interrompe novas notificações dela.</p>
        {prefs && CATEGORIAS.map(({ chave, label }) => (
          <label key={chave} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
            <span>{label}</span>
            <input type="checkbox" checked={prefs[chave]} onChange={() => alternar(chave)} />
          </label>
        ))}
      </div>
    </div>
  );
}
