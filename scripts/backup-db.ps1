<#
  Backup do banco Postgres do Alpha Hub (Windows / PowerShell).

  O que faz:
    - Le a connection string do parametro -DatabaseUrl (1o argumento) OU da env DATABASE_URL.
    - Roda pg_dump e grava um dump COMPRIMIDO (.gz) em backups/alphahub-YYYYMMDD-HHMMSS.sql.gz.

  Uso:
    powershell -File scripts/backup-db.ps1                         # usa a env DATABASE_URL
    powershell -File scripts/backup-db.ps1 "postgres://user:senha@host:5432/alphahub"

  Requisitos: pg_dump (cliente PostgreSQL) no PATH.
  Dica: no Render, use a "External Database URL" (ver BACKUP.md).
#>
param(
  # 1o argumento posicional; se vazio, cai na env DATABASE_URL mais abaixo.
  [string]$DatabaseUrl
)

$ErrorActionPreference = 'Stop'

# 1) Descobre a connection string: parametro tem prioridade; senao, a env.
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  $DatabaseUrl = $env:DATABASE_URL
}
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error @"
ERRO: informe a connection string.
  - defina a variavel de ambiente DATABASE_URL, OU
  - passe a URL como 1o argumento: powershell -File scripts/backup-db.ps1 "postgres://..."
"@
  exit 1
}

# 2) Confere se o pg_dump esta disponivel (parte do cliente PostgreSQL).
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error @"
ERRO: 'pg_dump' nao encontrado no PATH.
  Instale o cliente PostgreSQL (o instalador oficial do PostgreSQL ja inclui pg_dump)
  e garanta que a pasta 'bin' esteja no PATH. Ex.:
    C:\Program Files\PostgreSQL\16\bin
"@
  exit 1
}

# 3) Monta o caminho do arquivo de saida (pasta backups/ na raiz do repo).
$root      = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $backupDir "alphahub-$stamp.sql.gz"
# Arquivo temporario (dump nao comprimido) antes de gerar o .gz.
$tmpFile = Join-Path $backupDir "alphahub-$stamp.sql"

Write-Host "Gerando backup em: $outFile"

try {
  # 4) Executa o dump para um arquivo temporario.
  #    --no-owner / --no-privileges deixam o dump portatil entre bancos/planos.
  & pg_dump --no-owner --no-privileges --file="$tmpFile" "$DatabaseUrl"
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump retornou codigo $LASTEXITCODE."
  }

  # 5) Comprime para .gz (GZip nativo do .NET) e remove o temporario.
  $inStream  = [System.IO.File]::OpenRead($tmpFile)
  $outStream = [System.IO.File]::Create($outFile)
  $gzip      = New-Object System.IO.Compression.GzipStream($outStream, [System.IO.Compression.CompressionMode]::Compress)
  try {
    $inStream.CopyTo($gzip)
  } finally {
    $gzip.Dispose(); $outStream.Dispose(); $inStream.Dispose()
  }
  Remove-Item $tmpFile -Force

  $sizeKB = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
  Write-Host "OK. Backup concluido:"
  Write-Host "  $outFile"
  Write-Host "  Tamanho: $sizeKB KB"
}
catch {
  # Limpa restos em caso de erro.
  if (Test-Path $tmpFile) { Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue }
  throw
}
