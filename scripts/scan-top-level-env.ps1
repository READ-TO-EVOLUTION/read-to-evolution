# scripts/scan-top-level-env.ps1
# Scan for risky TOP-LEVEL env access / Stripe init that can break Next.js build.
# PowerShell 5.1 compatible. ASCII only.

$ErrorActionPreference = "Stop"

Write-Host "=== scan-top-level-env.ps1 ==="

$files = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*.next*" -and
    $_.FullName -notlike "*\.git*"
}

# Pattern A: process.env.* with throw new Error on same line (rough)
$patternA = "process\.env\.[A-Z0-9_]+.*throw new Error|throw new Error.*process\.env\.[A-Z0-9_]+"
# Pattern B: new Stripe(
$patternB = "new\s+Stripe\s*\("
# Pattern C: export const stripe =
$patternC = "export\s+const\s+stripe\s*="

function Get-TopLevelText([string]$path) {
  # Return only the "top-level region" (rough): from start until first export/function/class/module.exports.
  $lines = Get-Content -LiteralPath $path -ErrorAction Stop
  $stopIndex = $lines.Count

  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "^\s*export\s+" -or
        $line -match "^\s*function\s+" -or
        $line -match "^\s*class\s+" -or
        $line -match "^\s*export\s+default\b" -or
        $line -match "^\s*module\.exports\b") {
      $stopIndex = $i
      break
    }
  }

  if ($stopIndex -le 0) { return "" }
  return ($lines[0..($stopIndex-1)] -join "`n")
}

$hitsA = @()
$hitsB = @()
$hitsC = @()

foreach ($f in $files) {
  $top = Get-TopLevelText $f.FullName

  if ($top -match $patternA) { $hitsA += $f.FullName }
  if ($top -match $patternB) { $hitsB += $f.FullName }
  if ($top -match $patternC) { $hitsC += $f.FullName }
}

function PrintList($title, $list) {
  Write-Host ""
  Write-Host $title
  if (-not $list -or $list.Count -eq 0) {
    Write-Host "  [OK] 0 hits"
    return
  }
  Write-Host ("  [WARN] " + $list.Count + " hits")
  $list | ForEach-Object { Write-Host ("  " + $_) }
}

PrintList "[A] TOP-LEVEL: process.env + throw new Error (same text region)" $hitsA
PrintList "[B] TOP-LEVEL: new Stripe(" $hitsB
PrintList "[C] TOP-LEVEL: export const stripe =" $hitsC

if (($hitsA.Count -gt 0) -or ($hitsB.Count -gt 0) -or ($hitsC.Count -gt 0)) {
  Write-Host ""
  Write-Host "[RESULT] WARN: potential risky TOP-LEVEL code found."
  exit 1
} else {
  Write-Host ""
  Write-Host "[RESULT] OK: no risky TOP-LEVEL patterns found."
  exit 0
}
