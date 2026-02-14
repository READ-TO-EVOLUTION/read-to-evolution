# 書籍登録動作確認スクリプト
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "書籍登録動作確認" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. ログイン
Write-Host "1. ログイン中..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "   ✓ ログイン成功" -ForegroundColor Green
} catch {
    Write-Host "   ✗ ログイン失敗: $_" -ForegroundColor Red
    Write-Host "`n注意: ブラウザでログインして、DevToolsからtoken Cookieの値を取得してください" -ForegroundColor Yellow
    Write-Host "その後、以下のコマンドを実行してください:`n" -ForegroundColor Yellow
    Write-Host '   $cookie = "token=YOUR_TOKEN_VALUE_HERE"' -ForegroundColor White
    Write-Host '   .\test-book-registration.ps1' -ForegroundColor White
    exit 1
}

# Cookieを取得（実際の環境ではブラウザから取得）
Write-Host "`n注意: 実際のtoken値をブラウザのDevToolsから取得して設定してください" -ForegroundColor Yellow
$cookie = "token=YOUR_TOKEN_VALUE_HERE"
if ($cookie -eq "token=YOUR_TOKEN_VALUE_HERE") {
    Write-Host "`nCookieを設定してください:" -ForegroundColor Red
    Write-Host '   $cookie = "token=実際のトークン値"' -ForegroundColor White
    exit 1
}

# 2. 書籍登録
Write-Host "`n2. 書籍登録中..." -ForegroundColor Yellow
$bookBody = @{
    title = "テスト書籍 $(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/books" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "Cookie" = $cookie } `
        -Body $bookBody
    
    Write-Host "   ✓ 書籍登録成功 (HTTP 201)" -ForegroundColor Green
    Write-Host "   Book ID: $($res.book.id)" -ForegroundColor Cyan
    Write-Host "   UserBook ID: $($res.userBook.id)" -ForegroundColor Cyan
    Write-Host "   タイトル: $($res.book.title)" -ForegroundColor Cyan
    Write-Host "   ステータス: $($res.userBook.status)" -ForegroundColor Cyan
    
    $bookId = $res.book.id
    $userBookId = $res.userBook.id
} catch {
    Write-Host "   ✗ 書籍登録失敗" -ForegroundColor Red
    Write-Host "   エラー: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   レスポンス: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# 3. 本棚一覧取得
Write-Host "`n3. 本棚一覧取得中..." -ForegroundColor Yellow
try {
    $userBooks = Invoke-RestMethod -Uri "http://localhost:3000/api/user-books" `
        -Method GET `
        -Headers @{ "Cookie" = $cookie }
    
    Write-Host "   ✓ 本棚一覧取得成功" -ForegroundColor Green
    Write-Host "   登録済み書籍数: $($userBooks.userBooks.Count)" -ForegroundColor Cyan
    
    $found = $userBooks.userBooks | Where-Object { $_.id -eq $userBookId }
    if ($found) {
        Write-Host "   ✓ 登録した書籍が本棚に存在します" -ForegroundColor Green
        Write-Host "   タイトル: $($found.book.title)" -ForegroundColor Cyan
        Write-Host "   ステータス: $($found.status)" -ForegroundColor Cyan
    } else {
        Write-Host "   ✗ 登録した書籍が本棚に見つかりません" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 本棚一覧取得失敗: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "動作確認完了" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
