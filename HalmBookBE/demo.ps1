param(
    [ValidateSet('Run', 'Test')]
    [string]$Mode = 'Run',
    [switch]$NoEmail,
    [switch]$Offline
)

$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
$previousDirectory = Get-Location

function Test-Java21([string]$JavaDirectory) {
    if (!$JavaDirectory -or !(Test-Path -LiteralPath (Join-Path $JavaDirectory 'bin/java.exe'))) { return $false }
    $releaseFile = Join-Path $JavaDirectory 'release'
    return (Test-Path -LiteralPath $releaseFile) -and
        [bool](Select-String -LiteralPath $releaseFile -Pattern '^JAVA_VERSION="21\.' -Quiet)
}

# Match the Gradle toolchain even when IntelliJ's selected Application uses JDK 23.
if (!(Test-Java21 $env:JAVA_HOME)) {
    $candidates = @()
    foreach ($directory in @((Join-Path $env:USERPROFILE '.jdks'), (Join-Path $env:ProgramFiles 'Java'))) {
        if (Test-Path -LiteralPath $directory) {
            $candidates += Get-ChildItem -LiteralPath $directory -Directory | Sort-Object Name -Descending
        }
    }
    $javaDirectory = $candidates | Where-Object { Test-Java21 $_.FullName } | Select-Object -First 1
    if (!$javaDirectory) { throw 'Java 21 is required. Set JAVA_HOME to an installed JDK 21.' }
    $env:JAVA_HOME = $javaDirectory.FullName
}

# Reuse local, untracked IntelliJ credentials without copying secrets into source.
# Explicit environment variables always take precedence.
$ideaFile = Join-Path $projectDirectory '.idea/workspace.xml'
if (Test-Path -LiteralPath $ideaFile) {
    $ideaSettings = [xml](Get-Content -LiteralPath $ideaFile -Raw)
    $springRun = $ideaSettings.SelectSingleNode('//configuration[@name="HalmBookBeApplication" and @type="SpringBootApplicationConfigurationType"]')
    if ($springRun) {
        foreach ($setting in $springRun.envs.env) {
            if (![Environment]::GetEnvironmentVariable($setting.name, 'Process')) {
                [Environment]::SetEnvironmentVariable($setting.name, $setting.value, 'Process')
            }
        }
    }
}

if ($NoEmail -or $Mode -eq 'Test') { $env:SUPPORT_EMAIL_ENABLED = 'false' }
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

try {
    Set-Location -LiteralPath $projectDirectory
    $gradleArguments = @('--console=plain', '--no-daemon')
    if ($Offline) { $gradleArguments += '--offline' }
    if ($Mode -eq 'Test') {
        & .\gradlew.bat @gradleArguments test liveTest
        if ($LASTEXITCODE -ne 0) { throw "Backend tests failed (exit $LASTEXITCODE). See build/reports/tests/." }
    } else {
        & .\gradlew.bat @gradleArguments bootJar
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed (exit $LASTEXITCODE)." }
        $applicationJar = Get-ChildItem -LiteralPath (Join-Path $projectDirectory 'build/libs') -Filter '*.jar' |
            Where-Object Name -NotLike '*-plain.jar' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (!$applicationJar) { throw 'The executable application JAR was not produced.' }
        Write-Host 'Starting HalmBookBE with Java 21. Stop this foreground process with Ctrl+C when the demo is finished.'
        & (Join-Path $env:JAVA_HOME 'bin/java.exe') '-Dfile.encoding=UTF-8' '-Dstdout.encoding=UTF-8' '-Dstderr.encoding=UTF-8' -jar $applicationJar.FullName
        if ($LASTEXITCODE -notin @(0, 130, -1073741510)) { throw "Backend exited with code $LASTEXITCODE." }
    }
} finally {
    Set-Location -LiteralPath $previousDirectory
}
