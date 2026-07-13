<#
.SYNOPSIS
  Check Java version and emit clear install instructions if < 21.
  Exit 0 = OK, Exit 1 = Java not found or too old.
#>

$MIN_VERSION = 21

Write-Host "AltasAI - Java Version Check" -ForegroundColor Cyan
Write-Host "Minimum required: Java $MIN_VERSION (for Firebase Firestore emulator)" -ForegroundColor Cyan
Write-Host ""

try {
    $javaOutput = java -version 2>&1
    $versionLine = ($javaOutput | Where-Object { $_ -match "version" } | Select-Object -First 1).ToString()

    Write-Host "Detected: $versionLine" -ForegroundColor Yellow

    # Match the major version number (handles "17.0.x", "21.0.x", "1.8.x")
    if ($versionLine -match [regex]'"(\d+)') {
        $major = [int]$Matches[1]
        if ($major -eq 1) {
            # Old Java format: "1.8.0" -> 8
            if ($versionLine -match [regex]'"1\.(\d+)') { $major = [int]$Matches[1] }
        }
    } else {
        throw "Cannot parse version"
    }

    Write-Host "Major version: $major" -ForegroundColor Yellow
    Write-Host ""

    if ($major -ge $MIN_VERSION) {
        Write-Host "OK Java $major meets requirement (>= $MIN_VERSION)." -ForegroundColor Green
        Write-Host "   Run: npm run test:rules --workspace=@altasai/backend" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "FAIL Java $major is too old. Firebase emulator needs Java $MIN_VERSION+." -ForegroundColor Red
        Write-Host ""
        Write-Host "=== Install Java 21 (Temurin LTS - free) ===" -ForegroundColor Cyan
        Write-Host "Option A (winget): winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Yellow
        Write-Host "Option B (manual): https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Yellow
        Write-Host "Option C (choco):  choco install temurin21 -y" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Restart terminal after install, then re-run this script." -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "FAIL Java not found or not on PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "=== Install Java 21 (Temurin LTS - free) ===" -ForegroundColor Cyan
    Write-Host "Option A (winget): winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Yellow
    Write-Host "Option B (manual): https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Restart terminal after install, then re-run this script." -ForegroundColor White
    exit 1
}
