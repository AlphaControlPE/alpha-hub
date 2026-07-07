'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await api('/auth/esqueci', { method: 'POST', body: JSON.stringify({ email }) });
      setEnviado(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setErro('A redefinição por e-mail não está habilitada no momento.');
      } else {
        setErro(err instanceof Error ? err.message : 'Falha ao solicitar redefinição');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card card-pad" style={{ width: 'min(420px, 92vw)' }}>
        <h1 className="h2">Redefinir senha</h1>
        {enviado ? (
          <>
            <p className="success" style={{ fontSize: 14 }}>
              Se este e-mail estiver cadastrado, enviamos as instruções. Confira
              sua caixa de entrada (e o spam) — o link vale por 1 hora.
            </p>
            <Link href="/login" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              ← Voltar ao login
            </Link>
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
              Informe o e-mail da sua conta e enviaremos um link para criar uma
              nova senha.
            </p>
            <form onSubmit={submeter}>
              <label className="field">
                <span className="lbl">E-mail</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </label>
              {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 14, marginBottom: 0 }}>
              <Link href="/login" className="muted" style={{ fontSize: 13 }}>← Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
