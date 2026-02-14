# トラブルシューティングガイド

## 1. Next.js ルーティング競合エラー

### エラーメッセージ

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
```

### 原因

Next.js App Router では、同じ親階層に異なる動的セグメント名（`[id]` と `[slug]`）が共存すると起動時にエラーになります。

**例**:
```
app/gifts/
  [id]/          ❌ 競合
  [slug]/        ❌ 競合
```

### 解決手順

#### Step 1: 競合箇所の特定

**簡易スクリプト（PowerShell）**:

プロジェクトルートで実行：

```powershell
cd "C:\Users\wadak\OneDrive\Desktop\READ TO EVOLUTION"
$dirs = [System.IO.Directory]::GetDirectories((Join-Path (Get-Location) "app"), "*", "AllDirectories")
$parents = @{}
foreach ($d in $dirs) {
  $name = [System.IO.Path]::GetFileName($d)
  if ($name -eq "[id]" -or $name -eq "[slug]") {
    $parent = [System.IO.Path]::GetDirectoryName($d)
    if (-not $parents.ContainsKey($parent)) { $parents[$parent] = @{} }
    $parents[$parent][$name] = $true
  }
}
$conflicts = @()
foreach ($p in $parents.Keys) {
  if ($parents[$p].ContainsKey("[id]") -and $parents[$p].ContainsKey("[slug]")) {
    $conflicts += $p
  }
}
if ($conflicts.Count -eq 0) {
  Write-Host "✅ No conflicts found - Ready to start!" -ForegroundColor Green
} else {
  Write-Host "❌ Conflicts found:" -ForegroundColor Red
  $conflicts | Sort-Object | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}
```

**使い方**: プロジェクトルートで実行すると、競合箇所が表示されます。何も出なければ競合なしです。

#### Step 2: どちらか片方に統一

**このプロジェクトの方針**: `[slug]` に統一

1. `[id]` フォルダの内容を `[slug]` に移動
2. `params.id` を `params.slug` に変更
3. `[id]` フォルダを完全削除（**LiteralPath を使用**）

```powershell
# 削除例（[]がワイルドカード扱いになるため LiteralPath 必須）
Remove-Item -LiteralPath "app\gifts\[id]" -Recurse -Force
```

#### Step 3: キャッシュ削除

```powershell
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
```

#### Step 4: 起動確認

```powershell
npm run dev
```

### 再発防止ルール

- ✅ **同一階層に `[id]` と `[slug]` を作らない（絶対）**
- ✅ PowerShell で `[slug]` を扱うときは `-LiteralPath` を使う
- ✅ 空フォルダでも Next が拾うことがあるので、残骸を残さない

---

## 2. Port 3000 占有エラー

### エラーメッセージ

```
⚠ Port 3000 is in use, trying 3001 instead.
```

### 原因

dev server などが残っていて Port 3000 を占有している。

### 解決手順

#### Step 1: 占有プロセスの特定

```powershell
netstat -ano | findstr :3000
```

`LISTENING` の行の PID を確認。

#### Step 2: プロセスの停止

```powershell
# 特定のPIDを停止（例: PIDが14152なら）
taskkill /PID 14152 /F

# または、nodeプロセスを全て停止
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

#### Step 3: 確認

```powershell
netstat -ano | findstr :3000
```

`LISTENING` が消えていればOK。

---

## 3. Stripe CLI 接続拒否（Windows IPv6問題）

### エラーメッセージ

```
connectex: No connection could be made because the target machine actively refused it.
```

### 原因

Windows環境で `localhost` が IPv6 の `::1` に解決され、接続拒否になる。

### 解決方法

**`localhost` の代わりに `127.0.0.1` を使用**

```powershell
# ❌ 避ける
C:\stripe-cli\stripe.exe listen --forward-to http://localhost:3000/api/stripe/webhook

# ✅ 推奨
C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
```

### 接続確認

```powershell
Test-NetConnection 127.0.0.1 -Port 3000
```

---

## 4. 完全復旧手順（まとめ）

### 1. Port 3000 解放

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. ルーティング競合解消

```powershell
# 競合箇所を特定（上記のPowerShellスクリプト）
# [id] フォルダを削除
Remove-Item -LiteralPath "app\gifts\[id]" -Recurse -Force
```

### 3. キャッシュ削除

```powershell
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
```

### 4. dev server 起動

```powershell
npm run dev
```

### 5. Stripe CLI 起動（別ターミナル）

```powershell
# dev server の起動ポートに合わせる（3000 または 3001）
C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook

# Port 3001 で起動している場合
# C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3001/api/stripe/webhook
```

**確認**: `Ready! ... signing secret is whsec_...` が表示されればOK。

---

## 5. 正しいフォルダ構造（確定版）

```
app/gifts/
  page.tsx                   # ギフト一覧
  [slug]/
    page.tsx                 # 公開ギフトページ（giftTokenを受け取る）
    analytics/
      page.tsx               # 分析ページ（gift.idを受け取る）
```

### リンク整合

- **公開ギフトページ**: `/gifts/${gift.giftToken}` → `app/gifts/[slug]/page.tsx`
- **分析ページ**: `/gifts/${gift.id}/analytics` → `app/gifts/[slug]/analytics/page.tsx`

※ 動的セグメント名は `[slug]` で統一、実際の値は `giftToken` または `gift.id` を渡す。

---

## 6. 動作確認チェックリスト

### dev server 起動確認

- [ ] `npm run dev` でエラーが出ない
- [ ] `http://localhost:3000` が開ける
- [ ] `netstat -ano | findstr :3000` で `LISTENING` が表示される

### Stripe CLI 疎通確認

- [ ] `stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook` が起動する（Port 3001 の場合は 3001 に変更）
- [ ] `stripe trigger checkout.session.completed` でイベントが届く
- [ ] `webhook_event_logs` テーブルにレコードが追加される

### アプリ動作確認

- [ ] `/gifts` ページが表示される
- [ ] ギフト作成 → 公開URL生成ができる
- [ ] 成果計測ON → Checkout → 戻る → 状態がONになる
- [ ] `/gifts/[slug]/analytics` が表示される（実際のURLは `/gifts/<gift.id>/analytics`）

---

## 7. ルート競合検出スクリプト（定期実行推奨）

開発中に誤って `[id]` と `[slug]` を混在させてしまった場合の早期発見用。

### 実行方法

プロジェクトルートで実行：

```powershell
cd "C:\Users\wadak\OneDrive\Desktop\READ TO EVOLUTION"
$dirs = [System.IO.Directory]::GetDirectories((Join-Path (Get-Location) "app"), "*", "AllDirectories")
$parents = @{}
foreach ($d in $dirs) {
  $name = [System.IO.Path]::GetFileName($d)
  if ($name -eq "[id]" -or $name -eq "[slug]") {
    $parent = [System.IO.Path]::GetDirectoryName($d)
    if (-not $parents.ContainsKey($parent)) { $parents[$parent] = @{} }
    $parents[$parent][$name] = $true
  }
}
$conflicts = @()
foreach ($p in $parents.Keys) {
  if ($parents[$p].ContainsKey("[id]") -and $parents[$p].ContainsKey("[slug]")) {
    $conflicts += $p
  }
}
if ($conflicts.Count -eq 0) {
  Write-Host "✅ No conflicts found - Ready to start!" -ForegroundColor Green
} else {
  Write-Host "❌ Conflicts found:" -ForegroundColor Red
  $conflicts | Sort-Object | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
  exit 1
}
```

### 定期実行の推奨タイミング

- `npm run dev` 実行前
- 新しい動的ルートを追加した後
- ルーティングエラーが発生した時
