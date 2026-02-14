# 書籍登録エラー解決手順（完全版）

## 現在の状態
- ✅ データベースは同期済み（`user_books`テーブルは作成済み）
- ✅ `schema.prisma`は`env("DATABASE_URL")`を使用
- ⚠️ Prisma Clientの再生成が必要

## 解決手順（順番通りに実行）

### ステップ1: 開発サーバーを完全に停止

1. **`npm run dev`を実行しているターミナルを確認**
2. **Ctrl+Cを押して停止**
3. **プロセスが完全に停止したことを確認**

### ステップ2: Prisma Clientを再生成

新しいターミナル（または同じターミナル）で実行：

```bash
npx prisma generate
```

**期待される出力**: 
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client
```

### ステップ3: 開発サーバーを再起動

```bash
npm run dev
```

**期待される出力**:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

### ステップ4: 書籍登録を試す

1. ブラウザで `http://localhost:3000/books` を開く
2. ログインしていることを確認
3. 書籍登録フォームでタイトルを入力して登録
4. **エラーが出た場合**: ブラウザのコンソール（F12）でエラーメッセージを確認

## エラーが出る場合の確認事項

### 1. ブラウザのコンソール（F12 → Console）を確認

エラーメッセージの内容を確認してください。特に：
- `user_books does not exist` → データベースの同期が必要
- `401 Unauthorized` → ログインが必要
- `500 Internal Server Error` → サーバーログを確認

### 2. ネットワークタブ（F12 → Network）を確認

1. `/api/books` のリクエストを確認
2. ステータスコードを確認
3. レスポンスボディを確認

### 3. サーバーのターミナルログを確認

`npm run dev`を実行しているターミナルで、エラーメッセージが表示されていないか確認してください。

## トラブルシューティング

### 問題: Prisma Clientの生成でファイルロックエラー

**原因**: 開発サーバーが実行中

**解決方法**:
1. 開発サーバーを完全に停止（Ctrl+C）
2. 数秒待つ
3. `npx prisma generate`を実行
4. 開発サーバーを再起動

### 問題: データベースが同期されていない

**解決方法**:
```bash
npx prisma db push
```

### 問題: まだエラーが出る

**確認事項**:
1. `.env`ファイルに`DATABASE_URL="file:./prisma/dev.db"`が設定されているか
2. `prisma/dev.db`ファイルが存在するか
3. 開発サーバーが正しく再起動されているか

---

**重要**: 必ず開発サーバーを停止してから`npx prisma generate`を実行してください。
