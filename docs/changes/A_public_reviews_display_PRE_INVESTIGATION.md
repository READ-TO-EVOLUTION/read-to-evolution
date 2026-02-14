# 公開レビュー表示機能 - 事前調査結果

**調査日**: 2026-02-08  
**調査方法**: コードベースの事実ベース確認

---

## 1. 本詳細ページの特定

### 調査結果

- **本棚一覧ページ**: `app/books/page.tsx:1-634`
  - URL: `/books`
  - 各書籍カードが表示されている
  - 各カードに書籍情報（タイトル、ステータス、教材数など）が表示されている

- **本詳細ページ**: 存在しない
  - 根拠: `app/books/`配下に`[bookId]`や`[id]`ディレクトリは存在しない（`list_dir`で確認）
  - 削除済みファイルリストに`app/books/[id]/review/page.tsx`が含まれている
  - 本詳細ページ（`/books/[bookId]`）は削除されている可能性が高い

### 判断

本詳細ページが存在しないため、**本棚一覧ページ（`app/books/page.tsx`）の各書籍カードに「みんなのレビュー」セクションを追加**する。

---

## 2. Reviewモデルの公開フラグ（isPublic）

### フィールド定義

- **isPublic** (`prisma/schema.prisma:641`)
  - 型: `Boolean`
  - デフォルト値: `false`（非公開）
  - マッピング: `@map("is_public")`
  - インデックス: 
    - `@@index([bookId, isPublic, hasSpoiler])` (`prisma/schema.prisma:651`)
    - `@@index([isPublic, createdAt])` (`prisma/schema.prisma:652`)

### 利用箇所

- **API: レビュー作成・更新** (`app/api/reviews/route.ts:16,109,137`)
  - Zodスキーマ: `isPublic: z.boolean().default(false)`
  - 作成時: `isPublic: data.isPublic`
  - 更新時: `isPublic: data.isPublic`

- **API: 公開レビュー一覧取得** (`app/api/reviews/public/route.ts:36`)
  - 条件: `isPublic: true`

- **API: レビューサマリー取得** (`app/api/books/[bookId]/review-summary/route.ts:24,36`)
  - 条件: `isPublic: true`

---

## 3. 既存のレビュー取得API

### 候補API一覧

#### 1. `GET /api/reviews/public?bookId=...` ✅ 推奨

- **ファイル**: `app/api/reviews/public/route.ts:1-112`
- **認証**: 不要（未ログインでも閲覧可能）
- **機能**: 公開レビュー一覧取得
- **パラメータ**:
  - `bookId` (必須)
  - `limit` (オプション、デフォルト: 20, 最大: 100)
  - `offset` (オプション、デフォルト: 0)
  - `includeSpoilers` (オプション、デフォルト: false)
- **返却項目**:
  - `reviews`: レビュー配列（`id`, `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `recommendedBooks`, `hasSpoiler`, `createdAt`, `updatedAt`, `user.name`（表示名）, `book`）
  - `pagination`: ページング情報（`total`, `limit`, `offset`, `hasMore`）
- **並び順**: `createdAt: 'desc'`（新しい順）
- **個人情報**: `user.email`は表示名生成に使用されるが、レスポンスには含まれない（`user.name`のみ）

#### 2. `GET /api/reviews?bookId=...` ❌ 不適切

- **ファイル**: `app/api/reviews/route.ts:21-55`
- **認証**: 必須（`requireAuth`）
- **機能**: 自分のレビュー一覧取得（`userId`でフィルタ）
- **判断**: 公開レビュー表示には不適切（自分のレビューのみ）

#### 3. `GET /api/books/[bookId]/review-summary` ❌ 不適切

- **ファイル**: `app/api/books/[bookId]/review-summary/route.ts:1-94`
- **認証**: 必須（`requireAuth`）
- **機能**: レビューサマリー取得（平均評価・件数・抜粋3件）
- **判断**: サマリー用APIのため、一覧表示には不適切

### 選択

**`GET /api/reviews/public?bookId=...`を使用する**

理由:
- 公開レビュー専用API
- 認証不要（本棚一覧ページの表示に適している）
- ページング対応済み
- 個人情報を含まない（`user.name`のみ、`email`は表示名生成に使用されるがレスポンスには含まれない）

---

## 4. 実装方針

### 対象ページ

- **本棚一覧ページ**: `app/books/page.tsx`
- **追加位置**: 各書籍カード内（`ReviewSummaryCard`の下または別セクション）

### 表示要件

- **表示対象**: `isPublic: true`のレビューのみ
- **認証**: 不要（既存APIが認証不要のため）
- **絞り込み**: `bookId`で絞り込み（APIパラメータで指定）
- **取得件数**: デフォルト20件（APIのデフォルト値）
- **並び順**: 新しい順（APIのデフォルト値）
- **個人情報**: 含めない（APIが`user.name`のみ返却、`email`はレスポンスに含まれない）

### 実装内容

1. **新規コンポーネント作成**: `components/PublicReviewsList.tsx`
   - `bookId`をpropsで受け取る
   - `GET /api/reviews/public?bookId=...`を呼び出す
   - レビュー一覧を表示

2. **本棚一覧ページに追加**: `app/books/page.tsx`
   - 各書籍カードに`PublicReviewsList`コンポーネントを追加
   - 表示位置は`ReviewSummaryCard`の下または別セクション

---

**次のステップ**: 実装開始
