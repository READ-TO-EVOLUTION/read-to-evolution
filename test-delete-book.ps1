#requires -Version 5.1
$ErrorActionPreference = "Stop"

# 1) Set token value here (replace YOUR_TOKEN_VALUE_HERE)
$tokenValue = "YOUR_TOKEN_VALUE_HERE"
$cookie = "token=$tokenValue"

Write-Host "== auth check =="
$auth = curl.exe -s -i "http://localhost:3000/api/auth/me" -H "Cookie: $cookie"
$auth | Select-Object -First 20

# Check status (exit if not 200)
if ($auth -notmatch "HTTP/\d\.\d 200") {
  Write-Host "Auth failed (not 200). Check token value." -ForegroundColor Red
  exit 1
}

Write-Host "== user-books =="
$json = curl.exe -s "http://localhost:3000/api/user-books" -H "Cookie: $cookie"
if (-not $json) { throw "Empty response from /api/user-books" }

$r = $json | ConvertFrom-Json
if (-not $r.userBooks -or $r.userBooks.Count -eq 0) {
  Write-Host "userBooks is empty. Add a book to shelf first." -ForegroundColor Yellow
  exit 0
}

$bookId = $r.userBooks[0].bookId
Write-Host "bookId=$bookId"

Write-Host "== DELETE /api/books/$bookId =="
$del = curl.exe -s -i -X DELETE "http://localhost:3000/api/books/$bookId" -H "Cookie: $cookie"
$del | Select-Object -First 40
