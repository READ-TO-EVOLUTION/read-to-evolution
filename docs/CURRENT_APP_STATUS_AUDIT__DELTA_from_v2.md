# アプリケーション現状監査レポート - DELTA from v2

**作成日**: 2026-02-08  
**基準点**: `docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v2.md`  
**目的**: v2スナップショットからの変更点を記録

---

## 1. 追加

### 1.1 新規画面

- **`/r` - みんなのレビュー（公開レビュー一覧、未ログイン可）**
  - 根拠: `app/r/page.tsx:1-200`
  - 機能: 構造化ブロック優先表示（買う理由、良かった点、足りない点、悪かった点、読んだ日、ページ数、引用）
  - 認証: 不要（未ログインでも閲覧可能）

### 1.2 新規コンポーネント

- **`components/ReviewForm.tsx`**
  - 根拠: `components/ReviewForm.tsx:1-250`
  - 機能: 構造化レビュー投稿フォーム
  - 必須項目: `rating`, `emotionTag`
  - 構造化フィールド: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`

### 1.3 新規ドキュメント

- **`docs/changes/D_review_center_flow_PRE_INVESTIGATION.md`**
  - 根拠: `docs/changes/D_review_center_flow_PRE_INVESTIGATION.md:1-（全行）`
  - 内容: 現状の根拠収集（Review作成UI、入力フィールド、送信payload、isPublicの扱い、未ログイン閲覧画面、報酬計上ロジック）

- **`docs/changes/D_review_center_flow_SPEC.md`**
  - 根拠: `docs/changes/D_review_center_flow_SPEC.md:1-（全行）`
  - 内容: MVP仕様（レビュー閲覧トップ、Reviewモデル拡張、報酬ゲート、ReadingProgress/OCRAsset紐づけ）

- **`docs/changes/D_review_center_flow.md`**
  - 根拠: `docs/changes/D_review_center_flow.md:1-（全行）`
  - 内容: 実装記録（変更ファイル一覧、変更行数、動作確認手順、根拠行）

### 1.4 データベースモデル拡張

- **Reviewモデルに構造化フィールド追加**
  - 根拠: `prisma/schema.prisma:631-654`（構造化フィールド追加後）
  - 追加フィールド:
    - `buyReason` (String?, optional) - 買う理由
    - `goodPoints` (String?, optional) - 良かった点
    - `missingPoints` (String?, optional) - 足りない点
    - `badPoints` (String?, optional) - 悪かった点
    - `readDate` (DateTime?, optional) - 読んだ日
    - `pagesRead` (Int?, optional) - ページ数
    - `ocrQuote` (String?, optional) - OCR一文（引用）

- **ReadingProgressモデルにreviewId追加**
  - 根拠: `prisma/schema.prisma:674-687`（reviewId追加後）
  - 追加: `reviewId` (String?, optional), `review Review?`リレーション

- **OCRAssetモデルにreviewId追加**
  - 根拠: `prisma/schema.prisma:262-283`（reviewId追加後）
  - 追加: `reviewId` (String?, optional), `review Review?`リレーション

---

## 2. 変更

### 2.1 API変更

- **`GET /api/reviews/public`**
  - 変更: `bookId`を必須から任意に変更
  - 根拠: `app/api/reviews/public/route.ts:16-19,33-37`
  - 変更: 構造化フィールドをレスポンスに含める
  - 根拠: `app/api/reviews/public/route.ts:47-57`

- **`POST /api/reviews`**
  - 変更: スキーマ拡張（構造化フィールド追加）
  - 根拠: `app/api/reviews/route.ts:6-18`
  - 変更: 所有確認ロジック修正（Book.userIdからUserBookに変更）
  - 根拠: `app/api/reviews/route.ts:88-95`
  - 変更: 既存レビュー更新時に構造化フィールドを保存
  - 根拠: `app/api/reviews/route.ts:133-140`
  - 変更: 新規レビュー作成時に構造化フィールドを保存
  - 根拠: `app/api/reviews/route.ts:170-177`
  - 変更: ReadingProgress/OCRAssetとの紐づけ処理追加
  - 根拠: `app/api/reviews/route.ts:180-195`
  - 変更: 報酬ゲート判定コメント追加
  - 根拠: `app/api/reviews/route.ts:197-200`

### 2.2 ライブラリ変更

- **`lib/revenue-share.ts`**
  - 変更: `planType`を`plan`に修正
  - 根拠: `lib/revenue-share.ts:24-26`
  - 変更: 報酬計上判定ロジック修正（`plan !== 'FREE' || affiliateState === 'ON'`）
  - 根拠: `lib/revenue-share.ts:33-39`

### 2.3 UI変更

- **`app/page.tsx`**
  - 変更: 未ログイン時にレビュー閲覧への導線を追加
  - 根拠: `app/page.tsx:114-127`
  - 追加: 「みんなのレビューを見る」ボタン（`/r`へのリンク）

- **`app/books/page.tsx`**
  - 変更: `ReviewForm`コンポーネントのimport追加
  - 根拠: `app/books/page.tsx:8`
  - 変更: レビュー作成フォーム表示用のstate追加
  - 根拠: `app/books/page.tsx:45-46`
  - 変更: レビュー作成フォーム表示処理追加
  - 根拠: `app/books/page.tsx:571-590`

- **`app/reviews/page.tsx`**
  - 変更: 「みんなのレビュー」へのリンク追加
  - 根拠: `app/reviews/page.tsx:89-97`

- **`components/PublicReviewsList.tsx`**
  - 変更: 型定義に構造化フィールド追加
  - 根拠: `components/PublicReviewsList.tsx:5-32`
  - 変更: 表示部分に構造化ブロック追加
  - 根拠: `components/PublicReviewsList.tsx:115-150`

---

## 3. 削除

- なし

---

## 4. 解消

### 4.1 矛盾点の解消

- **初回体験が「他人のレビュー起点」になっていない**
  - 解消: `/r` ページを新規作成し、未ログインでも閲覧可能にした
  - 根拠: `app/r/page.tsx:1-200`
  - 根拠: `app/page.tsx:114-127`

- **報酬ゲートがコード根拠として確定できない**
  - 解消: `lib/revenue-share.ts`を修正し、`plan !== 'FREE' || affiliateState === 'ON'`で判定するようにした
  - 根拠: `lib/revenue-share.ts:24-26,33-39`
  - 根拠: `app/api/reviews/route.ts:197-200`

- **追加したいレビュー項目がReview仕様・UIに反映されていない**
  - 解消: Reviewモデルに構造化フィールドを追加し、API/UIまで整合させた
  - 根拠: `prisma/schema.prisma:631-654`
  - 根拠: `app/api/reviews/route.ts:6-18`
  - 根拠: `components/ReviewForm.tsx:1-250`
  - 根拠: `components/PublicReviewsList.tsx:115-150`

- **「レビュアー能力に依存しない投稿フォーム」(選択式/定型)が未反映**
  - 解消: 構造化フォームを実装し、比較しやすい定型ブロックで表示するようにした
  - 根拠: `components/ReviewForm.tsx:1-250`
  - 根拠: `components/PublicReviewsList.tsx:115-150`
  - 根拠: `app/r/page.tsx:1-200`

---

## 5. 変更行数（概算）

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

**作成日**: 2026-02-08  
**基準点**: `docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v2.md`
