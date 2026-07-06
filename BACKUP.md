# Backup & recuperação — Alpha Hub

O banco de dados de produção (PostgreSQL no Render) guarda **tudo**: contas,
solicitações, propostas, contratos, mensagens, auditoria. Este guia mostra como
fazer backup, restaurar e o que fazer quando o **Postgres grátis do Render expirar**.

> ⚠️ **Importante:** o plano grátis do Render **apaga o banco depois de um período**
> (ele avisa por e-mail). Configure o backup automático (abaixo) e tenha um plano
> de migração ANTES disso.

---

## 1. Pegar a "External Database URL" no Render

1. Render → **Dashboard** → clique no banco **`alpha-hub-db`**.
2. Aba **Connect** → copie a **External Database URL**
   (algo como `postgresql://alphahub:...@dpg-xxxx.oregon-postgres.render.com/alphahub`).
3. Essa é a string que os comandos abaixo usam como `DATABASE_URL`.

---

## 2. Backup manual (no seu PC)

Requisito: ter o cliente PostgreSQL (`pg_dump`) instalado.

```bash
# Linux/macOS/WSL/Git Bash:
DATABASE_URL="<External Database URL>" ./scripts/backup-db.sh

# Windows PowerShell:
$env:DATABASE_URL="<External Database URL>"; ./scripts/backup-db.ps1
```

Gera `backups/alphahub-AAAAMMDD-HHMMSS.sql.gz`. Guarde esse arquivo em local seguro
(ele fica de fora do Git de propósito).

---

## 3. Backup automático (recomendado) — sem depender do seu PC

Já existe um GitHub Action que faz o dump todo dia e guarda por 14 dias.

1. No GitHub do projeto: **Settings → Secrets and variables → Actions → New repository secret**.
2. Nome: **`DATABASE_URL`** · Valor: a **External Database URL** do Render.
3. Pronto. Rode manualmente a 1ª vez em **Actions → "Backup do banco" → Run workflow**
   e confira se passou. Depois roda sozinho às 06:00 UTC.
4. Para baixar um backup: **Actions → uma execução → Artifacts → `backup-postgres`**.

---

## 4. Restaurar um backup

```bash
DATABASE_URL="<URL do banco de destino>" ./scripts/restore-db.sh backups/alphahub-....sql.gz
```
(pede confirmação, pois **sobrescreve** o destino.)

---

## 5. Plano para quando o Postgres grátis expirar

### Opção 1 — Upgrade pago no Render (mais simples)
Render → `alpha-hub-db` → **Settings/Plan** → escolher um plano pago (a partir de
~US$7/mês). O banco continua o mesmo, sem migração. Passa a ter backups gerenciados.

### Opção 2 — Migrar para o Neon (Postgres grátis de verdade)
1. Crie conta em **neon.tech** → **New Project** → copie a connection string.
2. No Render, serviço **`alpha-hub-api`** → **Environment** → edite `DATABASE_URL`
   para a string do Neon → **Save** (isso redeploya).
3. No deploy, o start já roda `prisma migrate deploy` (cria as tabelas no Neon).
4. Restaure o último backup no Neon:
   `DATABASE_URL="<string do Neon>" ./scripts/restore-db.sh backups/ultimo.sql.gz`
   — se a migração já criou as tabelas vazias, restaure só os dados ou zere antes.
5. Confira o site; depois pode remover o banco antigo do Render.

> Dica: faça a migração **com o site em baixa utilização** e com um backup fresco em mãos.
