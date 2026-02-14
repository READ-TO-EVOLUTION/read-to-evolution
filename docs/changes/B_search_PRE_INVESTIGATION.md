# 検索機能 - 事前調査結果

**調査日**: 2026-02-08  
**調査方法**: コードベースの事実ベース確認

---

## 1. 既存の検索UI・検索ページ・検索API

### 検索UI

#### 1. `BookSearchInput` (`components/BookSearchInput.tsx:1-294`)
- **性質**: 外部検索（楽天・Amazon）が主目的
- **機能**:
  - 外部API検索（楽天・Amazon）
  - 既存書籍も検索結果に含める機能あり（`includeExisting`）
  - 内部検索としては、ユーザーが所有する書籍のみを検索（`readingLogs`で紐付け）
- **使用箇所**:
  - `app/books/page.tsx:463` - 書籍登録時の検索
  - `app/gifts/page.tsx:350` - ギフト送信時の書籍選択
  - `components/koyori/KoyoriAddItemModal.tsx:191` - こより追加時の書籍選択

#### 2. クライアント側検索フィルタ (`app/books/page.tsx:185-197`)
- **位置**: 本棚一覧ページ（`/books`）
- **機能**: タイトル・著者・出版社で部分一致検索（クライアント側フィルタリング）
- **実装**: `useMemo`で`userBooks`をフィルタリング

### 検索ページ

- **レビューページ** (`app/reviews/page.tsx:1-166`)
  - URL: `/reviews`
  - 機能: 自分のレビュー一覧表示（検索機能なし）

### 検索API

#### 1. `GET /api/book-search` (`app/api/book-search/route.ts:1-100`)
- **性質**: 外部検索（楽天・Amazon）+ 既存書籍検索
- **認証**: 必須（`getCurrentUser`）
- **パラメータ**:
  - `q` (必須): 検索クエリ
  - `providers` (オプション): プロバイダー指定（`RAKUTEN,AMAZON`）
  - `includeExisting` (オプション): 既存書籍を含めるか（デフォルト: `true`）
- **検索対象**: 
  - 既存書籍: `title`, `author`で部分一致（`contains`）
  - 外部API: 楽天・Amazon

#### 2. `GET /api/ocr-texts?search=...` (`app/api/ocr-texts/route.ts:43-46`)
- **認証**: 必須（`requireAuth`）
- **パラメータ**:
  - `bookId` (必須)
  - `search` (オプション): 検索キーワード
- **検索方式**: Prisma `contains`（部分一致）
- **検索対象**: `OcrText.text`

#### 3. `GET /api/study-items/explanations?keyword=...` (`app/api/study-items/explanations/route.ts:16-60`)
- **認証**: 必須（`requireAuth`）
- **パラメータ**:
  - `bookId` (オプション)
  - `keyword` (オプション): キーワード検索
- **検索方式**: クライアント側フィルタリング（`toLowerCase().includes()`）
- **検索対象**: `StudyItem.explanationText`, `StudyItem.promptText`

---

## 2. BookSearchInputの性質

### 外部検索か内部検索か

**結論: 外部検索（楽天・Amazon）が主目的**

根拠:
- `components/BookSearchInput.tsx:27-28`: コメントに「書籍検索入力コンポーネント」と記載
- `app/api/book-search/route.ts:7-8`: コメントに「楽天・Amazonから書籍候補を取得」と記載
- `components/BookSearchInput.tsx:74-83`: 外部API検索を実行
- `app/books/page.tsx:461`: UIに「書籍を検索（楽天・Amazon）」と表示

内部検索機能:
- `app/api/book-search/route.ts:36-68`: 既存書籍も検索結果に含める機能あり
- ただし、ユーザーが所有する書籍のみ（`readingLogs`で紐付け）

---

## 3. 検索対象候補と検索可能フィールド

### Book
- **検索可能フィールド**: `title`, `author`
- **既存実装**: 
  - `app/api/book-search/route.ts:46-47`: `title`, `author`で部分一致（`contains`）
  - `app/books/page.tsx:185-197`: クライアント側フィルタリング（タイトル・著者・出版社）

### Review
- **検索可能フィールド**: `searchKeywords`, `comment`
- **既存実装**: なし（検索機能なし）
- **フィールド定義**: 
  - `searchKeywords` (`prisma/schema.prisma:641`): `String?`
  - `comment` (`prisma/schema.prisma:640`): `String?`
- **表示**: `app/reviews/page.tsx:140-144` で`searchKeywords`を表示

### ReadingLog
- **検索可能フィールド**: `pointText`, `reaction`, `questionText`, `privateMemo`, `highlightText`
- **既存実装**: なし（検索機能なし）
- **フィールド定義** (`prisma/schema.prisma:109-167`):
  - `pointText`: `String`
  - `reaction`: `String`
  - `questionText`: `String?`
  - `privateMemo`: `String?`
  - `highlightText`: `String?`

### Meso
- **検索可能フィールド**: `title`, `description`
- **既存実装**: なし（検索機能なし）
- **フィールド定義** (`prisma/schema.prisma:759-775`):
  - `title`: `String`
  - `description`: `String?`

### Macro
- **検索可能フィールド**: `title`, `content`
- **既存実装**: なし（検索機能なし）
- **フィールド定義** (`prisma/schema.prisma:790-806`):
  - `title`: `String`
  - `content`: `String`

### OcrText
- **検索可能フィールド**: `text`
- **既存実装**: あり
  - `app/api/ocr-texts/route.ts:43-46`: `text`で部分一致（`contains`）

---

## 4. 既存の導線（UI/ページ）

### 本棚一覧ページ (`/books`)
- **ファイル**: `app/books/page.tsx`
- **機能**: 
  - クライアント側検索フィルタ（タイトル・著者・出版社）
  - ステータスフィルタ
  - 並び替え
- **検索UI**: 検索ボックス（`searchQuery` state）

### レビューページ (`/reviews`)
- **ファイル**: `app/reviews/page.tsx`
- **機能**: 自分のレビュー一覧表示
- **検索UI**: なし

---

## 5. 実装方針（最小スコープ）

### 推奨: レビューページに検索機能を追加

**理由**:
1. 既存の導線（`/reviews`）が存在
2. レビューページには検索機能がない（追加が自然）
3. Reviewモデルには`searchKeywords`フィールドが存在（検索用途の可能性）
4. 最小スコープ: 1画面（`app/reviews/page.tsx`）+ 1API（`app/api/reviews/route.ts`のGET拡張）+ 1対象（Review）

### 実装内容

1. **API拡張**: `GET /api/reviews?q=...`
   - 既存の`GET /api/reviews`に`q`パラメータを追加
   - `searchKeywords`と`comment`で部分一致検索（Prisma `contains`）

2. **UI追加**: `app/reviews/page.tsx`
   - 検索ボックスを追加
   - `q`パラメータでAPIを呼び出す

### 検索方式

- **Prisma `contains`**を使用（既存実装に合わせる）
- SQLite対応（大文字小文字区別なし、部分一致）

---

**次のステップ**: 実装開始
