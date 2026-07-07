'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Contrato } from '@/lib/types';
import { ContratoView } from '@/components/ContratoView';

export default function ContratosPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);

  useEffect(() => { if (!carregando && !usuario) router.replace('/login'); }, [carregando, usuario, router]);

  const carregar = useCallback(async () => {
    setContratos(await api<Contrato[]>('/contratos'));
  }, []);
  useEffect(() => { if (usuario) carregar(); }, [usuario, carregar]);

  return (
    <div style={{ maxWidth: 760, margin: '16px auto' }}>
      <h1 className="h1">Meus contratos</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        Acordos formalizados a partir de propostas aceitas — escopo, marcos e pagamento protegido (simulado).
      </p>
      {contratos.length === 0 ? (
        <div className="card card-pad empty">
          <div aria-hidden="true" style={{ fontSize: 34, marginBottom: 8 }}>📝</div>
          <strong>Nenhum contrato ainda</strong>
          <p className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
            Quando uma proposta for aceita, formalize o acordo com escopo, marcos e pagamento protegido.
          </p>
          <Link href="/" className="btn btn-primary btn-sm">Ver solicitações</Link>
        </div>
      ) : (
        <div className="stack">
          {contratos.map((c) => (
            <ContratoView key={c.id} contrato={c} meuId={usuario!.id} onChange={carregar} />
          ))}
        </div>
      )}
    </div>
  );
}
