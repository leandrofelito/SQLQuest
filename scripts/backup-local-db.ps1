$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot '.env.local'
$BackupDir = Join-Path $ProjectRoot 'backups'
$PgDump = 'D:\PostgreSQL1\bin\pg_dump.exe'

if (!(Test-Path $EnvFile)) {
  throw ".env.local not found at $EnvFile"
}

if (!(Test-Path $PgDump)) {
  throw "pg_dump not found at $PgDump"
}

$databaseUrlLine = Get-Content $EnvFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (!$databaseUrlLine) {
  throw 'DATABASE_URL not found in .env.local'
}

$databaseUrl = ($databaseUrlLine -replace '^DATABASE_URL=', '').Trim('"')
$uri = [Uri]$databaseUrl
$userInfo = $uri.UserInfo.Split(':', 2)
$user = [Uri]::UnescapeDataString($userInfo[0])
$password = [Uri]::UnescapeDataString($userInfo[1])
$database = $uri.AbsolutePath.TrimStart('/')

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $BackupDir "sqlquest_local-$timestamp.dump"

$env:PGPASSWORD = $password
& $PgDump `
  --host $uri.Host `
  --port $uri.Port `
  --username $user `
  --dbname $database `
  --format custom `
  --file $backupFile

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

Get-ChildItem $BackupDir -Filter 'sqlquest_local-*.dump' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 14 |
  Remove-Item -Force

Write-Output "Backup created: $backupFile"
