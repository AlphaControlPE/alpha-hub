'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function RedefinirForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    setEnviando(true);
    try {
      await api('/auth/redefinir', { method: 'POST', body: JSON.stringify({ token, senha }) });
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao redefinir a senha');
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <>
        <p className="error" style={{ fontSize: 14 }}>
          Link incompleto — o token de redefinição não foi encontrado.
        </p>
        <Link href="/esqueci" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
          Pedir novo link
        </Link>
      </>
    );
  }

  if (ok) {
    return (
      <>
        <p className="success" style={{ fontSize: 14 }}>
          Senha redefinida com sucesso! Entre com a nova senha.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 12 }}>
          Ir para o login
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={submeter}>
      <label className="field">
        <span className="lbl">Nova senha</span>
        <input
          className="input"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="mínimo 8 caracteres"
          minLength={8}
          required
        />
      </label>
      <label className="field">
        <span className="lbl">Confirmar nova senha</span>
        <input
          className="input"
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="repita a senha"
          minLength={8}
          required
        />
      </label>
      {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}
      <button className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar nova senha'}
      </button>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="center-screen">
      <div className="card card-pad" style={{ width: 'min(420px, 92vw)' }}>
        <h1 className="h2">Criar nova senha</h1>
        <Suspense fallback={null}>
          <RedefinirForm />
        </Suspense>
      </div>
    </div>
  );
}
