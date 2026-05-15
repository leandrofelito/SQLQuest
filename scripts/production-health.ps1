$ErrorActionPreference = 'Stop'

$ping = Invoke-RestMethod 'http://localhost:3000/api/ping' -TimeoutSec 15
$trilhas = Invoke-RestMethod 'http://localhost:3000/api/trilhas/count' -TimeoutSec 15

[PSCustomObject]@{
  AppPing = [bool]$ping.ok
  Trilhas = [int]$trilhas.total
  CheckedAt = (Get-Date).ToString('o')
}
