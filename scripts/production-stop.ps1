$ErrorActionPreference = 'Stop'

$listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
  $processId = $listener.OwningProcess
  if ($processId) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

Write-Output 'SQLQuest production server stopped if it was running.'
