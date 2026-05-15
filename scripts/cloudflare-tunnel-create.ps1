$ErrorActionPreference = 'Stop'

$Cloudflared = Join-Path $env:USERPROFILE 'bin\cloudflared.exe'
$ConfigDir = Join-Path $env:USERPROFILE '.cloudflared'
$TunnelName = 'sqlquest'
$Hostname = 'sqlquest.com.br'
$Service = 'http://localhost:3000'

if (!(Test-Path $Cloudflared)) {
  throw "cloudflared not found at $Cloudflared"
}

New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

$existing = & $Cloudflared tunnel list 2>$null | Select-String -Pattern $TunnelName
if (!$existing) {
  & $Cloudflared tunnel create $TunnelName
}

$tunnelLine = & $Cloudflared tunnel list | Select-String -Pattern $TunnelName | Select-Object -First 1
if (!$tunnelLine) {
  throw "Could not find tunnel $TunnelName after creation."
}

$tunnelId = ($tunnelLine.ToString() -split '\s+')[0]
$credentialsFile = Join-Path $ConfigDir "$tunnelId.json"

@"
tunnel: $tunnelId
credentials-file: $credentialsFile

ingress:
  - hostname: $Hostname
    service: $Service
  - service: http_status:404
"@ | Set-Content -LiteralPath (Join-Path $ConfigDir 'config.yml') -Encoding ASCII

& $Cloudflared tunnel route dns $TunnelName $Hostname

Write-Output "Tunnel configured: $TunnelName -> $Hostname -> $Service"
Write-Output "Config file: $(Join-Path $ConfigDir 'config.yml')"
