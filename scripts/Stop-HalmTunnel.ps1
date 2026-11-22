$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $projectRoot '.local-demo/tunnel.json'
if (!(Test-Path -LiteralPath $stateFile)) {
    Write-Host 'No HALM tunnel state was found.'
    return
}
$state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
$tunnelProcess = Get-Process -Id $state.ProcessId -ErrorAction SilentlyContinue
if (!$tunnelProcess) {
    Write-Host 'The HALM tunnel is already stopped.'
    return
}
if ($tunnelProcess.Path -ine $state.ExecutablePath -or
    $tunnelProcess.StartTime.ToUniversalTime().Ticks -ne ([DateTime]$state.ProcessStartedUtc).ToUniversalTime().Ticks) {
    throw 'The saved process no longer matches the HALM tunnel. No process was stopped.'
}
Stop-Process -Id $tunnelProcess.Id
Write-Host 'Stopped the HALM Cloudflare tunnel. Its public URL is now unavailable.'
