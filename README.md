# Alpha Hub

Marketplace **gratuito** para solicitações, propostas, indicações consentidas e colaboração.
Núcleo modular, **API-first**, **auditável** — sem paywall, sem créditos, sem cobrança por proposta.

> Implementação da **fatia vertical** do MVP descrito no _Escopo Mestre_:
> **cadastro/login → publicar solicitação → enviar proposta → negociar no chat → aceitar**.

---

## Arquitetura

Monólito modular (decisão fundadora do escopo, Parte XVI), separado por domínios:

```
alpha-hub/
├─ apps/
│  ├─ api/                 NestJS (monólito modular, API-first)
│  │  ├─ src/common/       Prisma, Auditoria, paginação, filtro de erros
│  │  ├─ src/modules/
│  │  │  ├─ identidade/    cadastro, login, JWT, /auth/me        (Parte III, 17.02)
│  │  │  ├─ marketplace/   solicitações + propostas              (Partes V/VI, 17.03)
│  │  │  └─ comunicacao/   chat REST + WebSocket (tempo real)    (Parte VIII, 17.05)
│  │  └─ prisma/           schema + seed                          (17.08 auditoria)
│  └─ web/                 Next.js (App Router, responsivo)       (Parte XVIII)
└─ docker-compose.yml      Postgres + API + Web
```

**Stack:** NestJS · Prisma · PostgreSQL · Socket.IO · Next.js 14 · React 18 · TypeScript.

### Decisões fiéis ao escopo
- **Núcleo gratuito:** listar solicitações é público; publicar/propor/conversar exige apenas conta — nunca crédito.
- **Trilha de auditoria** (`audit_logs`): toda ação relevante grava `antes/depois/autor/origem/motivo`.
- **Contratos padronizados:** validação de entrada, erros uniformes, paginação por offset, Swagger em `/api/docs`.
- **Chat isolado por sala:** o socket usa o mesmo JWT da API e só entrega a quem participa da conversa.

---

## Como rodar

### Opção A — Docker (recomendada para paridade)
```bash
docker compose up --build
# Web:  http://localhost:3000
# API:  http://localhost:3001/api  (docs em /api/docs)
```

### Opção B — Local sem Docker (Postgres portátil)
Esta máquina não tem Docker; use o script que sobe um PostgreSQL portátil (sem instalar nada como admin):

```powershell
# 1) sobe o Postgres portátil em localhost:5432 (alphahub/alphahub)
powershell -File scripts/pg-portable.ps1 -Action start

# 2) migra + popula + sobe API e Web
npm --prefix apps/api run prisma:deploy
npm --prefix apps/api run seed
npm --prefix apps/api run start:dev      # porta 3001
npm --prefix apps/web run dev            # porta 3000
```

### Contas de demonstração (após o seed)
| Papel      | E-mail                   | Senha        |
|------------|--------------------------|--------------|
| Cliente    | `cliente@alphahub.dev`   | `alphahub123`|
| Prestador  | `prestador@alphahub.dev` | `alphahub123`|

---

## Testes

```bash
npm --prefix apps/api test          # unitários
npm --prefix apps/api run test:e2e  # e2e do fluxo completo (precisa do Postgres no ar)
```

O e2e (`apps/api/test/fluxo.e2e-spec.ts`) cobre: registro, validação, publicação,
listagem pública, regras de proposta, chat e aceite — incluindo os caminhos de erro
(autor não propõe à própria solicitação; quem não participa não lê o chat; etc.).

---

## Endpoints principais

| Método | Rota                                   | Auth | Descrição                          |
|--------|----------------------------------------|------|------------------------------------|
| POST   | `/api/auth/register`                   | —    | Cadastro                           |
| POST   | `/api/auth/login`                      | —    | Login (JWT)                        |
| GET    | `/api/auth/me`                         | ✓    | Usuário atual                      |
| GET    | `/api/solicitacoes`                    | —    | Listar (filtros `q`,`categoria`)   |
| POST   | `/api/solicitacoes`                    | ✓    | Publicar solicitação               |
| GET    | `/api/solicitacoes/:id`                | —    | Detalhar                           |
| GET    | `/api/solicitacoes/:id/propostas`      | ✓    | Listar propostas                   |
| POST   | `/api/solicitacoes/:id/propostas`      | ✓    | Enviar proposta (abre sala)        |
| POST   | `/api/propostas/:id/aceitar`           | ✓    | Aceitar proposta (autor)           |
| GET    | `/api/conversas`                       | ✓    | Minhas conversas                   |
| GET    | `/api/conversas/:id/mensagens`         | ✓    | Mensagens                          |
| POST   | `/api/conversas/:id/mensagens`         | ✓    | Enviar (também via WebSocket)      |
| WS     | `mensagem:enviar` / `mensagem:nova`    | ✓    | Chat em tempo real                 |

---

## Fases implementadas além do MVP

| Parte | Tema | Endpoints principais |
|-------|------|----------------------|
| VII | **Indicações consentidas** | `POST/GET /api/indicacoes`, `POST /api/indicacoes/:id/reservar`, `PATCH /api/indicacoes/:id/status` — contato mascarado até reserva; cadastro exige consentimento (LGPD); anti-duplicidade por hash |
| X | **Reputação multidimensional** | `POST /api/avaliacoes`, `GET /api/usuarios/:id/reputacao`, `GET /api/avaliacoes/pendentes` — notas de comunicação/qualidade/prazo ligadas a proposta aceita; sem nota única opaca |
| IX | **Comunidade / Insights** | `GET/POST /api/insights`, `POST /api/insights/:id/voto`, `POST /api/insights/:id/comentarios` |
| XII | **Busca & Matching** | `GET /api/matching/solicitacoes` (recomendação por histórico), `GET /api/busca?q=` (busca global) |
| XIV | **Moderação & Admin** | `POST /api/denuncias`; staff: `GET /api/admin/denuncias`, `PATCH /api/admin/denuncias/:id`, `POST /api/admin/sancoes`, `GET /api/admin/metricas` — papel de sistema + `PapeisGuard` |
| XI | **Negociação, contratos & pagamentos** | `GET/POST /api/contratos`, `POST /api/contratos/:id/assinar`, `POST /api/contratos/:id/marcos/:marcoId/entregar`, `POST .../aprovar` — contrato de proposta aceita, assinatura das 2 partes, marcos e **escrow simulado** (sem mover dinheiro real) |
| XIII | **Notificações & retenção** | `GET /api/notificacoes`, `GET /api/notificacoes/contador`, `PATCH /api/notificacoes/:id/lida`, `PATCH /api/notificacoes/lidas`, `GET/PATCH /api/notificacoes/preferencias` + WebSocket `notificacao:nova` — disparadas por proposta/mensagem/contrato/indicação/moderação, com preferências por categoria |
| XV | **Dados & BI operacional** | staff: `GET /api/admin/bi/overview` (liquidez/conversão/confiança), `/funil`, `/categorias`, `/serie?dias=N` — agregações read-only sobre os dados e a trilha de auditoria |
| XX | **Monetização opcional** | `GET /api/planos` (catálogo público), `GET /api/planos/minhas`, `POST /api/planos/:id/assinar` (pagamento **simulado**), `POST /api/assinaturas/:id/cancelar` — planos opcionais que **nunca** bloqueiam o núcleo gratuito |

Telas web correspondentes: `/comunidade`, `/indicacoes`, `/contratos`, `/notificacoes`,
`/planos`, `/admin`, `/admin/bi` (dashboards), sino de notificações em tempo real no menu,
avaliação/denúncia e formalização de contrato integradas ao detalhe da solicitação,
e faixa “Recomendadas para você” na home.

> **Pagamentos:** o escrow é **simulado/registrado** (máquina de estados auditável).
> A plataforma não movimenta dinheiro real — integração financeira é camada futura/opcional.

**Conta de moderação (seed):** `admin@alphahub.dev` / `alphahub123` (papel `ADMIN`).

## Próximas fases (roadmap do escopo)
Verificação avançada de identidade/empresa (03.08) · integração de pagamento
real/escrow com parceiro (substitui o simulado) · organizações/equipes completas ·
observabilidade e DevOps de produção (Partes XVI/XIX) · empacotamento e deploy.

## Backup & recuperação

O banco de produção guarda tudo. Faça backup e tenha um plano para a expiração do
Postgres grátis do Render — passo a passo em [BACKUP.md](BACKUP.md). Há também um
GitHub Action de backup diário (basta configurar o secret `DATABASE_URL`).
