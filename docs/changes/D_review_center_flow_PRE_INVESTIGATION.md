# レビュー中心導線・報酬ゲート・構造化フォーム - 事前調査

**調査日**: 2026-02-08  
**目的**: 現状の根拠収集（推測禁止）

---

## A. 現状の根拠収集

### A.1 Review作成UIの存在箇所

**結論**: レビュー作成UIは存在しない

**根拠**:
- `app/reviews/page.tsx:1-207` - レビュー一覧表示のみ（作成フォームなし）
- `app/books/page.tsx:1-638` - 書籍登録・管理画面（レビュー作成フォームなし）
- `app/page.tsx:1-212` - ホーム画面（レビュー作成導線なし）

**レビュー投稿API**:
- `POST /api/reviews` (`app/api/reviews/route.ts:68-164`)
  - 認証: 必須（`requireAuth`）
  - 所有確認: 自分の書籍のみレビュー可能（`app/api/reviews/route.ts:76-83`）
  - 1書籍1レビュー制限（`app/api/reviews/route.ts:85-91`）

### A.2 入力フィールド

**現在のReviewモデル** (`prisma/schema.prisma:631-654`):
- `rating` (Int) - 必須
- `comment` (String?) - 任意
- `searchKeywords` (String?) - 任意
- `favoritePhrase` (String?) - 任意
- `emotionTag` (String) - 必須
- `recommendedBooks` (String?) - 任意（JSON文字列）
- `isPublic` (Boolean) - デフォルト: false
- `hasSpoiler` (Boolean) - デフォルト: false

**現在のAPIスキーマ** (`app/api/reviews/route.ts:6-18`):
- `bookId` (string) - 必須
- `rating` (number, 1-5) - 必須
- `comment` (string, max 200) - 任意
- `searchKeywords` (string) - 任意
- `favoritePhrase` (string, max 100) - 任意
- `emotionTag` (string) - 必須
- `recommendedBooks` (array of string, max 3) - 任意
- `wrongCount` (number, int, min 0) - 任意
- `masteryDays` (number, int, min 0) - 任意
- `isPublic` (boolean) - デフォルト: false
- `hasSpoiler` (boolean) - デフォルト: false

**不足している項目（要求）**:
- 買う理由
- 良かった点
- 足りない点
- 悪かった点
- 読んだ日
- ページ数
- OCR一文

### A.3 送信payload

**現在の送信payload** (`app/api/reviews/route.ts:73-74`):
```typescript
const body = await request.json()
const data = createReviewSchema.parse(body)
```

**実際のDB保存** (`app/api/reviews/route.ts:137-149`):
- `userId`, `bookId`, `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `recommendedBooks` (JSON文字列化), `isPublic`, `hasSpoiler`

### A.4 isPublicの扱い

**現在の扱い**:
- デフォルト: `false` (`prisma/schema.prisma:641`, `app/api/reviews/route.ts:16`)
- 投稿時に指定可能（`app/api/reviews/route.ts:119,147`）
- 公開レビュー取得: `GET /api/reviews/public?bookId=...` (`app/api/reviews/public/route.ts:34-36`)
  - 条件: `isPublic: true`

### A.5 未ログインで閲覧可能なレビュー画面

**存在する画面**:
- なし（未ログイン時は`/`でログイン/登録画面に誘導される）

**存在するAPI**:
- `GET /api/reviews/public?bookId=...` (`app/api/reviews/public/route.ts:1-112`)
  - 認証: 不要（`requireAuth`なし）
  - 条件: `bookId`必須、`isPublic: true`のみ取得
  - 制限: `bookId`が必須のため、書籍単位でのみ閲覧可能

**使用箇所**:
- `components/PublicReviewsList.tsx:45` - 本棚一覧ページ（`/books`）内で使用
  - ただし、`/books`は認証必須（`app/books/page.tsx:58-60`で401時は`/login`にリダイレクト）

### A.6 報酬計上の生成ロジック

**存在する関数**:
- `lib/revenue-share.ts:17-60` - `createRevenueShare`関数
  - 有料会員チェック: `user.planType !== 'free'` (`lib/revenue-share.ts:34`)
  - 問題: `user.planType`フィールドが存在しない（`prisma/schema.prisma:20`は`plan`フィールド）
  - 還元率: 10% (`lib/revenue-share.ts:6`)
  - 還元額計算: `Math.floor(revenueAmount * REVENUE_SHARE_RATE)` (`lib/revenue-share.ts:42`)

**RevenueShare作成**:
- `prisma.revenueShare.create` (`lib/revenue-share.ts:50-59`)
  - フィールド: `userId`, `reviewId`, `amount`, `revenueAmount`, `status: 'pending'`, `description`

**呼び出し箇所**:
- 未発見（`createRevenueShare`関数の呼び出し箇所が見つからない）
  - 検索結果: `grep -i "createRevenueShare"` => `lib/revenue-share.ts`のみ

**結論**: 報酬計上の生成ロジックは定義されているが、実際に呼び出されている箇所がない（未実装）

### A.7 ReadingProgress/OCRAssetとの紐づけ

**現在の状態**:
- `Review`モデルに`ReadingProgress`や`OCRAsset`への参照がない
- `ReadingProgress`モデル (`prisma/schema.prisma:674-687`): `userId`, `bookId`のみ（`reviewId`なし）
- `OCRAsset`モデル (`prisma/schema.prisma:262-283`): `userId`, `bookId`のみ（`reviewId`なし）

**結論**: ReviewとReadingProgress/OCRAssetの紐づけは未実装

---

## B. 矛盾点の整理

### B.1 初回体験が「他人のレビュー起点」になっていない

**現状**:
- `/` は未ログイン時はログイン/登録画面のみ
- 他人レビューは `/books` 内 `PublicReviewsList`（`bookId`前提）に限定
- `/books` は認証必須

**目標**: 未ログインでも閲覧できる「レビュー一覧/フィード」の入口を用意

### B.2 報酬ゲートがコード根拠として確定できない

**現状**:
- `lib/revenue-share.ts:34` で `user.planType !== 'free'` をチェック
- しかし `prisma/schema.prisma:20` は `plan` フィールド（`planType`ではない）
- 実際の呼び出し箇所が見つからない（未実装）

**目標**: 投稿自体は全員OK / 報酬計上・分配は有料のみ、をコードで明確化

### B.3 追加したいレビュー項目がReview仕様・UIに反映されていない

**現状**:
- Reviewモデルには `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `recommendedBooks` のみ
- 不足: 買う理由、良かった点、足りない点、悪かった点、読んだ日、ページ数、OCR一文

**目標**: 構造化フォームとして必須/任意を定義し、DB/API/UIまで整合

### B.4 「レビュアー能力に依存しない投稿フォーム」(選択式/定型)が未反映

**現状**:
- レビュー作成UIが存在しない
- 既存のフィールドは自由記述中心（`comment`, `searchKeywords`, `favoritePhrase`）

**目標**: 入力UIと表示UIを"比較しやすい定型ブロック"に変更

---

## C. 次のステップ

1. 仕様の最小決定（MVP）
2. 実装（MVP）
3. ドキュメント更新
