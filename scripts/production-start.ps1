$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $ProjectRoot '.logs'
$LogFile = Join-Path $LogDir 'production.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $ProjectRoot

$portInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
  "$(Get-Date -Format o) SQLQuest already listening on port 3000; exiting." | Add-Content $LogFile
  exit 0
}

"$(Get-Date -Format o) Starting SQLQuest production server..." | Add-Content $LogFile

$env:NODE_ENV = 'production'
npx.cmd next start -H 127.0.0.1 -p 3000 *>> $LogFile
