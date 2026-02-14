# 書籍登録エラー修正レポート

## 問題
`/api/books` POSTで以下のエラーが発生：
```
Invalid prisma.userBook.findUnique()
The table `main.user_books` does not exist in the current database.
```

## 原因
**DATABASE_URLの不一致**:
- `.env`ファイル: `DATABASE_URL="file:./prisma/dev.db"`
- `prisma/schema.prisma`: `url = "file:./dev.db"`（直接指定）

これにより、Prisma CLIとNext.jsアプリが異なるDBファイルを参照していた可能性がある。

## 修正内容

### 1. prisma/schema.prisma の修正
**変更前**:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**変更後**:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

これにより、`.env`ファイルの`DATABASE_URL`を参照するようになった。

### 2. データベースの同期
```bash
npx prisma db push --skip-generate
```
実行結果: `Your database is now in sync with your Prisma schema. Done in 1.40s`

## 実行したコマンド

1. **環境変数の確認**
   ```powershell
   Get-Content ".env"
   ```
   結果: `DATABASE_URL="file:./prisma/dev.db"` を確認

2. **スキーマの修正**
   - `prisma/schema.prisma`の`datasource db`を`env("DATABASE_URL")`に変更

3. **データベースの同期**
   ```bash
   npx prisma db push --skip-generate
   ```
   結果: 成功（`user_books`テーブルが作成された）

4. **Prisma Clientの生成**
   ```bash
   npx prisma generate
   ```
   注意: 開発サーバー実行中はファイルロックエラーが発生する可能性がある

## 次のステップ（必須）

### 開発サーバーの再起動
1. **開発サーバーを停止**（`npm run dev`を実行しているターミナルでCtrl+C）
2. **Prisma Clientを生成**
   ```bash
   npx prisma generate
   ```
3. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

## 動作確認手順

### 1. Prisma Studioで確認
```bash
npx prisma studio
```
ブラウザで `http://localhost:5555` を開き、`UserBook`テーブルが表示されることを確認。

### 2. API動作確認（PowerShell）

#### ① ログインしてトークンを取得
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

# Cookieからトークンを取得（ブラウザのDevToolsで確認）
$cookie = "token=YOUR_TOKEN_VALUE_HERE"
```

#### ② 書籍登録（POST /api/books）
```powershell
$bookBody = @{
    title = "テスト書籍"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "http://localhost:3000/api/books" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Cookie" = $cookie } `
    -Body $bookBody

Write-Host "Status: 201 Created" -ForegroundColor Green
Write-Host "Book ID: $($res.book.id)" -ForegroundColor Green
Write-Host "UserBook ID: $($res.userBook.id)" -ForegroundColor Green
```

**期待される結果**: HTTPステータス201、`book`と`userBook`が返る

#### ③ 本棚一覧取得（GET /api/user-books）
```powershell
$userBooks = Invoke-RestMethod -Uri "http://localhost:3000/api/user-books" `
    -Method GET `
    -Headers @{ "Cookie" = $cookie }

Write-Host "登録済み書籍数: $($userBooks.userBooks.Count)" -ForegroundColor Green
$userBooks.userBooks | ForEach-Object {
    Write-Host "- $($_.book.title) (Status: $($_.status))" -ForegroundColor Yellow
}
```

**期待される結果**: 登録した書籍が`userBooks`配列に含まれる

### 3. 画面での確認
1. ブラウザで `http://localhost:3000/books` を開く
2. 書籍登録フォームでタイトルを入力して登録
3. 本棚一覧に登録した書籍が表示されることを確認

## 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `prisma/schema.prisma` | `datasource db.url`を`env("DATABASE_URL")`に変更 |

## 確認結果

- ✅ `prisma db push`が成功し、`user_books`テーブルが作成された
- ✅ `.env`の`DATABASE_URL`と`schema.prisma`が統一された
- ⚠️ Prisma Clientの生成は開発サーバー停止後に実行が必要

## 注意事項

- 開発サーバー実行中は`npx prisma generate`でファイルロックエラーが発生する可能性がある
- 必ず開発サーバーを停止してから`npx prisma generate`を実行すること
- 再起動後、書籍登録が正常に動作することを確認すること

---

最終更新: 2026-01-xx
