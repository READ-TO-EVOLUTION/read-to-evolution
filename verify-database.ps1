# データベースの状態確認スクリプト
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "データベース状態確認" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. DATABASE_URLの確認
Write-Host "1. DATABASE_URL確認..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "DATABASE_URL"
    if ($envContent) {
        Write-Host "   ✓ .envにDATABASE_URLが存在: $envContent" -ForegroundColor Green
    } else {
        Write-Host "   ✗ .envにDATABASE_URLが見つかりません" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ .envファイルが見つかりません" -ForegroundColor Red
}

# 2. データベースファイルの確認
Write-Host "`n2. データベースファイル確認..." -ForegroundColor Yellow
$dbPath = "prisma/dev.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "   ✓ $dbPath が存在します" -ForegroundColor Green
    Write-Host "   サイズ: $([math]::Round($dbSize/1KB, 2)) KB" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ $dbPath が見つかりません" -ForegroundColor Red
    Write-Host "   `nデータベースを作成してください:" -ForegroundColor Yellow
    Write-Host "     npx prisma db push" -ForegroundColor White
    exit 1
}

# 3. Prisma schemaの確認
Write-Host "`n3. Prisma schema確認..." -ForegroundColor Yellow
$schemaContent = Get-Content "prisma/schema.prisma" -Raw
if ($schemaContent -match 'model UserBook') {
    Write-Host "   ✓ UserBookモデルが存在します" -ForegroundColor Green
    if ($schemaContent -match '@@map\("user_books"\)') {
        Write-Host "   ✓ user_booksテーブルマッピングが存在します" -ForegroundColor Green
    } else {
        Write-Host "   ✗ user_booksテーブルマッピングが見つかりません" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ UserBookモデルが見つかりません" -ForegroundColor Red
}

# 4. データベースの同期確認
Write-Host "`n4. データベース同期確認..." -ForegroundColor Yellow
Write-Host "   実行中: npx prisma db push --skip-generate" -ForegroundColor Cyan
try {
    $pushOutput = npx prisma db push --skip-generate 2>&1
    if ($pushOutput -match "in sync") {
        Write-Host "   ✓ データベースは同期されています" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ データベースの同期に問題がある可能性があります" -ForegroundColor Yellow
        Write-Host "   出力: $pushOutput" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ データベース同期に失敗: $_" -ForegroundColor Red
}

# 5. 開発サーバーの状態確認
Write-Host "`n5. 開発サーバー状態確認..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ 開発サーバーは起動しています (http://localhost:3000)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 開発サーバーが起動していません" -ForegroundColor Red
    Write-Host "   `n開発サーバーを起動してください:" -ForegroundColor Yellow
    Write-Host "     npm run dev" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "確認完了" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "次のステップ:" -ForegroundColor Yellow
Write-Host "1. 開発サーバーを停止 (Ctrl+C)" -ForegroundColor White
Write-Host "2. npx prisma generate" -ForegroundColor White
Write-Host "3. npm run dev を再起動" -ForegroundColor White
Write-Host "4. 書籍登録を試す" -ForegroundColor White
