'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, centavosParaReal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Assinatura, Plano } from '@/lib/types';

const preco = (p: Plano) =>
  p.preco === 0 ? 'Grátis' : `${centavosParaReal(p.preco)}${p.periodicidade === 'MENSAL' ? '/mês' : ''}`;

// Esconde códigos internos (ex.: "selo_verificado"), mostra só benefícios legíveis.
const legivel = (r: string) => /[A-Z ]/.test(r);

export default function PlanosPage() {
  const { usuario } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [minhas, setMinhas] = useState<Assinatura[]>([]);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    const p = await api<Plano[]>('/planos');
    setPlanos(p);
    if (usuario) {
      try { setMinhas(await api<Assinatura[]>('/planos/minhas')); } catch { /* */ }
    } else {
      setMinhas([]);
    }
  }, [usuario]);

  useEffect(() => { carregar(); }, [carregar]);

  const ativaDoPlano = (planoId: string) => minhas.find((a) => a.plano.id === planoId && a.status === 'ATIVA');

  async function assinar(p: Plano) {
    if (!usuario) { window.location.href = '/login'; return; }
    setMsg('');
    try {
      await api(`/planos/${p.id}/assinar`, { method: 'POST' });
      setMsg(`Assinatura de "${p.nome}" ativada (pagamento simulado).`);
      await carregar();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Falha ao assinar');
    }
  }

  async function cancelar(a: Assinatura) {
    await api(`/assinaturas/${a.id}/cancelar`, { method: 'POST' });
    await carregar();
  }

  return (
    <>
      <section className="hero">
        <span className="pill">● Opcional · o núcleo é e continua grátis</span>
        <h1 className="h1">Planos e serviços opcionais</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          Publicar, propor, conversar, indicar e avaliar é <strong>sempre gratuito</strong>.
          Estes planos são camadas opcionais — nunca condicionam sua participação. Pagamento é
          simulado nesta demonstração (a plataforma não movimenta dinheiro real).
        </p>
      </section>

      {msg && <div className="card card-pad" style={{ marginBottom: 16 }}><span className="success">{msg}</span></div>}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
        {planos.map((p) => {
          const ativa = ativaDoPlano(p.id);
          return (
            <div key={p.id} className="card card-pad" style={p.destaque ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : undefined}>
              <div className="between">
                <strong style={{ fontSize: 17 }}>{p.nome}</strong>
                {p.destaque && <span className="chip" style={{ color: 'var(--primary)' }}>popular</span>}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, margin: '8px 0' }}>{preco(p)}</div>
              <p className="muted" style={{ fontSize: 13, minHeight: 34 }}>{p.descricao}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.recursos.filter(legivel).map((r) => (
                  <li key={r} style={{ fontSize: 13 }}><span style={{ color: 'var(--accent)' }}>✓</span> {r}</li>
                ))}
              </ul>
              {p.preco === 0 ? (
                <span className="chip">incluído para todos</span>
              ) : ativa ? (
                <div className="stack" style={{ gap: 8 }}>
                  <span className="badge ACEITA">assinatura ativa</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => cancelar(ativa)}>Cancelar</button>
                </div>
              ) : (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => assinar(p)}>
                  Assinar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {usuario && minhas.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 className="h2">Minhas assinaturas</h2>
          <div className="card">
            {minhas.map((a) => (
              <div key={a.id} className="sol-item between">
                <span><strong>{a.plano.nome}</strong> <span className="muted" style={{ fontSize: 12 }}>· {preco(a.plano)}</span></span>
                <span className={`badge ${a.status === 'ATIVA' ? 'ACEITA' : 'CANCELADA'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!usuario && (
        <p className="muted" style={{ marginTop: 20, fontSize: 13 }}>
          <Link href="/login" style={{ color: 'var(--primary)' }}>Entre</Link> para assinar — mas lembre: você já pode usar todo o núcleo de graça.
        </p>
      )}
    </>
  );
}
