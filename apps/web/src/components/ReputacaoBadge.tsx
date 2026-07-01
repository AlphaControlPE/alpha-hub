'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Reputacao } from '@/lib/types';

export function ReputacaoBadge({ userId }: { userId: string }) {
  const [rep, setRep] = useState<Reputacao | null>(null);

  useEffect(() => {
    let ativo = true;
    api<Reputacao>(`/usuarios/${userId}/reputacao`).then((r) => ativo && setRep(r)).catch(() => {});
    return () => { ativo = false; };
  }, [userId]);

  if (!rep || rep.total === 0) return <span className="chip">sem avaliações</span>;

  return (
    <span className="chip" title={`Comunicação ${rep.media.comunicacao} · Qualidade ${rep.media.qualidade} · Prazo ${rep.media.prazo}`}>
      ★ {rep.media.geral} · {rep.total} avaliação(ões)
    </span>
  );
}
