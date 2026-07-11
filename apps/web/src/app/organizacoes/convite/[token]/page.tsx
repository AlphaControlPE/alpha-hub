'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Preview = {
  org: { id: string; nome: string; verificado: boolean };
  papel: string;
  expirado: boolean;
  usado: boolean;
};

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [erro, setErro] = useState('');
  const [carregandoPreview, setCarregandoPreview] = useState(true);
  const [aceitando, setAceitando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregandoPreview(true);
    setErro('');
    try {
      setPreview(await api<Preview>(`/organizacoes/convite/${token}`));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Convite inválido');
    } finally {
      setCarregandoPreview(false);
    }
  }, [token]);

  useEffect(() => {
    if (!carregando && usuario) carregar();
  }, [carregando, usuario, carregar]);

  async function aceitar() {
    setErro('');
    setAceitando(true);
    try {
      await api(`/organizacoes/convite/${token}/aceitar`, { method: 'POST' });
      router.push('/organizacoes');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível aceitar o convite');
      setAceitando(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card card-pad" style={{ width: 'min(460px, 92vw)', textAlign: 'center' }}>
        <h1 className="h2" style={{ marginBottom: 8 }}>Convite para organização</h1>

        {carregando ? (
          <p className="muted">Carregando…</p>
        ) : !usuario ? (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>Entre na sua conta para aceitar este convite.</p>
            <Link href="/login" className="btn btn-primary">Entrar</Link>
          </>
        ) : carregandoPreview ? (
          <p className="muted">Verificando o convite…</p>
        ) : !preview ? (
          <p className="error">{erro || 'Convite inválido.'}</p>
        ) : preview.usado ? (
          <p className="muted">Este convite já foi utilizado.</p>
        ) : preview.expirado ? (
          <p className="muted">Este convite expirou. Peça um novo à organização.</p>
        ) : (
          <>
            <p style={{ margin: '0 0 6px' }}>
              Você foi convidado para <strong>{preview.org.nome}</strong>
              {preview.org.verificado && <span className="badge ACEITA" style={{ marginLeft: 8 }}>✓ verificada</span>}
            </p>
            <p className="muted" style={{ marginBottom: 18, fontSize: 13 }}>
              Papel ao entrar: {preview.papel.toLowerCase()}
            </p>
            {erro && <p className="error" style={{ marginBottom: 10 }}>{erro}</p>}
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={aceitar} disabled={aceitando}>
                {aceitando ? 'Entrando…' : 'Aceitar e entrar'}
              </button>
              <Link href="/organizacoes" className="btn btn-ghost">Agora não</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
