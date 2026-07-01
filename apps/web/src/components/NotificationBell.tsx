'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, API_URL, getToken } from '@/lib/api';
import { Notificacao } from '@/lib/types';

export function NotificationBell() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  async function carregar() {
    const [lista, contador] = await Promise.all([
      api<Notificacao[]>('/notificacoes'),
      api<{ total: number }>('/notificacoes/contador'),
    ]);
    setItens(lista);
    setNaoLidas(contador.total);
  }

  useEffect(() => {
    carregar().catch(() => {});
    const socket = io(API_URL, { auth: { token: getToken() }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('notificacao:nova', (n: Notificacao) => {
      setItens((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 50)));
      setNaoLidas((c) => c + 1);
    });
    return () => { socket.disconnect(); };
  }, []);

  async function abrir(n: Notificacao) {
    if (!n.lida) {
      await api(`/notificacoes/${n.id}/lida`, { method: 'PATCH' });
      setItens((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
      setNaoLidas((c) => Math.max(0, c - 1));
    }
    setAberto(false);
    if (n.link) router.push(n.link);
  }

  async function marcarTodas() {
    await api('/notificacoes/lidas', { method: 'PATCH' });
    setItens((prev) => prev.map((x) => ({ ...x, lida: true })));
    setNaoLidas(0);
  }

  return (
    <span className="bell-wrap">
      <button className="bell-btn" onClick={() => setAberto((v) => !v)} aria-label="Notificações">
        🔔
        {naoLidas > 0 && <span className="bell-badge">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>
      {aberto && (
        <div className="bell-dropdown card">
          <div className="between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <strong>Notificações</strong>
            {naoLidas > 0 && <button className="btn btn-ghost btn-sm" onClick={marcarTodas}>marcar todas</button>}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {itens.length === 0 ? (
              <div className="empty" style={{ padding: 24 }}>Sem notificações.</div>
            ) : (
              itens.map((n) => (
                <button
                  key={n.id}
                  onClick={() => abrir(n)}
                  className="bell-item"
                  style={{ background: n.lida ? 'transparent' : 'var(--surface-2)' }}
                >
                  <div className="row" style={{ gap: 8 }}>
                    {!n.lida && <span className="dotlive" style={{ width: 7, height: 7 }} />}
                    <strong style={{ fontSize: 13 }}>{n.titulo}</strong>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{n.corpo}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </span>
  );
}
