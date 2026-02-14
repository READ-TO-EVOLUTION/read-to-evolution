# 公開レビュー一覧API 動作確認手順

## API仕様

- **エンドポイント**: `GET /api/reviews/public?bookId=...&limit=20&offset=0`
- **認証**: 不要（未ログインでも閲覧可能）
- **レスポンス**: 公開レビュー一覧（`isPublic=true`のみ）

---

## 前提条件

1. Next.js開発サーバーが起動している（`npm run dev`）
2. データベースに以下が存在すること：
   - 少なくとも1冊のBook（`bookId`）
   - そのBookに対する公開レビュー（`isPublic=true`）が1件以上

---

## 手順1: 公開レビューを作成（テストデータ準備）

### 1-1. ログインしてトークンを取得

```powershell
# ログイン（email/passwordは実際の値に置き換え）
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody `
    -SessionVariable session

# Cookieからトークンを取得（ブラウザのDevToolsで確認する方が確実）
# または、レスポンスヘッダーから取得
```

### 1-2. bookIdを取得

```powershell
# ユーザーの本棚からbookIdを取得
$cookie = "token=YOUR_TOKEN_VALUE_HERE"
$userBooksRes = Invoke-RestMethod -Uri "http://localhost:3000/api/user-books" `
    -Method GET `
    -Headers @{ "Cookie" = $cookie }

$bookId = $userBooksRes.userBooks[0].bookId
Write-Host "bookId=$bookId"
```

### 1-3. 公開レビューを作成

```powershell
# 公開レビューを作成（isPublic: true）
$reviewBody = @{
    bookId = $bookId
    rating = 5
    comment = "とても良い本でした"
    emotionTag = "FUN"
    isPublic = $true
    hasSpoiler = $false
} | ConvertTo-Json

$reviewRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Cookie" = $cookie } `
    -Body $reviewBody

Write-Host "Review created: $($reviewRes.review.id)"
```

---

## 手順2: 公開レビュー一覧を取得（基本）

### 2-1. 未ログインで取得（認証不要の確認）

```powershell
# bookIdを指定して公開レビュー一覧を取得
$bookId = "YOUR_BOOK_ID_HERE"

$publicReviewsRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId" `
    -Method GET

# レスポンス確認
$publicReviewsRes | ConvertTo-Json -Depth 5
```

**期待されるレスポンス**:
```json
{
  "reviews": [
    {
      "id": "...",
      "rating": 5,
      "comment": "とても良い本でした",
      "emotionTag": "FUN",
      "hasSpoiler": false,
      "createdAt": "2026-01-XX...",
      "user": {
        "name": "ユーザー名 または 匿名ユーザー"
      },
      "book": {
        "id": "...",
        "title": "書籍タイトル",
        "author": "著者名"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 2-2. curl.exeを使用する場合（PowerShell）

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

# 基本取得
curl.exe -s "http://localhost:3000/api/reviews/public?bookId=$bookId" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 手順3: ページングをテスト

### 3-1. limitとoffsetを指定

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

# 1ページ目（最初の10件）
$page1 = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId&limit=10&offset=0" `
    -Method GET

Write-Host "Page 1: $($page1.pagination.total)件中、$($page1.reviews.Count)件取得"
Write-Host "hasMore: $($page1.pagination.hasMore)"

# 2ページ目（次の10件）
$page2 = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId&limit=10&offset=10" `
    -Method GET

Write-Host "Page 2: $($page2.reviews.Count)件取得"
```

### 3-2. curl.exeを使用する場合

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

# 1ページ目
curl.exe -s "http://localhost:3000/api/reviews/public?bookId=$bookId&limit=10&offset=0" | ConvertFrom-Json | ConvertTo-Json -Depth 5

# 2ページ目
curl.exe -s "http://localhost:3000/api/reviews/public?bookId=$bookId&limit=10&offset=10" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 手順4: エラーケースの確認

### 4-1. bookIdが未指定

```powershell
# bookIdなしでリクエスト
curl.exe -s -w "`nHTTP Status: %{http_code}`n" "http://localhost:3000/api/reviews/public"
```

**期待されるレスポンス**: `400 Bad Request` + `{ "error": "bookIdは必須です" }`

### 4-2. 無効なlimit/offset

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

# limitが範囲外
curl.exe -s -w "`nHTTP Status: %{http_code}`n" "http://localhost:3000/api/reviews/public?bookId=$bookId&limit=200"

# offsetが負の値
curl.exe -s -w "`nHTTP Status: %{http_code}`n" "http://localhost:3000/api/reviews/public?bookId=$bookId&offset=-1"
```

**期待されるレスポンス**: `400 Bad Request` + エラーメッセージ

### 4-3. 存在しないbookId

```powershell
# 存在しないbookIdでリクエスト
curl.exe -s "http://localhost:3000/api/reviews/public?bookId=nonexistent" | ConvertFrom-Json
```

**期待されるレスポンス**: `200 OK` + `{ "reviews": [], "pagination": { "total": 0, ... } }`

---

## 手順5: 非公開レビューが含まれないことを確認

### 5-1. 非公開レビューを作成

```powershell
$cookie = "token=YOUR_TOKEN_VALUE_HERE"
$bookId = "YOUR_BOOK_ID_HERE"

# 非公開レビューを作成（isPublic: false）
$privateReviewBody = @{
    bookId = $bookId
    rating = 3
    comment = "これは非公開レビューです"
    emotionTag = "NORMAL"
    isPublic = $false
    hasSpoiler = $false
} | ConvertTo-Json

$privateReviewRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Cookie" = $cookie } `
    -Body $privateReviewBody

Write-Host "Private review created: $($privateReviewRes.review.id)"
```

### 5-2. 公開レビュー一覧に含まれないことを確認

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

$publicReviewsRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId" `
    -Method GET

# 非公開レビューのIDが含まれていないことを確認
$privateReviewId = "YOUR_PRIVATE_REVIEW_ID_HERE"
$found = $publicReviewsRes.reviews | Where-Object { $_.id -eq $privateReviewId }

if ($found) {
    Write-Host "ERROR: 非公開レビューが含まれています" -ForegroundColor Red
} else {
    Write-Host "OK: 非公開レビューは含まれていません" -ForegroundColor Green
}
```

---

## 手順6: ユーザー名表示の確認

### 6-1. ユーザー名が設定されている場合

ユーザー名（`User.name`）が設定されているレビューでは、その名前が表示されます。

### 6-2. ユーザー名が未設定の場合

ユーザー名が未設定の場合は、emailから生成された表示名または「匿名ユーザー」が表示されます。

```powershell
$bookId = "YOUR_BOOK_ID_HERE"

$publicReviewsRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId" `
    -Method GET

# 各レビューのユーザー名を確認
$publicReviewsRes.reviews | ForEach-Object {
    Write-Host "Review ID: $($_.id)"
    Write-Host "User Name: $($_.user.name)"
    Write-Host "---"
}
```

---

## トラブルシューティング

### 問題: 公開レビューが返ってこない

**確認事項**:
1. `isPublic=true` のレビューが存在するか確認
   ```sql
   -- Prisma Studioで確認、または
   SELECT * FROM reviews WHERE book_id = 'YOUR_BOOK_ID' AND is_public = 1;
   ```
2. `bookId`が正しいか確認
3. データベース接続が正常か確認

### 問題: 認証エラーが発生する

**確認事項**:
- このAPIは認証不要です。`requireAuth`を使っていないことを確認してください。
- Cookieを送信していないことを確認してください。

### 問題: ページングが正しく動作しない

**確認事項**:
1. `limit`と`offset`の値が正しいか確認（整数、範囲内）
2. 総件数（`total`）が正しいか確認
3. `hasMore`の計算が正しいか確認

---

## 参考: 完全なテストスクリプト（PowerShell）

```powershell
# 完全なテストスクリプト
$ErrorActionPreference = "Stop"

# 1. ログイン
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

# Cookieを取得（実際の環境に合わせて調整）
$cookie = "token=YOUR_TOKEN_VALUE_HERE"

# 2. bookIdを取得
$userBooksRes = Invoke-RestMethod -Uri "http://localhost:3000/api/user-books" `
    -Method GET `
    -Headers @{ "Cookie" = $cookie }

if ($userBooksRes.userBooks.Count -eq 0) {
    Write-Host "ERROR: 本棚に本がありません" -ForegroundColor Red
    exit 1
}

$bookId = $userBooksRes.userBooks[0].bookId
Write-Host "bookId=$bookId" -ForegroundColor Green

# 3. 公開レビューを作成
$reviewBody = @{
    bookId = $bookId
    rating = 5
    comment = "テスト用公開レビュー"
    emotionTag = "FUN"
    isPublic = $true
    hasSpoiler = $false
} | ConvertTo-Json

$reviewRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Cookie" = $cookie } `
    -Body $reviewBody

Write-Host "Review created: $($reviewRes.review.id)" -ForegroundColor Green

# 4. 公開レビュー一覧を取得（認証なし）
$publicReviewsRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews/public?bookId=$bookId" `
    -Method GET

Write-Host "`n=== 公開レビュー一覧 ===" -ForegroundColor Cyan
Write-Host "Total: $($publicReviewsRes.pagination.total)" -ForegroundColor Green
Write-Host "Returned: $($publicReviewsRes.reviews.Count)" -ForegroundColor Green
Write-Host "HasMore: $($publicReviewsRes.pagination.hasMore)" -ForegroundColor Green

$publicReviewsRes.reviews | ForEach-Object {
    Write-Host "`n- $($_.user.name) (Rating: $($_.rating))" -ForegroundColor Yellow
    Write-Host "  $($_.comment)"
}

Write-Host "`n=== テスト完了 ===" -ForegroundColor Cyan
```

---

最終更新: 2026-01-xx
