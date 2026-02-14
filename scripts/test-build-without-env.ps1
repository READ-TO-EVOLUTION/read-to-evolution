# scripts/test-build-without-env.ps1
# Verify that build succeeds without .env file.
# PowerShell 5.1 compatible. ASCII only.

$ErrorActionPreference = "Stop"

Write-Host "=== test-build-without-env.ps1 ==="

# Backup .env file
$envBackup = ".env.bak"
$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "Backing up .env file..." -ForegroundColor Yellow
    Rename-Item -Path $envFile -NewName $envBackup -ErrorAction SilentlyContinue
    Write-Host "Backup complete: $envBackup" -ForegroundColor Green
} else {
    Write-Host ".env file not found (already missing)" -ForegroundColor Yellow
}

# Remove .next directory
# Note: OneDrive sync folders may cause EINVAL readlink errors.
# Root cause fix: Move project outside OneDrive (e.g., C:\dev\read-to-evolution\)
# Workaround: Delete .next before build (automated in this script)
if (Test-Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "Removed" -ForegroundColor Green
}

# Run build
Write-Host ""
Write-Host "Running build..." -ForegroundColor Cyan

# IMPORTANT:
# - In Windows PowerShell 5.1, native stderr output can be treated as an error record.
# - We must not fail the script when build exit code is 0.
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"

cmd /c "npm run build"
$buildExitCode = $LASTEXITCODE

$ErrorActionPreference = $oldEap

Write-Host ""
Write-Host "Build exit code: $buildExitCode" -ForegroundColor Cyan

# Check build success
if ($buildExitCode -eq 0) {
    Write-Host ""
    Write-Host "[OK] Build succeeded (without .env)" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[FAIL] Build failed (without .env)" -ForegroundColor Red
}

# Restore .env file
if (Test-Path $envBackup) {
    Write-Host ""
    Write-Host "Restoring .env file..." -ForegroundColor Yellow
    Rename-Item -Path $envBackup -NewName $envFile -ErrorAction SilentlyContinue
    Write-Host "Restored" -ForegroundColor Green
}

# Return exit code (for CI/CD)
# Note: Dynamic server usage warnings are non-fatal and do not cause build failure
exit $buildExitCode
