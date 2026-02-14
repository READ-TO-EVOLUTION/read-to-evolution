# セキュリティ監査レポート

**監査日**: 2024年（最新）  
**対象アプリケーション**: READ TO EVOLUTION  
**フレームワーク**: Next.js 14 (App Router)  
**修正完了日**: 2024年（監査と同時に修正実施）

---

## ① セキュリティ総合評価

**強度レベル**: **中**

**一言理由**: 認証・認可の基本実装は適切だが、JWT_SECRETのデフォルト値、セキュリティヘッダー未設定、一部のコードバグが重大リスクとして存在する。

---

## ② リスク一覧

| リスク内容 | 危険度 | 影響 | 該当ファイル名とパス | 修正が必要か |
|---------|--------|------|-------------------|------------|
| JWT_SECRETのデフォルト値が'dev-secret-key' | **高** | トークン偽造・なりすまし | `lib/auth.ts:4` | ✅ **修正完了** |
| セキュリティヘッダー未設定（CSP/HSTS/X-Frame-Options等） | **高** | XSS攻撃・クリックジャッキング | `next.config.js` | ✅ **修正完了** |
| gift-events APIで未定義変数`giftIds`を使用 | **高** | サーバーエラー・サービス停止 | `app/api/gift-events/route.ts:66` | ✅ **修正完了** |
| CookieのSecure属性が本番環境のみ | **中** | HTTPS未使用時のCookie漏洩 | `app/api/auth/login/route.ts:45` | 推奨 |
| パスワード最小長が6文字のみ | **中** | ブルートフォース攻撃の容易化 | `app/api/auth/register/route.ts:8` | 推奨 |
| エラーメッセージでユーザー存在を推測可能 | **低** | ユーザー列挙攻撃 | `app/api/auth/login/route.ts:22-26` | 任意 |
| npm auditで1件の脆弱性検出 | **中** | 依存関係の脆弱性 | `package.json` | 推奨 |

---

## ③ 重大リスクの詳細解説

### 1. JWT_SECRETのデフォルト値（最優先）

**なぜ危険か**:
- `lib/auth.ts:4` で `JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'` としている
- 本番環境で環境変数が未設定の場合、固定の秘密鍵が使用される
- 攻撃者がこの値を知れば、任意のユーザーIDでトークンを生成可能

**実際に起こり得る被害**:
- 任意のユーザーアカウントにログイン可能
- 他人の読書ログ・ギフト・個人情報を閲覧・改ざん可能
- 決済情報の不正アクセス

**優先度**: **最優先（即座に修正）**

---

### 2. セキュリティヘッダー未設定

**なぜ危険か**:
- `next.config.js` にセキュリティヘッダー設定がない
- XSS攻撃、クリックジャッキング、MIMEタイプスニッフィング等の対策が不足

**実際に起こり得る被害**:
- XSS攻撃によるセッション情報の窃取
- クリックジャッキングによる不正操作
- HTTPS強制がない場合の中間者攻撃

**優先度**: **高（本番デプロイ前に必須）**

---

### 3. gift-events APIの未定義変数バグ

**なぜ危険か**:
- `app/api/gift-events/route.ts:66` で `giftIds` が未定義のまま使用されている
- このAPIは成果計測データ取得に使用される重要エンドポイント

**実際に起こり得る被害**:
- サーバーエラー（500）によるサービス停止
- 成果計測機能の完全な不動作
- ユーザー体験の大幅な悪化

**優先度**: **高（即座に修正）**

---

## ④ 修正方針（コードレベル）

### 修正1: JWT_SECRETのデフォルト値削除

**ファイル**: `lib/auth.ts`

**修正前**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
```

**修正後**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
```

**動作確認方法**:
1. 環境変数未設定でアプリ起動 → エラーで起動失敗することを確認
2. 環境変数設定後 → 正常起動・ログイン可能なことを確認

---

### 修正2: セキュリティヘッダー追加

**ファイル**: `next.config.js`

**修正後**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://app.rakuten.co.jp https://webservices.amazon.co.jp;"
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**動作確認方法**:
1. `npm run dev` で起動
2. ブラウザの開発者ツール → Network → 任意のリクエスト → Headers を確認
3. 上記ヘッダーが設定されていることを確認

---

### 修正3: gift-events APIの未定義変数修正

**ファイル**: `app/api/gift-events/route.ts`

**修正前（66行目付近）**:
```typescript
const createdCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: giftIds }, // ❌ giftIds が未定義
    type: 'GIFT_CREATED',
  },
})
```

**修正後**:
```typescript
// giftId が指定されている場合はそのギフトのみ、未指定の場合は自分の全ギフト
const targetGiftIds = giftId 
  ? [giftId] 
  : myGifts.map((g) => g.id)

const createdCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: targetGiftIds },
    type: 'GIFT_CREATED',
  },
})

const openedCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: targetGiftIds },
    type: 'GIFT_OPENED',
  },
})

const outboundClickedCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: targetGiftIds },
    type: 'OUTBOUND_CLICKED',
  },
})

const registeredCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: targetGiftIds },
    type: 'REGISTERED',
  },
})

const subscribedCount = await prisma.giftEvent.count({
  where: {
    giftId: { in: targetGiftIds },
    type: 'SUBSCRIBED',
  },
})
```

**動作確認方法**:
1. `/api/gift-events` にアクセス（認証済み）
2. エラーなくKPIデータが返ることを確認
3. `giftId` パラメータあり/なしの両方でテスト

---

### 修正4（推奨）: パスワード強度向上

**ファイル**: `app/api/auth/register/route.ts`

**修正前**:
```typescript
password: z.string().min(6),
```

**修正後**:
```typescript
password: z.string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .regex(/[A-Z]/, 'パスワードには大文字が含まれる必要があります')
  .regex(/[a-z]/, 'パスワードには小文字が含まれる必要があります')
  .regex(/[0-9]/, 'パスワードには数字が含まれる必要があります'),
```

---

### 修正5（推奨）: 依存関係の脆弱性確認

**コマンド**:
```powershell
npm audit
npm audit fix
```

**動作確認方法**:
- `npm audit` で重大（High/Critical）な脆弱性が0件になることを確認

---

## ⑤ 問題なしと判断した項目

### 認証（Authentication）

✅ **パスワード保存方式**: bcryptjs（salt rounds 10）を使用。適切。

✅ **セッション方式**: JWT + httpOnly Cookie。適切。

✅ **Cookie属性**: 
- `httpOnly: true` ✅
- `secure: process.env.NODE_ENV === 'production'` ✅（本番環境で有効）
- `sameSite: 'lax'` ✅

✅ **未ログイン時のAPI拒否**: `requireAuth` 関数で適切に実装されている。

---

### 認可（Authorization）

✅ **APIでのuserId検証**: 主要なAPI（reading-logs, mesos, macros, koyori, gifts等）で `requireAuth` を使用。

✅ **所有確認**: 
- `reading-logs/[id]`: `where: { id, userId }` でフィルタリング ✅
- `mesos/[id]`: `where: { id, userId }` でフィルタリング ✅
- `macros/[id]`: `where: { id, userId }` でフィルタリング ✅
- `koyori/[id]`: `where: { id, userId }` でフィルタリング ✅
- `gifts`: `where: { senderUserId: userId }` でフィルタリング ✅

✅ **URL直打ち対策**: 所有確認により、他人のデータは取得できない。

---

### 入力値検証（Validation）

✅ **Zodによるバリデーション**: 主要なAPIでZodスキーマを使用。

✅ **XSS対策**: `dangerouslySetInnerHTML` や `eval()` の使用なし。

✅ **SQLインジェクション対策**: Prisma ORMを使用しており、パラメータ化クエリが自動適用される。

---

### フロントエンド露出情報

✅ **NEXT_PUBLIC_変数**: コードベース内で `NEXT_PUBLIC_` の使用なし。環境変数はサーバー側のみで使用。

✅ **APIキー露出**: 楽天・Amazon APIキーはサーバー側（`lib/book-search.ts`）でのみ使用。

---

### Stripe Webhook

✅ **署名検証**: `stripe.webhooks.constructEvent()` で署名検証を実施。

✅ **二重処理防止**: `webhookEventLog` テーブルでイベントIDの重複チェック。

---

## ⑥ 追加推奨事項

### 1. レート制限の実装

現在、`RateLimitBucket` モデルは存在するが、API Routesでの使用が確認できなかった。  
**推奨**: 認証エンドポイント（`/api/auth/login`, `/api/auth/register`）にレート制限を追加。

### 2. ログ監視

本番環境では、以下のログを監視することを推奨：
- 認証失敗の連続試行
- 異常なAPIアクセスパターン
- Webhook処理の失敗

### 3. 環境変数の必須チェック

起動時に必須環境変数をチェックするスクリプトを追加：
```typescript
// lib/env-check.ts
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

export function checkEnvVars() {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

---

## ⑦ まとめ

**即座に修正すべき項目**:
1. ✅ JWT_SECRETのデフォルト値削除
2. ✅ セキュリティヘッダー追加
3. ✅ gift-events APIの未定義変数修正

**本番デプロイ前に修正すべき項目**:
4. パスワード強度向上（推奨）
5. 依存関係の脆弱性対応（推奨）

**現状で問題なし**:
- 認証・認可の基本実装
- 入力値検証
- SQLインジェクション対策
- Stripe Webhook署名検証

**総合評価**: 基本実装は適切。重大リスク3項目を修正済み。セキュリティ強度は「高」に向上。

---

## ⑧ 修正完了サマリー

✅ **修正1: JWT_SECRETのデフォルト値削除** - `lib/auth.ts` を修正。環境変数未設定時は起動エラー。

✅ **修正2: セキュリティヘッダー追加** - `next.config.js` にCSP/HSTS/X-Frame-Options等を追加。

✅ **修正3: gift-events APIの未定義変数修正** - `app/api/gift-events/route.ts` で `targetGiftIds` を正しく計算。

**次のステップ**:
1. 環境変数 `.env` に `JWT_SECRET` が設定されていることを確認
2. `npm run dev` で起動し、セキュリティヘッダーが設定されていることを確認（ブラウザの開発者ツール）
3. `/api/gift-events` が正常に動作することを確認
