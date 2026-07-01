# Colocar o Alpha Hub no ar (Render + GitHub)

Este guia publica **site + API + banco de dados** num provedor só (Render),
a partir do GitHub. O arquivo `render.yaml` já descreve tudo — você basicamente
conecta o repositório e confirma.

> Tempo estimado: ~15 min. Plano grátis para validar (veja "Limites do grátis" no fim).

---

## Passo 1 — Enviar o código para o SEU GitHub

No GitHub (github.com), clique em **New repository**, dê o nome `alpha-hub`,
deixe **vazio** (sem README/gitignore) e crie. Depois, no terminal, dentro da
pasta do projeto (`C:\Users\alpha\Desktop\Alpha-Hub`):

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/alpha-hub.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário do GitHub. Se pedir login, use seu usuário
e um **token** (GitHub → Settings → Developer settings → Personal access tokens →
"Generate new token (classic)" com escopo `repo`).

---

## Passo 2 — Criar tudo no Render pelo Blueprint

1. Crie conta em **https://render.com** (pode entrar com o GitHub).
2. No painel: **New → Blueprint**.
3. Selecione o repositório `alpha-hub` que você acabou de enviar.
4. O Render lê o `render.yaml` e mostra 3 recursos:
   - `alpha-hub-db` (PostgreSQL)
   - `alpha-hub-api` (a API)
   - `alpha-hub-web` (o site)
5. Clique **Apply**. O Render cria o banco, builda a API e o site, roda as
   migrações e o seed automaticamente.

> Se o nome `alpha-hub-api` ou `alpha-hub-web` estiver em uso, o Render pede outro.
> Se trocar, ajuste no `render.yaml` os dois endereços para bater:
> - em `alpha-hub-api` → `WEB_ORIGIN` = `https://SEU-NOME-web.onrender.com`
> - em `alpha-hub-web` → `NEXT_PUBLIC_API_URL` = `https://SEU-NOME-api.onrender.com`
> Depois `git commit` + `git push` e o Render redeploya.

---

## Passo 3 — Abrir

Quando os dois serviços ficarem **"Live"** (verde):

- **Site:** `https://alpha-hub-web.onrender.com`
- **API:** `https://alpha-hub-api.onrender.com/api/health`

Contas de demonstração (senha `alphahub123`):
`cliente@alphahub.dev` · `prestador@alphahub.dev` · `admin@alphahub.dev`

---

## Como funciona (o que o render.yaml já resolve)

- **Banco:** Render cria o Postgres e injeta a `DATABASE_URL` na API.
- **Segurança:** `JWT_SECRET` é gerado automaticamente (não fica no código).
- **Migração + seed:** rodam sozinhos no start da API (`prisma migrate deploy` +
  `prisma db seed`, idempotente).
- **CORS + WebSocket:** a API libera o domínio do site (`WEB_ORIGIN`), e o site
  fala com a API por `NEXT_PUBLIC_API_URL`. Chat e notificações em tempo real
  funcionam (o Render mantém a conexão WebSocket).

---

## Limites do plano grátis (importante saber)

- Os serviços **"dormem"** após ~15 min sem acesso; o primeiro acesso depois
  demora ~30–50s pra acordar. Normal pra validação/demonstração.
- O **Postgres grátis expira** depois de um período (o Render avisa por e-mail).
  Para algo contínuo/comercial, suba o banco e os serviços para um plano pago
  (poucos dólares/mês) — é só trocar `plan: free` por um plano pago no painel.
- Pagamentos no app são **simulados** (não movimentam dinheiro real); para
  cobrança de verdade, integrar um parceiro (ex.: Stripe/Mercado Pago) é um
  passo futuro.

---

## Alternativa: Railway (sempre ligado, ~US$5/mês)

Prefere sem "dormir"? O Railway também sobe os três juntos e lê o `Dockerfile`
de cada app (já incluídos). Fluxo parecido: conecta o GitHub, cria um Postgres,
e define as mesmas variáveis (`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`,
`NEXT_PUBLIC_API_URL`).
