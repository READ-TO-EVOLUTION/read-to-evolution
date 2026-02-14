# 初回セットアップガイド（Windows PowerShell）

このガイドでは、READ TO EVOLUTIONプロジェクトを初めて起動する手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- npmがインストールされていること
- PowerShellが使用可能であること

## セットアップ手順

### 1. 依存関係のインストール

```powershell
npm install
```

### 2. 環境変数ファイルの作成

プロジェクトルートに `.env` ファイルを作成します。

**PowerShellで作成する場合:**
```powershell
@"
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath .env -Encoding utf8
```

**手動で作成する場合:**
1. プロジェクトルート（`package.json`がある場所）に `.env` という名前のファイルを新規作成
2. 以下の内容をコピー＆ペースト：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. データベースの初期化

```powershell
# Prismaクライアントを生成
npm run db:generate

# データベーススキーマを適用（dev.dbファイルが作成されます）
npm run db:push
```

**確認**: `prisma/dev.db` ファイルが作成されていることを確認してください。

### 4. 開発サーバーの起動

```powershell
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## よくあるエラーと解決方法

### `.env` ファイルが見つからない

**エラーメッセージ**: `Environment variable not found: DATABASE_URL`

**解決方法**:
1. プロジェクトルートに `.env` ファイルが存在するか確認
2. `.env` ファイルの内容が正しいか確認（上記の手順2を参照）

### Prisma Clientが生成されていない

**エラーメッセージ**: `Prisma Client has not been generated yet`

**解決方法**:
```powershell
npm run db:generate
```

### データベースファイルが存在しない

**エラーメッセージ**: `SQLite database file does not exist`

**解決方法**:
```powershell
npm run db:push
```

### ポート3000が既に使用されている

**エラーメッセージ**: `Port 3000 is already in use`

**解決方法**:
1. 既存の開発サーバーを停止（Ctrl+C）
2. または、別のポートを使用: `$env:PORT=3001; npm run dev`

### ファイルロックエラー（Windows）

**エラーメッセージ**: `EPERM: operation not permitted`

**解決方法**:
1. 開発サーバーを停止（Ctrl+C）
2. `npm run db:generate` を再実行

---

## 次のステップ

セットアップが完了したら、以下を参照してください：

- [動作確認ガイド](./VERIFICATION.md) - 機能の動作確認手順
- [通知機能の確認](./NOTIFICATION_SETUP.md) - 通知機能の動作確認

---

## 補足情報

### 環境変数の説明

- **DATABASE_URL**: SQLiteデータベースのパス（開発環境では `file:./dev.db`）
- **JWT_SECRET**: JWT認証用のシークレットキー（本番環境では必ず変更してください）
- **NEXT_PUBLIC_APP_URL**: アプリケーションのベースURL（フロントエンド用）

### データベースの確認

Prisma Studioを使用してデータベースの内容を確認できます：

```powershell
npm run db:studio
```

ブラウザで [http://localhost:5555](http://localhost:5555) が開きます。
