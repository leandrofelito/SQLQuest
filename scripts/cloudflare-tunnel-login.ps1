$ErrorActionPreference = 'Stop'

$Cloudflared = Join-Path $env:USERPROFILE 'bin\cloudflared.exe'
if (!(Test-Path $Cloudflared)) {
  throw "cloudflared not found at $Cloudflared"
}

& $Cloudflared tunnel login
