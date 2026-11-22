param(
    [string]$CloudflaredPath = 'D:\Tools\Cloudflared\cloudflared.exe'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateDirectory = Join-Path $projectRoot '.local-demo'
$stateFile = Join-Path $stateDirectory 'tunnel.json'
$backendUrl = 'http://localhost:8082'

function Confirm-Api([string]$BaseUrl) {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/home/books" -TimeoutSec 20
    if ($response.StatusCode -ne 200) { throw "Book API returned HTTP $($response.StatusCode)." }
}

function Set-ApiSetting([string]$Path, [string]$Name, [string]$Value) {
    $encoding = [System.Text.UTF8Encoding]::new($false)
    $content = if (Test-Path -LiteralPath $Path) { [System.IO.File]::ReadAllText($Path) } else { '' }
    $pattern = '(?m)^\s*' + [regex]::Escape($Name) + '=.*$'
    if ([regex]::IsMatch($content, $pattern)) {
        $content = [regex]::Replace($content, $pattern, "$Name=$Value")
    } else {
        if ($content.Length -gt 0 -and !$content.EndsWith("`n")) { $content += "`r`n" }
        $content += "$Name=$Value`r`n"
    }
    [System.IO.File]::WriteAllText($Path, $content, $encoding)
}

Confirm-Api $backendUrl
if (!(Test-Path -LiteralPath $CloudflaredPath -PathType Leaf)) {
    $command = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (!$command) { throw 'cloudflared was not found. Supply -CloudflaredPath.' }
    $CloudflaredPath = $command.Source
}
$CloudflaredPath = (Resolve-Path -LiteralPath $CloudflaredPath).Path
New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

$publicUrl = $null
$tunnelProcess = $null
if (Test-Path -LiteralPath $stateFile) {
    $previous = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $existing = Get-Process -Id $previous.ProcessId -ErrorAction SilentlyContinue
    if ($existing -and $existing.Path -ieq $CloudflaredPath -and
        $existing.StartTime.ToUniversalTime().Ticks -eq ([DateTime]$previous.ProcessStartedUtc).ToUniversalTime().Ticks) {
        Confirm-Api $previous.PublicUrl
        $publicUrl = $previous.PublicUrl
        $tunnelProcess = $existing
        Write-Host 'Reusing the existing HALM tunnel.'
    }
}

if (!$publicUrl) {
    $runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $outputLog = Join-Path $stateDirectory "cloudflared-$runId.out.log"
    $errorLog = Join-Path $stateDirectory "cloudflared-$runId.err.log"
    $tunnelProcess = Start-Process -FilePath $CloudflaredPath -ArgumentList @('tunnel', '--url', $backendUrl) `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput $outputLog -RedirectStandardError $errorLog
    try {
        $deadline = [DateTime]::UtcNow.AddSeconds(75)
        while ([DateTime]::UtcNow -lt $deadline) {
            $tunnelProcess.Refresh()
            if ($tunnelProcess.HasExited) { throw "Tunnel exited. See $errorLog" }
            $log = ''
            if (Test-Path -LiteralPath $errorLog) {
                $stream = [System.IO.File]::Open($errorLog, [System.IO.FileMode]::Open,
                    [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                $reader = [System.IO.StreamReader]::new($stream)
                try { $log = $reader.ReadToEnd() } finally { $reader.Dispose() }
            }
            $match = [regex]::Match($log, 'https://[a-z0-9-]+\.trycloudflare\.com')
            if ($match.Success) {
                try {
                    Confirm-Api $match.Value
                    $publicUrl = $match.Value
                    break
                } catch { Start-Sleep -Seconds 2 }
            } else { Start-Sleep -Milliseconds 500 }
        }
        if (!$publicUrl) { throw "The tunnel did not become ready. See $errorLog" }
    } catch {
        if (!$tunnelProcess.HasExited) { Stop-Process -Id $tunnelProcess.Id -ErrorAction SilentlyContinue }
        throw
    }
}

Set-ApiSetting (Join-Path $projectRoot 'HalmBookFE/.env.local') 'VITE_API_BASE_URL' $publicUrl
Set-ApiSetting (Join-Path $projectRoot 'HalmBookApp/.env.local') 'EXPO_PUBLIC_API_URL' $publicUrl
[ordered]@{
    PublicUrl = $publicUrl
    BackendUrl = $backendUrl
    ProcessId = $tunnelProcess.Id
    ProcessStartedUtc = $tunnelProcess.StartTime.ToUniversalTime().ToString('o')
    ExecutablePath = $CloudflaredPath
    UpdatedUtc = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8

Write-Host "Backend API: $publicUrl"
Write-Host "Verified API: $publicUrl/api/home/books"
Write-Host 'Updated HalmBookFE/.env.local and HalmBookApp/.env.local.'
Write-Host "Vercel Production environment: VITE_API_BASE_URL=$publicUrl"
Write-Host 'Redeploy Vercel after changing its environment variable.'
Write-Host 'Restart Expo from HalmBookApp with: npm.cmd run start -- --tunnel'
Write-Host 'Stop only this tunnel with: .\scripts\Stop-HalmTunnel.ps1'
