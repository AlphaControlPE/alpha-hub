<#
  Postgres portátil para desenvolvimento local (sem Docker, sem admin).
  Sobe um PostgreSQL em localhost:5432 com usuário/banco "alphahub".
  A mesma DATABASE_URL é usada pelo docker-compose, então o app não muda.

  Uso:
    powershell -File scripts/pg-portable.ps1 -Action start
    powershell -File scripts/pg-portable.ps1 -Action stop
    powershell -File scripts/pg-portable.ps1 -Action status
#>
param(
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'start',
  [string]$Version = '16.4-1',
  [int]$Port = 5432
)

$ErrorActionPreference = 'Stop'
$root     = Split-Path -Parent $PSScriptRoot
$cache    = Join-Path $env:LOCALAPPDATA 'alphahub-pg'
$zipPath  = Join-Path $cache "pg-$Version.zip"
$binRoot  = Join-Path $cache "pgsql-$Version"
$dataDir  = Join-Path $root '.pgdata'
$pwFile   = Join-Path $cache 'pw.txt'
$logFile  = Join-Path $root '.pgdata.log'

function Get-Bin($name) { Join-Path $binRoot "pgsql\bin\$name.exe" }

function Ensure-Binaries {
  if (Test-Path (Get-Bin 'pg_ctl')) { return }
  New-Item -ItemType Directory -Force -Path $cache | Out-Null
  if (-not (Test-Path $zipPath)) {
    $url = "https://get.enterprisedb.com/postgresql/postgresql-$Version-windows-x64-binaries.zip"
    Write-Host "Baixando PostgreSQL $Version..."
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 900
  }
  Write-Host "Extraindo binários..."
  Expand-Archive -Path $zipPath -DestinationPath $binRoot -Force
}

function Ensure-Cluster {
  if (Test-Path (Join-Path $dataDir 'PG_VERSION')) { return }
  Write-Host "Inicializando cluster em $dataDir..."
  'alphahub' | Out-File -FilePath $pwFile -Encoding ascii -NoNewline
  & (Get-Bin 'initdb') -D $dataDir -U alphahub -A scram-sha-256 --pwfile=$pwFile -E UTF8 | Out-Null
}

switch ($Action) {
  'start' {
    Ensure-Binaries
    Ensure-Cluster
    Write-Host "Iniciando PostgreSQL na porta $Port..."
    & (Get-Bin 'pg_ctl') -D $dataDir -l $logFile -o "-p $Port" -w start
    # cria o banco alphahub se ainda não existir
    $env:PGPASSWORD = 'alphahub'
    $exists = & (Get-Bin 'psql') -U alphahub -h localhost -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='alphahub'"
    if ($exists -ne '1') {
      & (Get-Bin 'createdb') -U alphahub -h localhost -p $Port alphahub
      Write-Host "Banco 'alphahub' criado."
    }
    Write-Host "Pronto: postgresql://alphahub:alphahub@localhost:$Port/alphahub"
  }
  'stop' {
    if (Test-Path (Join-Path $dataDir 'postmaster.pid')) {
      & (Get-Bin 'pg_ctl') -D $dataDir -w stop
      Write-Host "PostgreSQL parado."
    } else {
      Write-Host "Nada para parar."
    }
  }
  'status' {
    & (Get-Bin 'pg_ctl') -D $dataDir status
  }
}
