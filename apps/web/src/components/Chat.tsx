'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, API_URL, getToken } from '@/lib/api';
import { Mensagem } from '@/lib/types';

export function Chat({ conversaId, meuId }: { conversaId: string; meuId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [online, setOnline] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ativo = true;
    api<Mensagem[]>(`/conversas/${conversaId}/mensagens`).then((m) => {
      if (ativo) setMensagens(m);
    });

    const socket = io(API_URL, { auth: { token: getToken() }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setOnline(true);
      socket.emit('conversa:entrar', conversaId);
    });
    socket.on('disconnect', () => setOnline(false));
    socket.on('mensagem:nova', (m: Mensagem) => {
      setMensagens((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });

    return () => {
      ativo = false;
      socket.disconnect();
    };
  }, [conversaId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensagens]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setTexto('');
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('mensagem:enviar', { conversaId, conteudo });
    } else {
      // fallback REST se o socket cair
      api<Mensagem>(`/conversas/${conversaId}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ conteudo }),
      }).then((m) => setMensagens((prev) => [...prev, m]));
    }
  }

  return (
    <div className="card chat">
      <div className="between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <strong>Sala de negociação</strong>
        <span className="row" style={{ fontSize: 12 }}>
          <span className="dotlive" style={{ opacity: online ? 1 : 0.3 }} />
          <span className="muted">{online ? 'tempo real' : 'reconectando…'}</span>
        </span>
      </div>
      <div className="chat-log" ref={logRef}>
        {mensagens.length === 0 && <p className="empty">Nenhuma mensagem ainda.</p>}
        {mensagens.map((m) => (
          <div key={m.id} className={`msg ${m.autor.id === meuId ? 'mine' : 'theirs'}`}>
            {m.autor.id !== meuId && <div className="who">{m.autor.nome}</div>}
            {m.conteudo}
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={enviar}>
        <input
          className="input"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem…"
        />
        <button className="btn btn-primary" type="submit">Enviar</button>
      </form>
    </div>
  );
}
