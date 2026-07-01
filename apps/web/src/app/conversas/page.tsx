'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ConversaResumo {
  id: string;
  solicitacao: { id: string; titulo: string; status: string };
  participantes: { user: { id: string; nome: string } }[];
  mensagens: { conteudo: string; criadoEm: string }[];
}

export default function ConversasPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [conversas, setConversas] = useState<ConversaResumo[]>([]);

  useEffect(() => {
    if (!carregando && !usuario) router.replace('/login');
  }, [carregando, usuario, router]);

  useEffect(() => {
    if (usuario) api<ConversaResumo[]>('/conversas').then(setConversas);
  }, [usuario]);

  return (
    <div style={{ maxWidth: 760, margin: '24px auto' }}>
      <h1 className="h1">Minhas conversas</h1>
      <div className="card" style={{ marginTop: 12 }}>
        {conversas.length === 0 ? (
          <div className="empty">Nenhuma conversa ainda. Envie ou receba uma proposta para começar.</div>
        ) : (
          conversas.map((c) => {
            const outros = c.participantes.filter((p) => p.user.id !== usuario?.id).map((p) => p.user.nome).join(', ');
            return (
              <Link key={c.id} href={`/solicitacoes/${c.solicitacao.id}`} className="sol-item">
                <div className="between">
                  <strong className="title">{c.solicitacao.titulo}</strong>
                  <span className={`badge ${c.solicitacao.status}`}>{c.solicitacao.status.replace('_', ' ')}</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>com {outros || '—'}</div>
                {c.mensagens[0] && (
                  <div className="muted" style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
                    “{c.mensagens[0].conteudo.slice(0, 80)}”
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
