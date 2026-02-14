# Prisma Client生成エラー解決手順

## 現在の状況

- ⚠️ Prisma Clientの生成でファイルロックエラー（EPERM）
- ✅ 開発サーバーはポート3001で起動中
- ⚠️ ポート3000は使用中（別のプロセスが起動している可能性）

## 解決手順

### ステップ1: すべてのNode.jsプロセスを停止

**方法1: ターミナルで停止**
1. `npm run dev`を実行しているターミナルで**Ctrl+C**を押す
2. プロセスが完全に停止するまで数秒待つ

**方法2: タスクマネージャーで停止**
1. タスクマネージャーを開く（Ctrl+Shift+Esc）
2. 「詳細」タブを開く
3. `node.exe`プロセスをすべて終了

**方法3: PowerShellで停止**
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### ステップ2: Prisma Clientを再生成

すべてのNode.jsプロセスを停止した後：

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

### ステップ4: ポート3000を使用しているプロセスを確認（オプション）

ポート3000を使用しているプロセスを確認：

```powershell
netstat -ano | findstr :3000
```

必要に応じて、そのプロセスを終了してください。

### ステップ5: 書籍登録を試す

**重要**: 開発サーバーがポート3001で起動している場合、以下のURLを使用してください：

- `http://localhost:3001/books` （ポート3001）

または、ポート3000のプロセスを終了して、通常のポート3000で起動してください。

## トラブルシューティング

### 問題: まだファイルロックエラーが出る

**解決方法**:
1. すべてのターミナルを閉じる
2. タスクマネージャーで`node.exe`プロセスをすべて終了
3. 新しいターミナルを開く
4. `npx prisma generate`を実行

### 問題: ポート3000が使用中

**確認方法**:
```powershell
netstat -ano | findstr :3000
```

**解決方法**:
- ポート3000を使用しているプロセスを終了
- または、ポート3001でアクセス（`http://localhost:3001`）

---

最終更新: 2026-01-xx
