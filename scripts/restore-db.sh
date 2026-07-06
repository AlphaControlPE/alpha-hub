#!/usr/bin/env bash
# Restaura um backup do Alpha Hub para um banco Postgres.
#
# ATENÇÃO: isto SOBRESCREVE dados no banco de destino. Use com cuidado.
#
# Uso:
#   ./scripts/restore-db.sh backups/alphahub-YYYYMMDD-HHMMSS.sql.gz            # usa a env DATABASE_URL
#   ./scripts/restore-db.sh backups/arquivo.sql.gz "postgres://user:senha@host/db"
#
# Requisitos: psql (cliente PostgreSQL) e gunzip/gzip no PATH.

set -euo pipefail

ARQUIVO="${1:-}"
DB_URL="${2:-${DATABASE_URL:-}}"

if [ -z "$ARQUIVO" ] || [ ! -f "$ARQUIVO" ]; then
  echo "ERRO: informe o arquivo de backup existente como 1º argumento." >&2
  echo "  Ex.: ./scripts/restore-db.sh backups/alphahub-20260101-120000.sql.gz" >&2
  exit 1
fi
if [ -z "$DB_URL" ]; then
  echo "ERRO: informe a connection string de destino (env DATABASE_URL ou 2º argumento)." >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERRO: 'psql' nao encontrado no PATH (instale o cliente PostgreSQL)." >&2
  exit 1
fi

echo "!!! Isto vai SOBRESCREVER dados em: $DB_URL"
read -r -p "Digite 'CONFIRMAR' para prosseguir: " RESP
if [ "$RESP" != "CONFIRMAR" ]; then
  echo "Cancelado."
  exit 0
fi

echo "Restaurando $ARQUIVO ..."
# Descomprime na hora e aplica; ON_ERROR_STOP aborta ao primeiro erro.
gunzip -c "$ARQUIVO" | psql -v ON_ERROR_STOP=1 "$DB_URL"
echo "OK. Restauração concluída."
