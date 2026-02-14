# 実装状況まとめ

## ✅ 完了した実装

### 1. v4 Paywall仕様
- ✅ PaywallModal: 開くたびにチェック初期化、Promise対応、二重実行防止
- ✅ `/gifts`: 操作した瞬間だけPaywall表示（v4仕様）
- ✅ `/gifts/[id]/analytics`: ページ表示直後はPaywall非表示、操作時のみ表示

### 2. Stripe Checkout → Webhook導線
- ✅ `lib/stripe.ts`: Checkout Session作成、Webhook署名検証
- ✅ `app/api/affiliate/opt-in/route.ts`: Checkout URL返却
- ✅ `app/api/stripe/webhook/route.ts`: 
  - checkout.session.completed → affiliateState=ON
  - invoice.payment_failed → affiliateState=SUSPENDED
  - customer.subscription.deleted → affiliateState=OFF
  - Idempotency対応（WebhookEventLog）
  - Race condition対策（P2002エラー処理）

### 3. DBスキーマ
- ✅ User: stripeCustomerId, stripeSubscriptionId, stripeAffiliateCheckoutSessionId
- ✅ WebhookEventLog: 二重処理防止
- ✅ AffiliateStateLog: reason/actorType拡張

### 4. 書籍検索機能
- ✅ `lib/book-search.ts`: 楽天・Amazon検索実装
- ✅ `app/api/book-search/route.ts`: 既存書籍も検索結果に含める
- ✅ `components/BookSearchInput.tsx`: debounce付き検索UI、既存/新規書籍対応
- ✅ `app/books/page.tsx`: 検索機能統合済み
- ✅ `app/gifts/page.tsx`: selectタグをBookSearchInputに置き換え
- ✅ `components/koyori/KoyoriAddItemModal.tsx`: 書籍リストをBookSearchInputに置き換え

### 5. ルーティング統一
- ✅ `app/gifts/[id]/`: [id]に統一済み（[slug]フォルダは削除済み）

## 🔧 次のステップ（E2Eテスト）

### ステップ1: 環境変数の設定確認

`.env`ファイルに以下が設定されているか確認：

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Stripe CLI listenで取得
STRIPE_AFFILIATE_PRICE_ID=price_...
APP_URL=http://localhost:3000

# 楽天書籍検索（オプション）
RAKUTEN_APPLICATION_ID=your_rakuten_app_id

# Amazon PA-API（オプション）
AMAZON_PAAPI_ACCESS_KEY=your_access_key
AMAZON_PAAPI_SECRET_KEY=your_secret_key
AMAZON_PAAPI_PARTNER_TAG=your_associate_tag
AMAZON_PAAPI_REGION=us-west-2
```

### ステップ2: Stripe CLIでWebhook疎通確認

**ターミナル1: Stripe CLI listen**
```powershell
C:\stripe-cli\stripe.exe login
C:\stripe-cli\stripe.exe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
```

**重要**: 
- `localhost`ではなく`127.0.0.1`を使用（IPv6回避）
- 表示された`whsec_...`を`.env`の`STRIPE_WEBHOOK_SECRET`に設定
- dev serverを再起動

**ターミナル2: 署名検証テスト**
```powershell
C:\stripe-cli\stripe.exe trigger checkout.session.completed
```

**期待結果**:
- Stripe CLI側でイベントがPOSTされる（エラーなし）
- サーバーログに`Processing webhook event: checkout.session.completed`が表示される
- 200レスポンスが返る

### ステップ3: 本物のCheckoutでE2E確認

1. **ブラウザで `/gifts` を開く**
2. **「成果計測をONにする」をクリック**
3. **PaywallModalで同意チェック2つ → 「有効にする（決済へ）」**
4. **Stripe Checkoutでテストカード決済**
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 未来の日付
   - CVC: 任意の3桁
5. **決済完了後、アプリに戻る**
6. **状態確認**:
   - `/api/affiliate/me`が`affiliateState=ON`を返す
   - `/gifts`ページに「成果ダッシュボードへ」ボタンが表示される
   - 各ギフトカードに「分析」ボタンが表示される

### ステップ4: Prisma StudioでDB確認

```powershell
npx prisma studio
```

確認項目:
- `users`テーブル: `affiliateState=ON`, `affiliatePlanType=AFFILIATE_SUB`
- `affiliate_state_logs`テーブル: `reason=CHECKOUT_COMPLETED`, `actorType=STRIPE`
- `webhook_event_logs`テーブル: `event.id`が1件記録されている

## 📝 実装ファイル一覧

### 新規作成
- `lib/stripe.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/book-search.ts`
- `app/api/book-search/route.ts`
- `components/BookSearchInput.tsx`
- `README_BOOK_SEARCH.md`

### 変更
- `prisma/schema.prisma`
- `app/api/affiliate/opt-in/route.ts`
- `components/PaywallModal.tsx`
- `app/gifts/page.tsx`
- `app/gifts/[id]/analytics/page.tsx`
- `app/settings/affiliate/page.tsx`
- `app/affiliate/dashboard/page.tsx`
- `app/books/page.tsx`
- `components/koyori/KoyoriAddItemModal.tsx`
- `app/api/books/route.ts`

## ⚠️ 注意事項

1. **DBマイグレーション**: `npx prisma db push`を実行済みか確認
2. **環境変数**: `.env`ファイルが存在し、必要な変数が設定されているか確認
3. **Stripe CLI**: Windows環境では`C:\stripe-cli\stripe.exe`を使用
4. **Webhook URL**: `http://127.0.0.1:3000/api/stripe/webhook`を使用（IPv6回避）

## 🎯 完了条件

- [ ] `.env`に`STRIPE_WEBHOOK_SECRET`が設定されている
- [ ] Stripe CLI `listen`でWebhookが届くことを確認
- [ ] `trigger checkout.session.completed`で署名検証が成功する
- [ ] 本物のCheckoutで`affiliateState=ON`になることを確認
- [ ] Prisma StudioでDB状態を確認
