# アプリケーション現状監査レポート - v1スナップショットからの差分

**作成日**: 2026-02-08  
**基準**: `docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v1.md`  
**目的**: A/B/C作業完了後の変更点を「追加/変更/削除/解消」で分類

---

## 1. 追加（新規実装・新規ファイル・新規機能）

### 1.1 新規コンポーネント

- **`components/PublicReviewsList.tsx`** (新規作成)
  - 機能: 公開レビュー一覧を表示するコンポーネント
  - API: `GET /api/reviews/public?bookId=...&limit=...&offset=0`を呼び出す
  - 表示項目: ユーザー名、評価（★）、コメント、お気に入りフレーズ、感情タグ、ネタバレフラグ、作成日
  - 根拠: `components/PublicReviewsList.tsx:1-134`
  - 関連作業: A（公開レビュー表示機能）

### 1.2 新規ドキュメント

- **`docs/pricing/PRICING_TRUTH.md`** (新規作成)
  - 内容: 実装上の料金・プラン情報の事実（Single Source of Truth）
  - 根拠: `docs/pricing/PRICING_TRUTH.md:1-（全行）`
  - 関連作業: C（料金・プラン情報の整合性監査）

- **`docs/changes/C_pricing_audit.md`** (新規作成)
  - 内容: README/docsとの料金・プラン情報の差分一覧
  - 根拠: `docs/changes/C_pricing_audit.md:1-（全行）`
  - 関連作業: C（料金・プラン情報の整合性監査）

- **`docs/changes/A_public_reviews_display.md`** (新規作成)
  - 内容: 公開レビュー表示機能の実装記録
  - 根拠: `docs/changes/A_public_reviews_display.md:1-（全行）`
  - 関連作業: A（公開レビュー表示機能）

- **`docs/changes/A_public_reviews_display_PRE_INVESTIGATION.md`** (新規作成)
  - 内容: 公開レビュー表示機能の事前調査結果
  - 根拠: `docs/changes/A_public_reviews_display_PRE_INVESTIGATION.md:1-（全行）`
  - 関連作業: A（公開レビュー表示機能）

- **`docs/changes/B_search.md`** (新規作成)
  - 内容: 検索機能の実装記録
  - 根拠: `docs/changes/B_search.md:1-（全行）`
  - 関連作業: B（検索機能）

- **`docs/changes/B_search_PRE_INVESTIGATION.md`** (新規作成)
  - 内容: 検索機能の事前調査結果
  - 根拠: `docs/changes/B_search_PRE_INVESTIGATION.md:1-（全行）`
  - 関連作業: B（検索機能）

### 1.3 新規機能（UI）

- **本棚一覧ページに公開レビュー一覧表示機能**
  - ページ: `/books` (`app/books/page.tsx`)
  - 機能: 各書籍カードに「みんなのレビュー」セクションを表示
  - コンポーネント: `PublicReviewsList` (`app/books/page.tsx:569`)
  - 根拠: `app/books/page.tsx:568-569`
  - 関連作業: A（公開レビュー表示機能）

- **レビューページに検索機能**
  - ページ: `/reviews` (`app/reviews/page.tsx`)
  - 機能: 検索ボックスで`searchKeywords`と`comment`を検索
  - UI: 検索ボックス、検索ボタン、クリアボタン (`app/reviews/page.tsx:86-102`)
  - 根拠: `app/reviews/page.tsx:86-102`
  - 関連作業: B（検索機能）

---

## 2. 変更（既存ファイル・既存機能の修正・拡張）

### 2.1 画面（page.tsx）

- **`app/books/page.tsx`**
  - 変更箇所1: import文追加（`PublicReviewsList`コンポーネント）
    - 行: `app/books/page.tsx:8`
    - 変更内容: `import PublicReviewsList from '@/components/PublicReviewsList'`
    - 根拠: `app/books/page.tsx:8`
  - 変更箇所2: 各書籍カードに`PublicReviewsList`コンポーネントを追加
    - 行: `app/books/page.tsx:569`
    - 変更内容: `<PublicReviewsList bookId={book.id} limit={5} />`
    - 根拠: `app/books/page.tsx:568-569`
  - 行数差分: +2行
  - 関連作業: A（公開レビュー表示機能）

- **`app/reviews/page.tsx`**
  - 変更箇所1: state追加（`searchQuery`）
    - 行: `app/reviews/page.tsx:24`
    - 変更内容: `const [searchQuery, setSearchQuery] = useState('')`
    - 根拠: `app/reviews/page.tsx:24`
  - 変更箇所2: `fetchReviews`関数の拡張（`q`パラメータ対応）
    - 行: `app/reviews/page.tsx:30-48`
    - 変更内容: `q`パラメータを受け取り、検索クエリがある場合は`/api/reviews?q=...`を呼び出す
    - 根拠: `app/reviews/page.tsx:30-48`
  - 変更箇所3: 検索ハンドラー追加
    - 行: `app/reviews/page.tsx:50-58`
    - 変更内容: `handleSearch`, `handleClearSearch`関数を追加
    - 根拠: `app/reviews/page.tsx:50-58`
  - 変更箇所4: 検索UI追加
    - 行: `app/reviews/page.tsx:86-102`
    - 変更内容: 検索ボックス、検索ボタン、クリアボタンを追加
    - 根拠: `app/reviews/page.tsx:86-102`
  - 行数差分: +約30行
  - 関連作業: B（検索機能）

### 2.2 API（route.ts）

- **`app/api/reviews/route.ts`**
  - 変更箇所: `GET`関数内（検索クエリパラメータ追加）
    - 行: `app/api/reviews/route.ts:28,35-42`
    - 変更内容:
      - `q`パラメータを取得（`searchParams.get('q')`）
      - 検索クエリがある場合、`searchKeywords`と`comment`で部分一致検索を追加
      - Prisma `contains`を使用（`OR`条件）
    - 根拠: `app/api/reviews/route.ts:28,35-42`
  - 行数差分: +約10行
  - 関連作業: B（検索機能）

---

## 3. 削除（削除されたファイル・削除された機能）

### 3.1 削除されたファイル

- **なし**

### 3.2 削除された機能

- **なし**

---

## 4. 解消（v1スナップショット時点で「未実装」「不一致」「不明」だった項目の解消）

### 4.1 未実装項目の解消

- **`GET /api/reviews?q=検索語（レビュー検索）`**
  - 状態: v1時点では未実装（`docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v1.md:559-562`）
  - 解消内容: `app/api/reviews/route.ts`に`q`パラメータを追加し、`searchKeywords`と`comment`で部分一致検索を実装
  - 根拠: `app/api/reviews/route.ts:28,35-42`
  - 関連作業: B（検索機能）

### 4.2 不一致項目の解消

- **なし**
  - 注: C作業で不一致を特定したが、解消は行っていない（意思決定待ち）

### 4.3 不明項目の解消

- **料金・プラン情報の「単一の正本（Single Source of Truth）」の確立**
  - 状態: v1時点では料金・プラン情報が複数箇所に散在し、不一致が存在
  - 解消内容: `docs/pricing/PRICING_TRUTH.md`を作成し、実装上の事実を集約
  - 根拠: `docs/pricing/PRICING_TRUTH.md:1-（全行）`
  - 関連作業: C（料金・プラン情報の整合性監査）

- **料金・プラン情報の不一致の明確化**
  - 状態: v1時点では不一致の詳細が不明確
  - 解消内容: `docs/changes/C_pricing_audit.md`で不一致項目を一覧化
  - 根拠: `docs/changes/C_pricing_audit.md:1-（全行）`
  - 関連作業: C（料金・プラン情報の整合性監査）

---

## 5. 実装済み機能の更新（v1スナップショットとの比較）

### 5.1 実装済み画面（page.tsx）

#### 変更なし

- `/books` - 本棚一覧
  - v1: `app/books/page.tsx:1-634`
  - 現在: `app/books/page.tsx:1-638`（+4行、PublicReviewsList追加）
  - 根拠: `app/books/page.tsx:568-569`

- `/reviews` - レビュー一覧
  - v1: `app/reviews/page.tsx:1-166`
  - 現在: `app/reviews/page.tsx:1-207`（+41行、検索機能追加）
  - 根拠: `app/reviews/page.tsx:24,30-48,50-58,86-102`

### 5.2 実装済みAPI（route.ts）

#### 変更

- `GET /api/reviews` - レビュー一覧取得
  - v1: 自分のレビューのみ取得（`bookId`パラメータ対応）
  - 現在: 検索クエリパラメータ（`q`）を追加、`searchKeywords`と`comment`で部分一致検索
  - 根拠: `app/api/reviews/route.ts:28,35-42`
  - 関連作業: B（検索機能）

#### 変更なし

- `GET /api/reviews/public` - 公開レビュー一覧取得
  - v1: 既に実装済み（`app/api/reviews/public/route.ts:1-112`）
  - 現在: 変更なし（A作業で使用）

### 5.3 実装済みコンポーネント

#### 追加

- `components/PublicReviewsList.tsx`
  - 機能: 公開レビュー一覧を表示
  - 根拠: `components/PublicReviewsList.tsx:1-134`
  - 関連作業: A（公開レビュー表示機能）

---

## 6. ドキュメントの更新

### 6.1 新規ドキュメント

- `docs/pricing/PRICING_TRUTH.md` - 料金・プラン情報の真実（Single Source of Truth）
- `docs/changes/C_pricing_audit.md` - 料金・プラン情報の整合性監査
- `docs/changes/A_public_reviews_display.md` - 公開レビュー表示機能の実装記録
- `docs/changes/A_public_reviews_display_PRE_INVESTIGATION.md` - 公開レビュー表示機能の事前調査
- `docs/changes/B_search.md` - 検索機能の実装記録
- `docs/changes/B_search_PRE_INVESTIGATION.md` - 検索機能の事前調査

### 6.2 既存ドキュメントの変更

- **なし**
  - 注: `docs/CURRENT_APP_STATUS_AUDIT.md`は上書き更新していない

---

## 7. 統計サマリー

### 7.1 ファイル変更統計

- **新規ファイル**: 6ファイル
  - コンポーネント: 1ファイル (`components/PublicReviewsList.tsx`)
  - ドキュメント: 5ファイル
- **変更ファイル**: 2ファイル
  - 画面: 2ファイル (`app/books/page.tsx`, `app/reviews/page.tsx`)
  - API: 1ファイル (`app/api/reviews/route.ts`)
- **削除ファイル**: 0ファイル

### 7.2 行数差分（概算）

- **追加行数**: 約180行
  - `components/PublicReviewsList.tsx`: 約134行
  - `app/books/page.tsx`: +2行
  - `app/reviews/page.tsx`: +約30行
  - `app/api/reviews/route.ts`: +約10行
  - ドキュメント: 約4,000行（概算）
- **削除行数**: 0行

### 7.3 機能追加統計

- **新規機能**: 2機能
  - 公開レビュー一覧表示（A作業）
  - レビュー検索（B作業）
- **機能拡張**: 0機能
- **機能削除**: 0機能

---

## 8. 関連作業との対応

### 8.1 A作業（公開レビュー表示機能）

- **追加**: `components/PublicReviewsList.tsx`
- **変更**: `app/books/page.tsx`
- **新規ドキュメント**: `docs/changes/A_public_reviews_display.md`, `docs/changes/A_public_reviews_display_PRE_INVESTIGATION.md`

### 8.2 B作業（検索機能）

- **変更**: `app/api/reviews/route.ts`, `app/reviews/page.tsx`
- **新規ドキュメント**: `docs/changes/B_search.md`, `docs/changes/B_search_PRE_INVESTIGATION.md`

### 8.3 C作業（料金・プラン情報の整合性監査）

- **新規ドキュメント**: `docs/pricing/PRICING_TRUTH.md`, `docs/changes/C_pricing_audit.md`
- **解消**: 料金・プラン情報の「単一の正本」を確立

---

**最終更新**: 2026-02-08
