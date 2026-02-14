# Snapshot公開フォーマット実装レポート

**作成日**: 2026-02-08  
**目的**: 外部公開を「Review」から「PublishedSnapshot（公開固定）」に統一し、新フォーマット対応

---

## 変更ファイル一覧

### DB（prisma/schema.prisma）
- **変更行数**: +30行
- **変更内容**:
  - `PublishedSnapshot.publicFields`: `String?` → `String`（必須化）
  - `PublishedSnapshot.slug`: `String?` → `String`（必須化、ユニーク）
  - `PublishedSnapshot`にコメント追加（新フォーマット仕様）
  - `RevenueShareGateLog.snapshotId`: 追加（Snapshot経由の外部遷移計測用）
  - `OcrUsage`モデル: 新規追加（OCR従量課金のusage集計テーブル）
  - `User.ocrUsages`: リレーション追加

### API（新規・修正）

#### 新規: `app/api/snapshots/route.ts`
- **行数**: 287行
- **変更内容**:
  - `POST`: 新フォーマット対応のSnapshot作成・更新（upsert）
  - バリデーション: `questionTitle`, `mainPoint`, `myAnswer`必須
  - `evidenceQuote`バリデーション: 句読点3つまで or 150字上限
  - `publicFields`に新フォーマットを格納
  - slug生成: `s-{bookId短縮}-{ランダム8文字}`
  - 報酬ゲート判定ログ（PUBLISHED時）

#### 新規: `app/api/snapshots/public/route.ts`
- **行数**: 95行
- **変更内容**:
  - `GET`: 未ログイン可、PUBLISHEDかつPUBLICのみ返す
  - `user.email`は絶対にselectしない（PII除外）
  - `publicFields`をパースして返す

#### 新規: `app/api/snapshots/[slug]/route.ts`
- **行数**: 75行
- **変更内容**:
  - `GET`: slugでSnapshot個別取得（未ログイン可）
  - PUBLISHEDかつPUBLICのみ返す

#### 新規: `app/out/snapshot/[snapshotId]/route.ts`
- **行数**: 116行
- **変更内容**:
  - `GET`: Snapshot経由の外部リンク遷移（サーバー側リダイレクト）
  - GateLog記録（`SNAPSHOT_CLICK`）
  - URLバリデーション（Amazon/Rakutenのみ）

#### 修正: `app/api/reviews/public/route.ts`
- **変更行数**: -5行
- **変更内容**:
  - `user.email`を取得しないように修正（PII保護）
  - 匿名名は`userId`から生成（`ユーザー{userId短縮}`）

### ページ（新規・修正）

#### 修正: `app/r/page.tsx`
- **変更行数**: +150行（全面書き換え）
- **変更内容**:
  - `/api/reviews/public` → `/api/snapshots/public`に切り替え
  - 表示フォーマット: 「疑問→主点→答え→根拠→引用元→購入リンク」
  - 構造化ブロック優先表示

#### 新規: `app/s/[slug]/page.tsx`
- **行数**: 150行
- **変更内容**:
  - Snapshot個別公開ページ（SEO想定）
  - `/api/snapshots/[slug]`を呼び出し
  - 詳細表示（疑問、主点、答え、根拠、引用元、購入リンク）

### ライブラリ（新規・修正）

#### 修正: `lib/revenue-share.ts`
- **変更行数**: +5行
- **変更内容**:
  - `RevenueShareGateSource`に`'SNAPSHOT_CLICK'`追加
  - `logRevenueShareGateDecision`に`snapshotId`パラメータ追加

#### 修正: `lib/stripe.ts`
- **変更行数**: +50行
- **変更内容**:
  - `getStudyPriceId`: STUDY_SUB（冊数Tier）用Price ID取得関数追加
  - `createStudyCheckoutSession`: STUDY_SUB用Checkout Session作成関数追加
  - 環境変数: `STRIPE_STUDY_PRICE_ID_3`, `_5`, `_10`, `_20`, `_30`, `_50`

#### 新規: `lib/ocr-usage.ts`
- **行数**: 50行
- **変更内容**:
  - `recordOcrUsage`: OCR従量課金のusage記録（月次集計）
  - `getOcrUsage`: OCR usage取得（月次）

#### 修正: `app/api/stripe/webhook/route.ts`
- **変更行数**: +40行
- **変更内容**:
  - `checkout.session.completed`で`purpose=STUDY_SUB`を処理
  - `plan=STUDY`, `affiliatePlanType=STUDY_SUB`, `affiliateState=ON`に更新
  - `logAffiliateStateChange`で`STUDY_SUBSCRIBED`理由を記録

#### 修正: `app/api/ocr-assets/route.ts`
- **変更行数**: +10行
- **変更内容**:
  - OCRアセット作成時に`recordOcrUsage`を呼び出し
  - OCR文字数と画像枚数を記録

---

## バリデーション仕様

### Snapshot作成API（`POST /api/snapshots`）

#### 必須フィールド
- `questionTitle`: string, 1-100文字（疑問見出し）
- `mainPoint`: string, 1-200文字（主点 1-2行）
- `myAnswer`: string, 1-2000文字（自分の答え）

#### 任意フィールド
- `rating`: number, 1-5（デフォルト: 5）
- `evidenceQuote`: string, 最大150字、句読点（。、）3つまで
- `citation`: object（`bookTitle`必須、`edition`/`page`任意）
- `affiliate`: object（`provider`必須、`url`必須）
- `permitted`: object（`showComment`/`showReadDate`/`showStudyHistory`、デフォルト: false）

#### 引用制限（`evidenceQuote`）
- **文字数上限**: 150字
- **句読点制限**: 句読点（。、）が3つまで
- **バリデーション関数**: `validateEvidenceQuote`（`app/api/snapshots/route.ts:20-30`）

#### 公開許可フラグ（`permitted`）
- `showComment`: boolean（コメント表示許可）
- `showReadDate`: boolean（読んだ日表示許可）
- `showStudyHistory`: boolean（勉強コース履歴表示許可）

---

## 既存 `/r` と `reviews/public` の段階移行手順

### フェーズ1: 安全対策（即時実施）
1. ✅ `app/api/reviews/public/route.ts`で`user.email`を取得しないように修正
2. ✅ 匿名名は`userId`から生成（`ユーザー{userId短縮}`）

### フェーズ2: Snapshot公開の並行運用（1-2週間）
1. ✅ `/r`ページを`/api/snapshots/public`に切り替え
2. ✅ `reviews/public` APIは残す（既存リンクの互換性維持）
3. ✅ 新規投稿はSnapshot形式を推奨

### フェーズ3: Review公開の段階的廃止（1-2ヶ月後）
1. `reviews/public` APIに非推奨警告を追加
2. 既存ReviewのSnapshot化を推奨
3. 最終的に`reviews/public` APIを廃止

---

## コード根拠（主要箇所）

### Snapshot作成（新フォーマット）
- **ファイル**: `app/api/snapshots/route.ts:31-286`
- **publicFields構築**: `app/api/snapshots/route.ts:150-170`
- **バリデーション**: `app/api/snapshots/route.ts:20-30`（`validateEvidenceQuote`）

### 公開Snapshot取得（PII除外）
- **ファイル**: `app/api/snapshots/public/route.ts:44-85`
- **user.email除外**: `app/api/snapshots/public/route.ts:67-72`（`select`に`user`を含めない）

### 外部遷移計測（Snapshot経由）
- **ファイル**: `app/out/snapshot/[snapshotId]/route.ts:14-116`
- **GateLog記録**: `app/out/snapshot/[snapshotId]/route.ts:91-105`

### OCR従量課金記録
- **ファイル**: `lib/ocr-usage.ts:8-50`
- **記録呼び出し**: `app/api/ocr-assets/route.ts:148-156`

### Stripe STUDY_SUB処理
- **ファイル**: `app/api/stripe/webhook/route.ts:52-120`
- **STUDY_SUB分岐**: `app/api/stripe/webhook/route.ts:70-105`

---

## 動作確認手順

### 1. Snapshot作成・公開
```bash
# POST /api/snapshots
curl -X POST http://localhost:3000/api/snapshots \
  -H "Content-Type: application/json" \
  -H "Cookie: token=..." \
  -d '{
    "bookId": "...",
    "questionTitle": "疑問見出し",
    "mainPoint": "主点1-2行",
    "myAnswer": "自分の答え",
    "evidenceQuote": "短い引用。",
    "status": "PUBLISHED",
    "visibility": "PUBLIC"
  }'
```

### 2. 公開Snapshot一覧取得（未ログイン）
```bash
# GET /api/snapshots/public
curl http://localhost:3000/api/snapshots/public?limit=20&offset=0
```

### 3. Snapshot個別取得（slug）
```bash
# GET /api/snapshots/[slug]
curl http://localhost:3000/api/snapshots/s-clx1-abc12345
```

### 4. 外部遷移計測
```bash
# GET /out/snapshot/[snapshotId]?to=<purchaseUrl>
curl -L http://localhost:3000/out/snapshot/clx123456?to=https://www.amazon.co.jp/s?k=本
```

### 5. OCR従量課金記録確認
```bash
# OCRアセット作成時に自動記録
# 確認: SELECT * FROM ocr_usage WHERE user_id = '...' AND year = 2026 AND month = 2
```

---

## 環境変数（追加必要）

### Stripe STUDY_SUB Price ID
```env
STRIPE_STUDY_PRICE_ID_3=price_xxx  # 3冊以下
STRIPE_STUDY_PRICE_ID_5=price_xxx  # 5冊以下
STRIPE_STUDY_PRICE_ID_10=price_xxx # 10冊以下
STRIPE_STUDY_PRICE_ID_20=price_xxx # 20冊以下
STRIPE_STUDY_PRICE_ID_30=price_xxx # 30冊以下
STRIPE_STUDY_PRICE_ID_50=price_xxx # 50冊以下
```

---

## 注意事項

1. **OCR非公開ルール**: `OCRAsset.extractedText`は外部公開APIから参照禁止（`app/api/snapshots/public/route.ts`では`OCRAsset`を含めない）
2. **PII保護**: `user.email`は絶対に外部公開APIで取得しない（`app/api/snapshots/public/route.ts`, `app/api/reviews/public/route.ts`）
3. **slug生成**: 衝突チェックを5回まで実施（`app/api/snapshots/route.ts:209-223`）
4. **引用制限**: `evidenceQuote`は句読点3つまで or 150字上限（`app/api/snapshots/route.ts:20-30`）

---

**最終更新**: 2026-02-08
