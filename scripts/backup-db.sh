#!/usr/bin/env bash
# Backup do banco Postgres do Alpha Hub (Linux/macOS/WSL/Git Bash).
#
# O que faz:
#   - Lê a connection string do 1º argumento OU da variável de ambiente DATABASE_URL.
#   - Roda pg_dump e grava um dump COMPRIMIDO em backups/alphahub-YYYYMMDD-HHMMSS.sql.gz.
#
# Uso:
#   ./scripts/backup-db.sh                       # usa a env DATABASE_URL
#   ./scripts/backup-db.sh "postgres://user:senha@host:5432/alphahub"
#
# Requisitos: pg_dump (cliente PostgreSQL) e gzip no PATH.
# Dica: no Render, use a "External Database URL" (ver BACKUP.md).

set -euo pipefail

# 1) Descobre a connection string: 1º argumento tem prioridade; senão, a env.
DB_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "ERRO: informe a connection string." >&2
  echo "  - defina a variável de ambiente DATABASE_URL, OU" >&2
  echo "  - passe a URL como 1º argumento: ./scripts/backup-db.sh \"postgres://...\"" >&2
  exit 1
fi

# 2) Confere se o pg_dump está disponível (parte do cliente PostgreSQL).
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERRO: 'pg_dump' nao encontrado no PATH." >&2
  echo "  Instale o cliente PostgreSQL:" >&2
  echo "    - Debian/Ubuntu: sudo apt-get install postgresql-client" >&2
  echo "    - macOS (brew):  brew install libpq  (e adicione ao PATH)" >&2
  echo "    - Windows:       instale o PostgreSQL (inclui pg_dump)" >&2
  exit 1
fi

# 3) Precisamos de gzip para comprimir o dump.
if ! command -v gzip >/dev/null 2>&1; then
  echo "ERRO: 'gzip' nao encontrado no PATH." >&2
  exit 1
fi

# 4) Monta o caminho do arquivo de saída (pasta backups/ na raiz do repo).
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/alphahub-$STAMP.sql.gz"

# 5) Executa o dump e comprime na hora.
#    --no-owner / --no-privileges deixam o dump portátil entre bancos/planos.
echo "Gerando backup em: $OUT_FILE"
pg_dump --no-owner --no-privileges "$DB_URL" | gzip -9 > "$OUT_FILE"

echo "OK. Backup concluido:"
echo "  $OUT_FILE"
echo "  Tamanho: $(du -h "$OUT_FILE" | cut -f1)"
