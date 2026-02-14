# セットアップガイド

## 初回セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を記述：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**重要**: 本番環境では `JWT_SECRET` を強力なランダム文字列に変更してください。

### 3. データベースの初期化

```bash
# Prismaクライアントの生成
npx prisma generate

# データベーススキーマの適用
npx prisma db push
```

これで `prisma/dev.db` にSQLiteデータベースが作成されます。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## データベース管理

### Prisma Studio（GUI管理ツール）

```bash
npm run db:studio
```

ブラウザで [http://localhost:5555](http://localhost:5555) が開き、データベースの内容を視覚的に確認・編集できます。

### スキーマ変更後の反映

```bash
# スキーマを変更した場合
npx prisma db push

# Prismaクライアントを再生成
npx prisma generate
```

## 動作確認

### 1. ユーザー登録

1. [http://localhost:3000/register](http://localhost:3000/register) にアクセス
2. メールアドレスとパスワード（6文字以上）を入力して登録

### 2. 書籍登録

1. ログイン後、トップページから「教材管理」をクリック
2. 「+ 書籍を登録」をクリック
3. 書籍名を入力して登録

### 3. 学習記録の登録

1. 書籍一覧から「教材を登録」をクリック
2. 以下の情報を入力：
   - 問題画像URL（必須）
   - 答え画像URL（任意）
   - 解説画像URL（任意）
   - メモ（任意）
   - 位置情報（必須）：例「p.45」「第3章」など

### 4. 復習の実行

1. 「今日の復習」画面で登録した学習記録を確認
2. 「復習を開始」をクリック
3. 問題を確認 → 想起確認（3色ボタン） → 答え/解説表示 → 最終判定
4. 結果を保存

## トラブルシューティング

### データベースエラー

```bash
# データベースをリセット（注意：全データが削除されます）
rm prisma/dev.db
npx prisma db push
```

### 認証エラー

- `.env` ファイルの `JWT_SECRET` が設定されているか確認
- ブラウザのクッキーをクリアして再ログイン

### 画像が表示されない

- 画像URLが正しく設定されているか確認
- CORSエラーの場合は、画像ホスティングサービスの設定を確認

## 本番環境へのデプロイ

### 推奨環境

- **データベース**: PostgreSQL（SQLiteは本番非推奨）
- **ホスティング**: Vercel, Railway, Render など

### 環境変数の設定

本番環境では以下を設定：

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="強力なランダム文字列（32文字以上推奨）"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### ビルド

```bash
npm run build
npm start
```

## 次のステップ

MVPの基本機能は実装済みです。以下の機能を追加できます：

1. ファイルアップロード機能（現在はURL入力）
2. 読書レビュー機能
3. 棒人間UI
4. 通知機能
5. プラン管理・決済機能
