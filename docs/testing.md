# テスター実行用 仕様書 & 手順書（Paywall v4 / Affiliate成果計測）

## 0. この文書の目的

本書は
**READ TO EVOLUTION（本の感想プラットフォーム）** における
**アフィリエイト成果計測（Paywall v4仕様）** を中心とした
テスター実行手順と報告方法を定義するもの。

- テスターが「壊れているのか／仕様なのか」で迷わない
- 開発側が「再現できる報告」を受け取れる
- Stripe / Webhook を含む動作を安全に確認できる

---

## 1. テスターに渡す方法（推奨）

### 1-1. 対象テスターの区分

### A. 社内テスター（推奨・最初）

- 実行環境：**ローカル or Preview環境**
- Stripe：**Test Mode**
- 本書の「手順どおり」実行する前提

### B. 外部テスター（後段）

- 実行環境：**Preview環境のみ（localhost不可）**
- Stripe：Test Mode
- 自由探索は禁止（※手順書どおり）

---

## 2. テスターに渡すもの（必須）

テスターには **必ず以下4点** を渡す。

1. **URL**
   - 例：`https://xxx-preview.vercel.app`
2. **テスト用アカウント**
   - メールアドレス
   - パスワード
3. **この手順書（本ドキュメント）**
4. **報告テンプレート（後述）**

---

## 3. テスト対象機能（今回の範囲）

### 今回テスト対象

- アフィリエイト成果計測 ON/OFF
- Paywall v4仕様
- Stripe Checkout → Webhook → 状態反映
- gifts / analytics のUI分岐

### 対象外（今回は見なくてよい）

- RevenueShare（購入成果の分配）
- 管理画面
- OCR / 勉強コース詳細

---

## 4. 重要な前提（必ず読んでもらう）

⚠️ **重要**

- 決済完了後、**状態反映は即時でない場合があります**
- 決済後は
  👉 **5秒待つ or 画面を再読み込み** してください
- これは **仕様であり不具合ではありません**

---

## 5. テストケース一覧（必須）

### TC-1：成果計測 OFF → ON（基本導線）

**手順**

1. ログイン
2. `/gifts` を開く
3. 「成果計測をONにする」ボタンを押す
4. Paywallモーダルが表示されることを確認
5. 同意チェックを2つ入れる
6. 「有効にする（決済へ）」を押す
7. Stripe Checkout に遷移することを確認
8. テストカードで決済完了
9. 元のアプリに戻る
10. 5秒待つ or 再読み込み

**期待結果**

- `/gifts` に
  - 「成果ダッシュボードへ」ボタンが表示される
  - 各カードの「分析」ボタンが有効になる

---

### TC-2：v4仕様確認（操作した瞬間だけPaywall）

**手順**

1. 成果計測が OFF の状態で `/gifts` を開く
2. ページ表示直後に Paywall が **出ない** ことを確認
3. 「分析（要ON）」ボタンを押す

**期待結果**

- 押した瞬間にのみ Paywall が表示される
- 自動表示はされない

---

### TC-3：成果計測 ON 後の analytics 表示

**手順**

1. 成果計測 ON 状態で `/gifts/[slug]/analytics` を開く

**期待結果**

- Paywallは表示されない
- 分析内容が表示される

---

### TC-4：支払い失敗（SUSPENDED）

※可能なら実施

**手順**

1. Stripeテストで支払い失敗を発生させる
2. 再度 analytics or settings を開く

**期待結果**

- 「お支払いが確認できませんでした」表示
- 「再度ONにする」ボタンが表示される

---

## 6. NG操作（やらないでください）

- 複数タブで同時操作
- 戻るボタン連打
- 決済途中でブラウザを閉じる
- URLを直接書き換える
- DevToolsで状態をいじる

---

## 7. 不具合か判断に迷ったら（重要）

以下の場合は **不具合ではない可能性が高い**：

- 決済直後にONにならない
  → 5秒待つ or 再読み込み
- 決済完了後、最初の画面でOFFのまま
  → Webhook反映待ち

---

## 8. 報告フォーマット（必須）

テスターは **必ずこの形式で報告**。

```
【発生日時】
YYYY/MM/DD HH:MM

【テストケース番号】
TC-1 / TC-2 / TC-3 / TC-4

【操作手順】
（例）
/gifts → 成果計測ON → Paywall → 決済完了 → 戻る

【実際の挙動】
（見えた表示・ボタン・文言）

【期待挙動】
（手順書に書いてある期待）

【再現性】
毎回 / 時々 / 一度のみ

【スクリーンショット】
あり / なし
```

---

## 8-2. UX検証項目（初見ユーザー向け）

テスターは各項目について **Yes/No + コメント** を記入してください。

### 理解度チェック

1. **「何をすればいいか」が分かったか**
   - [ ] Yes / [ ] No
   - コメント：________________

2. **「成果計測」の意味が分かったか**
   - [ ] Yes / [ ] No
   - コメント：________________

3. **OFF/ON/SUSPENDED の違いが分かったか**
   - [ ] Yes / [ ] No
   - コメント：________________

4. **分析画面の各数値の意味が分かったか**
   - [ ] Yes / [ ] No
   - コメント：________________

5. **「不具合報告」導線を見つけられるか**
   - [ ] Yes / [ ] No
   - コメント：________________

### 導線チェック

6. **「成果計測をONにする」ボタンを見つけられたか**
   - [ ] Yes / [ ] No
   - コメント：________________

7. **「分析を見る」ボタンを見つけられたか**
   - [ ] Yes / [ ] No
   - コメント：________________

8. **初回ガイド（「はじめにやること」）が役に立ったか**
   - [ ] Yes / [ ] No
   - コメント：________________

### 改善提案（任意）

9. **分かりにくかった点・改善してほしい点**
   - コメント：________________

---

## 9. 開発者向け補足（Cursor用）

- テスター報告が来たら
  👉 `affiliateState / affiliatePlanType / requiresPaywall` を確認
- WebhookEventLog / AffiliateStateLog を最初に見る
- 「壊れてる」報告の8割は
  **状態反映待ち or 手順逸脱**

---

## 10. 現在のテスター実行可否（明示）

- ✅ 社内テスター：**実行OK**
- ⚠️ 外部テスター：**Preview環境必須／自由探索不可**

---

### 次にできること

- この仕様書を **Cursor にそのまま貼って** `docs/testing.md` として管理
- テスター用「1枚PDF版」に簡略化
- 外部テスター解禁用に **UI文言をもう一段優しくする**

---

## 付録A：書籍検索機能の実体（開発者向け）

### A-1. 外部API実装状況

書籍検索機能は以下の外部APIを使用しています。

#### 楽天 Books API

- **エンドポイント**: `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404`
- **実装場所**: `lib/book-search.ts` (`searchRakutenBooks`)
- **必要な環境変数**: `RAKUTEN_APPLICATION_ID`
- **ネットワークアクセス**: `/api/book-search` 実行時に外部ネットワークアクセスが発生

#### Amazon Product Advertising API (PA-API 5.0)

- **エンドポイント**: `https://webservices.amazon.co.jp/paapi5/searchitems`
- **実装場所**: `lib/book-search.ts` (`searchAmazonBooks`)
- **署名方式**: AWS Signature V4
- **必要な環境変数**:
  - `AMAZON_PAAPI_ACCESS_KEY`
  - `AMAZON_PAAPI_SECRET_KEY`
  - `AMAZON_PAAPI_PARTNER_TAG`
  - `AMAZON_PAAPI_REGION`（任意、デフォルト: `us-west-2`）
- **ネットワークアクセス**: `/api/book-search` 実行時に外部ネットワークアクセスが発生

### A-2. 外部テスター公開上の注意

- **Amazon PA-API** は運用条件・審査・要件が絡むため、外部テスター環境で未設定になりやすい
- 外部検索が無効な場合、UI側で **「外部検索無効（準備中）」** を明示表示し、誤解を防止
- `mode="select"` の場合は **登録済み書籍のみ** を候補に表示（外部検索結果は出さない）

### A-3. 検索APIの挙動

- `GET /api/book-search?q=xxx&providers=`（空）→ 外部検索をスキップ、既存書籍のみ返す
- `GET /api/book-search?q=xxx`（providers未指定）→ デフォルトで `RAKUTEN` を試行（ENVがある場合）
- `GET /api/book-search?q=xxx&providers=RAKUTEN,AMAZON` → 有効なプロバイダーのみ実行（無効は無視）

### A-4. 設定確認API

- `GET /api/book-search/config` → 有効なプロバイダー一覧を返す（秘密情報は返さない）
- 返却例: `{ "enabledProviders": ["RAKUTEN"], "externalSearchEnabled": true }`

---

## 付録B：ローカル検証（Windows）Stripe CLI 注意点

Windows環境では `localhost` が IPv6 の `::1` に解決され、`connectex: actively refused` になることがあります。
その場合は **`127.0.0.1` を使って forward** してください（推奨）。

### Stripe CLI listen（推奨）

```powershell
# Port 3000 で起動している場合
C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook

# Port 3001 で起動している場合（3000が占有されている場合）
C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3001/api/stripe/webhook
```

**注意**: dev server の起動ポートに合わせて `3000` または `3001` を指定してください。

### 接続確認（任意）

```powershell
Test-NetConnection 127.0.0.1 -Port 3000
```

### ルート表記の統一（重要）

- ドキュメント上では `/gifts/[slug]/analytics` と表記
- 実際のURLは `gift.id` を `slug` として渡すため、`/gifts/<gift.id>/analytics` となる
- **Next.jsの動的ルート競合を避けるため、`[id]` と `[slug]` のフォルダを同時に作らない**

### トラブルシューティング

ルーティング競合やPort占有エラーが発生した場合は、`docs/troubleshooting.md` を参照してください。
