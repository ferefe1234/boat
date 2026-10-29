$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    python build/prepare-assets.py
    if ($LASTEXITCODE -ne 0) { throw 'Logo preparation failed' }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
    npm run build:android
    if ($LASTEXITCODE -ne 0) { throw 'Web build failed' }
    Push-Location android
    try {
        gradle --no-daemon :app:assembleDebug :app:lintDebug
        if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }
    } finally { Pop-Location }
    Write-Host 'APK: android/app/build/outputs/apk/debug/app-debug.apk'
} finally { Pop-Location }
