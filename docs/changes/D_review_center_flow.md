# レビュー中心導線・報酬ゲート・構造化フォーム - 実装記録

**実装日**: 2026-02-08  
**目的**: 矛盾点を解消するための最小実装

---

## 実装内容（事実のみ）

### 1. 新規ファイル

- **`app/r/page.tsx`** (新規作成)
  - 行数: 約200行
  - 機能: 未ログインでも閲覧可能な公開レビュー一覧画面
  - URL: `/r`
  - 認証: 不要
  - 表示: 構造化ブロック優先（買う理由、良かった点、足りない点、悪かった点、読んだ日、ページ数、引用）
  - 根拠: `app/r/page.tsx:1-200`

- **`components/ReviewForm.tsx`** (新規作成)
  - 行数: 約250行
  - 機能: 構造化レビュー投稿フォーム
  - 必須項目: `rating`, `emotionTag`
  - 構造化フィールド: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
  - 自由記述: `comment`, `searchKeywords`, `favoritePhrase`
  - 根拠: `components/ReviewForm.tsx:1-250`

- **`docs/changes/D_review_center_flow_PRE_INVESTIGATION.md`** (新規作成)
  - 根拠: `docs/changes/D_review_center_flow_PRE_INVESTIGATION.md:1-（全行）`

- **`docs/changes/D_review_center_flow_SPEC.md`** (新規作成)
  - 根拠: `docs/changes/D_review_center_flow_SPEC.md:1-（全行）`

### 2. 変更ファイル

#### Prisma Schema

- **`prisma/schema.prisma`** (既存ファイル)
  - 変更箇所1: `Review`モデルに構造化フィールド追加
    - 行: `prisma/schema.prisma:631-654`付近
    - 追加フィールド:
      - `buyReason` (String?, optional)
      - `goodPoints` (String?, optional)
      - `missingPoints` (String?, optional)
      - `badPoints` (String?, optional)
      - `readDate` (DateTime?, optional)
      - `pagesRead` (Int?, optional)
      - `ocrQuote` (String?, optional)
    - 根拠: `prisma/schema.prisma:631-654`（構造化フィールド追加後）
  - 変更箇所2: `Review`モデルにリレーション追加
    - 行: `prisma/schema.prisma:649-650`付近
    - 追加: `readingProgress ReadingProgress[]`, `ocrAssets OCRAsset[]`
    - 根拠: `prisma/schema.prisma:649-650`
  - 変更箇所3: `ReadingProgress`モデルに`reviewId`追加
    - 行: `prisma/schema.prisma:674-687`付近
    - 追加: `reviewId` (String?, optional), `review Review?`リレーション
    - 根拠: `prisma/schema.prisma:674-687`（reviewId追加後）
  - 変更箇所4: `OCRAsset`モデルに`reviewId`追加
    - 行: `prisma/schema.prisma:262-283`付近
    - 追加: `reviewId` (String?, optional), `review Review?`リレーション
    - 根拠: `prisma/schema.prisma:262-283`（reviewId追加後）

#### API

- **`app/api/reviews/route.ts`** (既存ファイル)
  - 変更箇所1: スキーマ拡張（構造化フィールド追加）
    - 行: `app/api/reviews/route.ts:6-18`（拡張後）
    - 追加: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`, `readingProgressId`, `ocrAssetId`
    - 根拠: `app/api/reviews/route.ts:6-18`
  - 変更箇所2: 所有確認ロジック修正（Book.userIdからUserBookに変更）
    - 行: `app/api/reviews/route.ts:88-95`（修正後）
    - 変更: `prisma.book.findFirst({ where: { id: data.bookId, userId } })` → `prisma.userBook.findFirst({ where: { userId, bookId: data.bookId } })`
    - 根拠: `app/api/reviews/route.ts:88-95`
  - 変更箇所3: 既存レビュー更新時に構造化フィールドを保存
    - 行: `app/api/reviews/route.ts:133-140`（追加後）
    - 追加: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
    - 根拠: `app/api/reviews/route.ts:133-140`
  - 変更箇所4: 新規レビュー作成時に構造化フィールドを保存
    - 行: `app/api/reviews/route.ts:170-177`（追加後）
    - 追加: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
    - 根拠: `app/api/reviews/route.ts:170-177`
  - 変更箇所5: ReadingProgress/OCRAssetとの紐づけ処理追加
    - 行: `app/api/reviews/route.ts:180-195`（追加後）
    - 追加: `readingProgressId`または`ocrAssetId`が指定された場合、該当レコードに`reviewId`を設定
    - 根拠: `app/api/reviews/route.ts:180-195`
  - 変更箇所6: 報酬ゲート判定コメント追加
    - 行: `app/api/reviews/route.ts:197-200`（追加後）
    - 内容: 投稿は全員OK、報酬計上は有料またはaffiliate opt-inのみ（実際の報酬計上は購入発生時に実行）
    - 根拠: `app/api/reviews/route.ts:197-200`

- **`app/api/reviews/public/route.ts`** (既存ファイル)
  - 変更箇所1: `bookId`を必須から任意に変更
    - 行: `app/api/reviews/public/route.ts:16-19`（変更後）
    - 変更: `bookId`が指定されていない場合は全公開レビューを取得
    - 根拠: `app/api/reviews/public/route.ts:16-19,33-37`
  - 変更箇所2: 構造化フィールドをレスポンスに含める
    - 行: `app/api/reviews/public/route.ts:47-57`（追加後）
    - 追加: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
    - 根拠: `app/api/reviews/public/route.ts:47-57`

#### ライブラリ

- **`lib/revenue-share.ts`** (既存ファイル)
  - 変更箇所1: `planType`を`plan`に修正
    - 行: `lib/revenue-share.ts:24-26`（修正後）
    - 変更: `select: { planType: true }` → `select: { plan: true, affiliateState: true }`
    - 根拠: `lib/revenue-share.ts:24-26`
  - 変更箇所2: 報酬計上判定ロジック修正
    - 行: `lib/revenue-share.ts:33-39`（修正後）
    - 変更: `user.planType !== 'free'` → `user.plan !== 'FREE' || user.affiliateState === 'ON'`
    - 根拠: `lib/revenue-share.ts:33-39`

#### UI

- **`app/page.tsx`** (既存ファイル)
  - 変更箇所: 未ログイン時にレビュー閲覧への導線を追加
    - 行: `app/page.tsx:114-127`（変更後）
    - 追加: 「みんなのレビューを見る」ボタン（`/r`へのリンク）
    - 根拠: `app/page.tsx:114-127`

- **`app/books/page.tsx`** (既存ファイル)
  - 変更箇所1: `ReviewForm`コンポーネントのimport追加
    - 行: `app/books/page.tsx:8`（追加後）
    - 根拠: `app/books/page.tsx:8`
  - 変更箇所2: レビュー作成フォーム表示用のstate追加
    - 行: `app/books/page.tsx:45-46`（追加後）
    - 追加: `showReviewForm`, `reviewFormBookId`
    - 根拠: `app/books/page.tsx:45-46`
  - 変更箇所3: レビュー作成フォーム表示処理追加
    - 行: `app/books/page.tsx:571-590`（追加後）
    - 追加: `ReviewForm`コンポーネントの表示、レビュー投稿ボタン
    - 根拠: `app/books/page.tsx:571-590`

- **`app/reviews/page.tsx`** (既存ファイル)
  - 変更箇所: 「みんなのレビュー」へのリンク追加
    - 行: `app/reviews/page.tsx:89-97`（変更後）
    - 追加: 「みんなのレビュー」リンク（`/r`へのリンク）
    - 根拠: `app/reviews/page.tsx:89-97`

- **`components/PublicReviewsList.tsx`** (既存ファイル)
  - 変更箇所1: 型定義に構造化フィールド追加
    - 行: `components/PublicReviewsList.tsx:5-32`（変更後）
    - 追加: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
    - 根拠: `components/PublicReviewsList.tsx:5-32`
  - 変更箇所2: 表示部分に構造化ブロックを追加
    - 行: `components/PublicReviewsList.tsx:115-150`（追加後）
    - 追加: 構造化ブロック（買う理由、良かった点、足りない点、悪かった点、引用、読んだ日、ページ数）を優先表示
    - 根拠: `components/PublicReviewsList.tsx:115-150`

---

## 変更行数（概算）

- **新規ファイル**: 約650行
  - `app/r/page.tsx`: 約200行
  - `components/ReviewForm.tsx`: 約250行
  - `docs/changes/D_review_center_flow_PRE_INVESTIGATION.md`: 約100行
  - `docs/changes/D_review_center_flow_SPEC.md`: 約100行
- **変更ファイル**: 約150行追加
  - `prisma/schema.prisma`: 約20行追加
  - `app/api/reviews/route.ts`: 約50行追加
  - `app/api/reviews/public/route.ts`: 約10行追加
  - `lib/revenue-share.ts`: 約5行変更
  - `app/page.tsx`: 約5行追加
  - `app/books/page.tsx`: 約30行追加
  - `app/reviews/page.tsx`: 約5行追加
  - `components/PublicReviewsList.tsx`: 約25行追加

---

## 動作確認手順

### 1. 未ログインでレビュー閲覧

1. `npm run dev`で開発サーバーを起動
2. ブラウザで `http://localhost:3000` にアクセス
3. 未ログイン状態で「みんなのレビューを見る」ボタンをクリック
4. `/r` に遷移し、公開レビュー一覧が表示されることを確認
5. 構造化ブロック（買う理由、良かった点等）が優先表示されることを確認

### 2. ログイン後のレビュー投稿

1. ログイン（`/login`）
2. 本棚一覧（`/books`）にアクセス
3. 任意の書籍の「レビュー投稿」ボタンをクリック
4. レビュー作成フォームが表示されることを確認
5. 構造化フィールド（買う理由、良かった点等）を入力
6. 「レビューを投稿」ボタンをクリック
7. レビューが投稿され、一覧に反映されることを確認

### 3. 報酬ゲートの確認

1. 無料ユーザーでレビューを投稿
   - 投稿は成功することを確認
   - 報酬計上は発生しない（`lib/revenue-share.ts:33-39`で判定）
2. 有料ユーザー（`plan !== 'FREE'`）でレビューを投稿
   - 投稿は成功することを確認
   - 報酬計上は購入発生時に実行される（レビュー投稿時点では実行されない）
3. アフィリエイトONユーザー（`affiliateState === 'ON'`）でレビューを投稿
   - 投稿は成功することを確認
   - 報酬計上は購入発生時に実行される（レビュー投稿時点では実行されない）

### 4. ReadingProgress/OCRAssetとの紐づけ確認

1. レビュー投稿時に`readingProgressId`または`ocrAssetId`を指定
2. 該当する`ReadingProgress`または`OCRAsset`レコードの`reviewId`が設定されることを確認（Prisma Studioで確認）

---

## 根拠行（ファイルパス:行）

### Prisma Schema

- `prisma/schema.prisma:631-654` - Reviewモデル（構造化フィールド追加後）
- `prisma/schema.prisma:649-650` - Reviewモデル（リレーション追加後）
- `prisma/schema.prisma:674-687` - ReadingProgressモデル（reviewId追加後）
- `prisma/schema.prisma:262-283` - OCRAssetモデル（reviewId追加後）

### API

- `app/api/reviews/route.ts:6-18` - スキーマ拡張（構造化フィールド追加）
- `app/api/reviews/route.ts:88-95` - 所有確認ロジック修正（UserBookで確認）
- `app/api/reviews/route.ts:133-140` - 既存レビュー更新（構造化フィールド保存）
- `app/api/reviews/route.ts:170-177` - 新規レビュー作成（構造化フィールド保存）
- `app/api/reviews/route.ts:180-195` - ReadingProgress/OCRAssetとの紐づけ
- `app/api/reviews/route.ts:197-200` - 報酬ゲート判定コメント
- `app/api/reviews/public/route.ts:16-19` - bookIdを任意に変更
- `app/api/reviews/public/route.ts:33-37` - where条件（bookId任意）
- `app/api/reviews/public/route.ts:47-57` - 構造化フィールドをレスポンスに含める

### ライブラリ

- `lib/revenue-share.ts:24-26` - ユーザー情報取得（plan, affiliateState）
- `lib/revenue-share.ts:33-39` - 報酬計上判定（plan !== 'FREE' || affiliateState === 'ON'）

### UI

- `app/page.tsx:114-127` - 未ログイン時にレビュー閲覧への導線追加
- `app/books/page.tsx:8` - ReviewFormコンポーネントのimport追加
- `app/books/page.tsx:45-46` - レビュー作成フォーム表示用のstate追加
- `app/books/page.tsx:571-590` - レビュー作成フォーム表示処理追加
- `app/reviews/page.tsx:89-97` - 「みんなのレビュー」へのリンク追加
- `components/PublicReviewsList.tsx:5-32` - 型定義に構造化フィールド追加
- `components/PublicReviewsList.tsx:115-150` - 表示部分に構造化ブロック追加

---

## 解消された矛盾点

### 1. 初回体験が「他人のレビュー起点」になっていない

**解消**: `/r` ページを新規作成し、未ログインでも閲覧可能にした
- 根拠: `app/r/page.tsx:1-200`
- 根拠: `app/page.tsx:114-127`（未ログイン時の導線追加）

### 2. 報酬ゲートがコード根拠として確定できない

**解消**: `lib/revenue-share.ts`を修正し、`plan !== 'FREE' || affiliateState === 'ON'`で判定するようにした
- 根拠: `lib/revenue-share.ts:24-26,33-39`
- 根拠: `app/api/reviews/route.ts:197-200`（報酬ゲート判定コメント）

### 3. 追加したいレビュー項目がReview仕様・UIに反映されていない

**解消**: Reviewモデルに構造化フィールドを追加し、API/UIまで整合させた
- 根拠: `prisma/schema.prisma:631-654`（構造化フィールド追加）
- 根拠: `app/api/reviews/route.ts:6-18`（スキーマ拡張）
- 根拠: `components/ReviewForm.tsx:1-250`（構造化フォーム）
- 根拠: `components/PublicReviewsList.tsx:115-150`（構造化ブロック表示）

### 4. 「レビュアー能力に依存しない投稿フォーム」(選択式/定型)が未反映

**解消**: 構造化フォームを実装し、比較しやすい定型ブロックで表示するようにした
- 根拠: `components/ReviewForm.tsx:1-250`（構造化フォーム）
- 根拠: `components/PublicReviewsList.tsx:115-150`（構造化ブロック表示）
- 根拠: `app/r/page.tsx:1-200`（構造化ブロック優先表示）

---

## 注意事項

- Prismaスキーマ変更後、`npx prisma db push`を実行してDBに反映する必要がある
- Prisma Client再生成後、`npx prisma generate`を実行する必要がある
- 報酬計上の実際の呼び出し箇所は購入発生時の処理で実装する必要がある（今回はレビュー投稿時点では報酬計上しない）
