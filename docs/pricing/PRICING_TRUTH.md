# 料金・プラン情報 - 実装上の真実（Single Source of Truth）

**作成日**: 2026-02-08  
**目的**: コードベースから抽出した「実装上の料金・プラン情報の事実」を記録  
**方針**: 推測禁止。コード・DB・設定ファイルに存在する事実のみを記載

---

## 1. データベースモデル（プラン・購読状態）

### 1.1 Userモデル（`prisma/schema.prisma:15-66`）

#### プラン関連フィールド

- **`plan`** (`prisma/schema.prisma:20`)
  - 型: `String`
  - デフォルト値: `"FREE"`
  - マッピング: `@map("plan_type")`
  - コメント: `// FREE, AFFILIATE, STUDY`
  - インデックス: `@@index([plan])` (`prisma/schema.prisma:62`)

- **`affiliateState`** (`prisma/schema.prisma:21`)
  - 型: `String`
  - デフォルト値: `"OFF"`
  - マッピング: `@map("affiliate_state")`
  - コメント: `// OFF, ON, SUSPENDED`
  - インデックス: `@@index([affiliateState])` (`prisma/schema.prisma:63`)

- **`affiliatePlanType`** (`prisma/schema.prisma:22`)
  - 型: `String`
  - デフォルト値: `"NONE"`
  - マッピング: `@map("affiliate_plan_type")`
  - コメント: `// NONE, AFFILIATE_SUB, STUDY_SUB`
  - インデックス: `@@index([affiliatePlanType])` (`prisma/schema.prisma:64`)

#### Stripe関連フィールド

- **`stripeCustomerId`** (`prisma/schema.prisma:28`)
  - 型: `String?`（オプショナル）
  - マッピング: `@map("stripe_customer_id")`

- **`stripeSubscriptionId`** (`prisma/schema.prisma:29`)
  - 型: `String?`（オプショナル）
  - マッピング: `@map("stripe_subscription_id")`

- **`stripeAffiliateCheckoutSessionId`** (`prisma/schema.prisma:30`)
  - 型: `String?`（オプショナル）
  - マッピング: `@map("stripe_affiliate_checkout_session_id")`

#### アフィリエイト状態管理フィールド

- **`affiliateEnabledAt`** (`prisma/schema.prisma:23`)
  - 型: `DateTime?`（オプショナル）
  - マッピング: `@map("affiliate_enabled_at")`

- **`affiliateSuspendedAt`** (`prisma/schema.prisma:24`)
  - 型: `DateTime?`（オプショナル）
  - マッピング: `@map("affiliate_suspended_at")`

- **`affiliateSuspendedReason`** (`prisma/schema.prisma:25`)
  - 型: `String?`（オプショナル）
  - マッピング: `@map("affiliate_suspended_reason")`

### 1.2 Subscriptionモデル（`prisma/schema.prisma:522-534`）

**注意**: Legacy relations（後で削除予定）として記載されている (`prisma/schema.prisma:53`)

- **`id`**: `String @id @default(cuid())`
- **`userId`**: `String @map("user_id")`
- **`planType`**: `String @map("plan_type")`
- **`maxMaterials`**: `Int @map("max_materials")`
- **`status`**: `String @default("active")`
- **`startedAt`**: `DateTime @map("started_at")`
- **`endsAt`**: `DateTime? @map("ends_at")`

---

## 2. 勉強コースプラン設定（実装）

### 2.1 プラン設定ファイル（`lib/plan-config.ts:5-11`）

```typescript
export const PLAN_CONFIG = {
  free: { maxMaterials: 0, name: '無料プラン' },
  plan_3: { maxMaterials: 3, name: '3冊プラン', price: 450 },
  plan_5: { maxMaterials: 5, name: '5冊プラン', price: 700 },
  plan_10: { maxMaterials: 10, name: '10冊プラン', price: 1400 },
  plan_20: { maxMaterials: 20, name: '20冊プラン', price: 2600 },
} as const
```

**実装済みプラン一覧**:

| プランID | 冊数上限 | 月額料金 | プラン名 |
|---------|---------|---------|---------|
| `free` | 0冊 | 0円 | 無料プラン |
| `plan_3` | 3冊 | 450円 | 3冊プラン |
| `plan_5` | 5冊 | 700円 | 5冊プラン |
| `plan_10` | 10冊 | 1,400円 | 10冊プラン |
| `plan_20` | 20冊 | 2,600円 | 20冊プラン |

**根拠**: `lib/plan-config.ts:5-11`

### 2.2 プラン制御関数（`lib/plan-config.ts:15-23`）

- **`getMaxMaterials(planType: string): number`**
  - プランタイプから冊数上限を取得
  - 根拠: `lib/plan-config.ts:15-17`

- **`canAddMaterial(planType: string, currentMaterialCount: number): boolean`**
  - プランタイプと現在の冊数から追加可能か判定
  - 無料プラン（`maxMaterials === 0`）は常に`false`
  - 根拠: `lib/plan-config.ts:19-23`

### 2.3 プラン制御の使用箇所

- **書籍登録時の冊数上限チェック** (`app/api/books/route.ts`)
  - 根拠: `app/api/books/route.ts`で`canAddMaterial`を使用（具体的な行番号は要確認）

---

## 3. アフィリエイトプラン（実装）

### 3.1 アフィリエイト料金

- **月額料金**: 300円
- **根拠**: `docs/SPEC_FINAL_CONSISTENT.md:72`, `docs/SPEC_FINAL_CONSISTENT.md:293`

### 3.2 アフィリエイト状態管理

#### 状態定義（`prisma/schema.prisma:21`）

- **`OFF`**: 報酬を扱わない
- **`ON`**: 報酬を扱う
- **`SUSPENDED`**: 支払い失敗等で一時停止

#### プランタイプ定義（`prisma/schema.prisma:22`）

- **`NONE`**: アフィリエイトプラン未加入
- **`AFFILIATE_SUB`**: アフィリエイトプラン加入（300円/月）
- **`STUDY_SUB`**: 勉強コース加入（アフィリエイト自動ON、追加料金なし）

### 3.3 アフィリエイト制御ロジック（`lib/affiliate.ts`）

- **`isStudySubscriber(user: User): boolean`** (`lib/affiliate.ts:18-20`)
  - `user.affiliatePlanType === 'STUDY_SUB'`で判定

- **`isAffiliateSubscriber(user: User): boolean`** (`lib/affiliate.ts:25-27`)
  - `user.affiliatePlanType === 'AFFILIATE_SUB'`で判定

- **`requiresAffiliatePaywall(user: User): boolean`** (`lib/affiliate.ts:33-35`)
  - `user.affiliateState !== 'ON' && user.affiliatePlanType !== 'STUDY_SUB'`で判定
  - STUDY_SUBは自動でアフィリエイトON扱い（課金モーダルを出さない）

### 3.4 アフィリエイト有効化フロー（`app/api/affiliate/opt-in/route.ts`）

1. **STUDY_SUBの場合** (`app/api/affiliate/opt-in/route.ts:49-72`)
   - 課金不要で即ON
   - `affiliateState = 'ON'`
   - `affiliatePlanType = 'STUDY_SUB'`（既に設定済み）
   - 理由: `'STUDY_SUBSCRIBED'`

2. **AFFILIATE_SUBまたはNONEの場合** (`app/api/affiliate/opt-in/route.ts:74-112`)
   - Stripe Checkoutへ誘導
   - `STRIPE_AFFILIATE_PRICE_ID`を使用

---

## 4. Stripe設定（実装）

### 4.1 環境変数

- **`STRIPE_SECRET_KEY`** (`lib/stripe.ts:3`)
  - 必須
  - 根拠: `lib/stripe.ts:3-4`

- **`STRIPE_AFFILIATE_PRICE_ID`** (`lib/stripe.ts:20`)
  - アフィリエイトプラン用Price ID
  - 必須
  - 根拠: `lib/stripe.ts:20-23`

- **`STRIPE_WEBHOOK_SECRET`** (`lib/stripe.ts:69`)
  - Webhook署名検証用
  - 必須
  - 根拠: `lib/stripe.ts:69-72`

- **`APP_URL`** (`lib/stripe.ts:25`)
  - オプション（デフォルト: `'http://localhost:3000'`）
  - 根拠: `lib/stripe.ts:25`

### 4.2 Stripe Webhook処理（`app/api/stripe/webhook/route.ts`）

#### 処理対象イベント

1. **`checkout.session.completed`** (`app/api/stripe/webhook/route.ts:52-114`)
   - アフィリエイト用Checkout完了時
   - `purpose === 'AFFILIATE_SUB'`または`type === 'AFFILIATE_SUBSCRIPTION'`を確認
   - 更新内容:
     - `affiliateState = 'ON'`
     - `affiliatePlanType = 'AFFILIATE_SUB'`
     - `affiliateEnabledAt = new Date()`
     - `stripeCustomerId`, `stripeSubscriptionId`を保存
   - 理由: `'CHECKOUT_COMPLETED'`

2. **`invoice.payment_failed`** (`app/api/stripe/webhook/route.ts:117-160`)
   - 支払い失敗時
   - 更新内容:
     - `affiliateState = 'SUSPENDED'`
     - `affiliateSuspendedAt = new Date()`
     - `affiliateSuspendedReason = 'PAYMENT_FAILED'`
   - 理由: `'PAYMENT_FAILED'`

3. **`customer.subscription.deleted`** (`app/api/stripe/webhook/route.ts:163-198`)
   - サブスクリプション削除時
   - 更新内容:
     - `affiliateState = 'OFF'`
     - `affiliatePlanType = 'NONE'`
     - `affiliateEnabledAt = null`
     - `stripeSubscriptionId = null`
   - 理由: `'SUB_DELETED'`

### 4.3 Stripe Checkout Session作成（`lib/stripe.ts:15-60`）

- **関数**: `createAffiliateCheckoutSession`
- **モード**: `'subscription'`（サブスクリプション）
- **支払い方法**: `['card']`（カードのみ）
- **メタデータ**:
  - `userId`: ユーザーID
  - `purpose: 'AFFILIATE_SUB'`（固定）
  - `type: 'AFFILIATE_SUBSCRIPTION'`（後方互換性のため残す）

---

## 5. 勉強コースプランのStripe設定

### 5.1 実装状況

**⚠️ 未実装**: 勉強コースプラン用のStripe Price ID設定は存在しない

- `lib/stripe.ts`には`STRIPE_AFFILIATE_PRICE_ID`のみ存在
- 勉強コースプラン（`plan_3`, `plan_5`, `plan_10`, `plan_20`）用のPrice ID設定は未実装
- Stripe Checkout Session作成関数もアフィリエイト用のみ

### 5.2 環境変数の想定

勉強コースプラン用の環境変数は存在しないが、将来的に必要になる可能性がある：
- `STRIPE_PLAN_3_PRICE_ID`
- `STRIPE_PLAN_5_PRICE_ID`
- `STRIPE_PLAN_10_PRICE_ID`
- `STRIPE_PLAN_20_PRICE_ID`

**現状**: これらの環境変数はコードベースに存在しない

---

## 6. プランとアフィリエイトの関係（実装）

### 6.1 プラン別アフィリエイト状態

| `plan` | `affiliatePlanType` | `affiliateState` | 料金 |
|--------|---------------------|------------------|------|
| `FREE` | `NONE` | `OFF` | 0円 |
| `AFFILIATE` | `AFFILIATE_SUB` | `ON` | 300円/月 |
| `STUDY` | `STUDY_SUB` | `ON`（自動） | 冊数制（追加料金なし） |

**根拠**:
- `prisma/schema.prisma:20-22`（フィールド定義）
- `lib/affiliate.ts:18-20`（STUDY_SUB判定）
- `lib/affiliate.ts:33-35`（Paywall判定）
- `app/api/affiliate/opt-in/route.ts:49-72`（STUDY_SUB自動ON）

### 6.2 勉強コース加入者のアフィリエイト自動ON

- **実装**: `app/api/affiliate/opt-in/route.ts:49-72`
- **条件**: `affiliatePlanType === 'STUDY_SUB'`
- **動作**: 課金不要で即座に`affiliateState = 'ON'`
- **理由**: `'STUDY_SUBSCRIBED'`

---

## 7. プラン制御の使用箇所

### 7.1 冊数上限チェック

- **書籍登録時**: `app/api/books/route.ts`で`canAddMaterial`を使用（具体的な行番号は要確認）

### 7.2 データ量制御

- **OCRアセット登録時**: `app/api/ocr-assets/route.ts:109`で`plan !== 'FREE'`をチェック
  - 根拠: `app/api/ocr-assets/route.ts:109`（`const isStudyCourse = user?.plan && user.plan !== 'FREE'`）

---

## 8. 未実装・不明な点

### 8.1 勉強コースプランの購入フロー

- **Stripe Checkout Session作成**: 未実装
- **Webhook処理**: アフィリエイト用のみ実装済み
- **プラン変更処理**: 未実装

### 8.2 プランとUser.planの対応

- **`User.plan`の値**: `'FREE'`, `'AFFILIATE'`, `'STUDY'`（`prisma/schema.prisma:20`）
- **`PLAN_CONFIG`のキー**: `'free'`, `'plan_3'`, `'plan_5'`, `'plan_10'`, `'plan_20'`（`lib/plan-config.ts:5-11`）
- **対応関係**: 不明（`User.plan === 'STUDY'`の場合、どの`plan_*`が適用されるか不明）

### 8.3 Subscriptionモデルの使用状況

- **定義**: `prisma/schema.prisma:522-534`
- **状態**: Legacy relations（後で削除予定）として記載
- **使用箇所**: 不明（コードベースで検索が必要）

---

**最終更新**: 2026-02-08
