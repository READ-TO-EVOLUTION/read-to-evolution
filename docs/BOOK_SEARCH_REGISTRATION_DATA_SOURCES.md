# 本の検索・登録における参照元データ（実装事実のみ）

**作成日**: 2026-01-xx  
**目的**: 実装されているコードに基づく参照元データの列挙（推測禁止）

---

## ① 本の検索機能

### 検索機能の存在確認

**結論**: ✅ **実装済み**

**実装ファイル**:
- `app/api/book-search/route.ts` - 検索APIエンドポイント
- `components/BookSearchInput.tsx` - 検索UIコンポーネント
- `lib/book-search.ts` - 外部API呼び出しライブラリ

---

### 検索対象のデータソース（実装事実）

#### 1. 内部DB（既存書籍検索）

**参照元の種類**: 内部DB  
**参照している具体箇所**:
- ファイル: `app/api/book-search/route.ts`
- 関数: `GET` 関数内（38-52行目）
- モデル: `prisma.book`（Prisma ORM）

**参照タイミング**: 検索時（`includeExisting !== false` の場合）

**使用しているフィールド**:
- `title` - 部分一致検索（`contains`）
- `author` - 部分一致検索（`contains`）

**検索条件**:
```typescript
// app/api/book-search/route.ts:38-52
const existingBooks = await prisma.book.findMany({
  where: {
    readingLogs: {
      some: {
        userId,  // そのユーザーが所有する書籍のみ
      },
    },
    OR: [
      { title: { contains: query.trim() } },
      { author: { contains: query.trim() } },
    ],
  },
  take: 10,
  orderBy: { updatedAt: 'desc' },
})
```

**根拠**: `app/api/book-search/route.ts:38-52`

---

#### 2. 外部API（楽天書籍検索API）

**参照元の種類**: 外部API  
**参照している具体箇所**:
- ファイル: `lib/book-search.ts`
- 関数: `searchRakutenBooks(query: string)`
- APIエンドポイント: `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404`

**参照タイミング**: 検索時（`providers` に `'RAKUTEN'` が含まれる場合）

**使用しているフィールド**:
- リクエスト: `title` パラメータ（検索クエリ）
- レスポンス: `item.Item.title`, `item.Item.author`, `item.Item.isbn`, `item.Item.largeImageUrl`, `item.Item.publisherName`, `item.Item.salesDate`, `item.Item.itemCode`, `item.Item.itemUrl`

**環境変数依存**:
- `RAKUTEN_APPLICATION_ID` - 必須（未設定の場合はエラー）

**実装コード**:
```typescript
// lib/book-search.ts:24-59
export async function searchRakutenBooks(query: string): Promise<BookSearchResult[]> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID
  if (!applicationId) {
    throw new Error('RAKUTEN_APPLICATION_ID is not set')
  }
  // ... API呼び出し
}
```

**根拠**: `lib/book-search.ts:24-59`

---

#### 3. 外部API（Amazon Product Advertising API 5.0）

**参照元の種類**: 外部API  
**参照している具体箇所**:
- ファイル: `lib/book-search.ts`
- 関数: `searchAmazonBooks(query: string)`
- APIエンドポイント: `https://webservices.amazon.co.jp/paapi5/searchitems`

**参照タイミング**: 検索時（`providers` に `'AMAZON'` が含まれる場合）

**使用しているフィールド**:
- リクエスト: `Keywords` パラメータ（検索クエリ）
- レスポンス: `ItemInfo.Title.DisplayValue`, `ItemInfo.ByLineInfo.Authors`, `ItemInfo.ExternalIds.ISBNs`, `ItemInfo.ContentInfo.PublicationDate`, `ItemInfo.ContentInfo.Publisher`, `Images.Primary.Large.URL`, `ASIN`

**環境変数依存**:
- `AMAZON_PAAPI_ACCESS_KEY` - 必須
- `AMAZON_PAAPI_SECRET_KEY` - 必須
- `AMAZON_PAAPI_PARTNER_TAG` - 必須
- `AMAZON_PAAPI_REGION` - オプション（デフォルト: `us-west-2`）

**実装コード**:
```typescript
// lib/book-search.ts:76-189
export async function searchAmazonBooks(query: string): Promise<BookSearchResult[]> {
  // ... 署名付きリクエストの構築と送信
}
```

**根拠**: `lib/book-search.ts:76-189`

---

### 検索機能の統合処理

**ファイル**: `app/api/book-search/route.ts`

**処理フロー**:
1. 既存書籍検索（内部DB） - `includeExisting !== false` の場合
2. 外部API検索（楽天・Amazon） - `providers.length > 0` の場合
3. 結果をマージして返す

**根拠**: `app/api/book-search/route.ts:36-83`

---

## ② 本の登録機能

### 登録機能の存在確認

**結論**: ✅ **実装済み**

**実装ファイル**:
- `app/api/books/route.ts` - 登録APIエンドポイント（`POST`）
- `app/books/page.tsx` - 登録UI

---

### 書名の取得元（実装事実）

#### 1. ユーザー入力（手動入力）

**書名の入力元**: ユーザー入力  
**参照している具体箇所**:
- ファイル: `app/books/page.tsx`
- 関数: `handleCreateBook`
- 状態: `newBookTitle`（useState）

**参照タイミング**: 登録時（手動入力モード）

**実装コード**:
```typescript
// app/books/page.tsx:100-126
const handleCreateBook = async (e: React.FormEvent) => {
  e.preventDefault()
  // ...
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newBookTitle }),  // ユーザー入力値
  })
}
```

**根拠**: `app/books/page.tsx:100-126`

---

#### 2. 外部APIレスポンス（検索結果から選択）

**書名の入力元**: 外部APIレスポンス  
**参照している具体箇所**:
- ファイル: `app/books/page.tsx`
- 関数: `handleSelectBook`
- パラメータ: `book: BookSearchResult`（検索結果オブジェクト）

**参照タイミング**: 登録時（検索モードで結果を選択した場合）

**データフロー**:
1. `components/BookSearchInput.tsx` で検索実行
2. 検索結果（`BookSearchResult`）から選択
3. `handleSelectBook` で `book.title` を取得
4. `POST /api/books` に送信

**実装コード**:
```typescript
// app/books/page.tsx:129-161
const handleSelectBook = async (book: BookSearchResult) => {
  // ...
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: book.title,  // 検索結果から取得
      author: book.author,
      isbn13: book.isbn13,
      // ...
    }),
  })
}
```

**根拠**: `app/books/page.tsx:129-161`

**検索結果の出所**:
- 楽天API: `lib/book-search.ts:searchRakutenBooks` → `book.title`（`item.Item.title`）
- Amazon API: `lib/book-search.ts:searchAmazonBooks` → `book.title`（`item.ItemInfo.Title.DisplayValue`）
- 既存DB: `app/api/book-search/route.ts:38-52` → `book.title`（`book.title`）

---

#### 3. DB保存処理

**参照元の種類**: 内部DB（保存先）  
**参照している具体箇所**:
- ファイル: `app/api/books/route.ts`
- 関数: `POST` 関数内（101-111行目）
- モデル: `prisma.book`（Prisma ORM）

**参照タイミング**: 登録時（APIリクエスト受信後）

**保存するフィールド**:
- `title` - 必須（リクエストボディから取得）
- `author` - オプション
- `isbn13` - オプション
- `publisher` - オプション
- `publishedDate` - オプション
- `coverImageUrl` - オプション

**実装コード**:
```typescript
// app/api/books/route.ts:101-111
const book = await prisma.book.create({
  data: {
    userId,
    title,  // リクエストボディから取得
    author: author || undefined,
    isbn13: isbn13 || undefined,
    publisher: publisher || undefined,
    publishedDate: publishedDate ? new Date(publishedDate) : undefined,
    coverImageUrl: coverImageUrl || undefined,
  },
})
```

**根拠**: `app/api/books/route.ts:101-111`

---

## ③ 検索・登録の統合フロー

### UI側の実装

**ファイル**: `app/books/page.tsx`

**2つの登録モード**:
1. **手動入力モード**: `useSearch = false`
   - ユーザーが `newBookTitle` に入力
   - `handleCreateBook` で登録

2. **検索モード**: `useSearch = true`
   - `BookSearchInput` コンポーネントで検索
   - 検索結果から選択
   - `handleSelectBook` で登録

**根拠**: `app/books/page.tsx:221-289`

---

## ④ 環境変数による制御

### 外部API有効化判定

**ファイル**: `app/api/book-search/config/route.ts`

**判定ロジック**:
- 楽天: `process.env.RAKUTEN_APPLICATION_ID` が存在するか
- Amazon: `process.env.AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, `AMAZON_PAAPI_PARTNER_TAG` がすべて存在するか

**根拠**: `app/api/book-search/config/route.ts:14-19`

---

## ⑤ まとめ表

| 機能 | 参照元の種類 | 参照箇所 | 参照タイミング | 書名の入力元 | 根拠ファイル |
|------|------------|---------|--------------|------------|------------|
| **検索（既存DB）** | 内部DB | `app/api/book-search/route.ts:38-52` | 検索時 | DB内の既存データ | `app/api/book-search/route.ts` |
| **検索（楽天API）** | 外部API | `lib/book-search.ts:24-59` | 検索時 | APIレスポンス | `lib/book-search.ts` |
| **検索（Amazon API）** | 外部API | `lib/book-search.ts:76-189` | 検索時 | APIレスポンス | `lib/book-search.ts` |
| **登録（手動入力）** | ユーザー入力 | `app/books/page.tsx:100-126` | 登録時 | ユーザー入力 | `app/books/page.tsx` |
| **登録（検索結果選択）** | 外部APIレスポンス | `app/books/page.tsx:129-161` | 登録時 | 検索結果から取得 | `app/books/page.tsx` |
| **登録（DB保存）** | 内部DB | `app/api/books/route.ts:101-111` | 登録時 | リクエストボディ | `app/api/books/route.ts` |

---

## ⑥ 未実装・該当なし項目

### 静的データ（固定データ）

**結論**: **該当実装なし**

- 固定の書籍リストやマスターデータからの選択機能は実装されていない

### 既存DBからの選択（登録時）

**結論**: **該当実装なし**

- 登録時に既存DBから書籍を選択する機能は実装されていない
- 検索結果には既存書籍も含まれるが、それは「検索結果として表示」であり、「既存DBから選択して登録」ではない

---

## ⑦ 検証方法

### 検索機能の動作確認

1. **既存DB検索**: `GET /api/book-search?q=検索語&includeExisting=true`
2. **楽天API検索**: `GET /api/book-search?q=検索語&providers=RAKUTEN`（環境変数設定必要）
3. **Amazon API検索**: `GET /api/book-search?q=検索語&providers=AMAZON`（環境変数設定必要）

### 登録機能の動作確認

1. **手動入力**: `app/books/page.tsx` で手動入力モードを選択し、`title` を入力
2. **検索結果選択**: `app/books/page.tsx` で検索モードを選択し、検索結果から選択

---

## 参照ファイル一覧

### 検索関連
- `app/api/book-search/route.ts` - 検索API
- `app/api/book-search/config/route.ts` - 外部API有効化判定
- `lib/book-search.ts` - 外部API呼び出しライブラリ
- `components/BookSearchInput.tsx` - 検索UIコンポーネント

### 登録関連
- `app/api/books/route.ts` - 登録API
- `app/books/page.tsx` - 登録UI

### データモデル
- `prisma/schema.prisma` - `Book` モデル定義
