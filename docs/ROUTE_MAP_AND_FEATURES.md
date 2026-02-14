# READ TO EVOLUTION - ルートマップ・機能一覧・運営コスト・ユーザーコスト・画面遷移

**作成日**: 2026-02-08  
**目的**: コード根拠（ファイルパス・行番号）つきで機能・コスト・遷移を確定

---

## 1. RouteMap（ルート/画面/API一覧）

### 1.1 画面（Page Routes）

| Route | Type | Auth | DB Access | External | Files |
|-------|------|------|-----------|----------|-------|
| `/` | page | 任意 | `User`, `Book`, `ReadingLog`, `ReviewSchedule`, `ReviewLog` | - | `app/page.tsx:1-217` |
| `/r` | page | なし | `Review` (public only) | - | `app/r/page.tsx:1-265` |
| `/login` | page | なし | - | - | `app/login/page.tsx` |
| `/register` | page | なし | - | - | `app/register/page.tsx` |
| `/books` | page | 必須 | `Book`, `UserBook`, `Review` | - | `app/books/page.tsx:1-663` |
| `/reviews` | page | 必須 | `Review` | - | `app/reviews/page.tsx:1-215` |
| `/gifts` | page | 必須 | `Gift`, `Book`, `AffiliateState` | Stripe | `app/gifts/page.tsx:1-663` |
| `/gifts/[slug]` | page | なし | `Gift`, `Book`, `GiftEvent` | - | `app/gifts/[slug]/page.tsx:1-121` |
| `/gifts/[slug]/analytics` | page | 必須 | `GiftEvent`, `Gift` | - | `app/gifts/[slug]/analytics/page.tsx` |
| `/affiliate/dashboard` | page | 必須 | `GiftEvent`, `AffiliateState` | Stripe | `app/affiliate/dashboard/page.tsx:1-226` |
| `/settings/affiliate` | page | 必須 | `AffiliateState` | - | `app/settings/affiliate/page.tsx` |
| `/settings/character` | page | 必須 | - | - | `app/settings/character/page.tsx` |
| `/revenue-shares` | page | 必須 | `RevenueShare` | - | `app/revenue-shares/page.tsx` |
| `/notifications` | page | 必須 | `Notification` | - | `app/notifications/page.tsx` |
| `/study/today` | page | 必須 | `ReviewSchedule`, `ReviewLog`, `StudyRecord` | - | `app/study/today/page.tsx` |
| `/koyori` | page | 必須 | `KoyoriItem` | - | `app/koyori/page.tsx` |

### 1.2 API Routes

#### 認証系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/auth/login` | POST | なし | `User` | - | `app/api/auth/login/route.ts:12-47` |
| `/api/auth/register` | POST | なし | `User` | - | `app/api/auth/register/route.ts:11-50` |
| `/api/auth/me` | GET | 任意 | `User` | - | `app/api/auth/me/route.ts:5-18` |
| `/api/auth/logout` | POST | なし | - | - | `app/api/auth/logout/route.ts:4-11` |

#### 書籍・本棚系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/books` | GET, POST | 必須 | `Book`, `UserBook`, `ReadingLog`, `Material` | - | `app/api/books/route.ts:18-144` |
| `/api/books/[bookId]` | PUT, DELETE | 必須 | `UserBook` | - | `app/api/books/[bookId]/route.ts:26-140` |
| `/api/books/[bookId]/review-summary` | GET | 必須 | `Review` | - | `app/api/books/[bookId]/review-summary/route.ts:9-80` |
| `/api/user-books` | GET, POST | 必須 | `UserBook`, `Book` | - | `app/api/user-books/route.ts:15-95` |
| `/api/book-search` | GET | 必須 | `Book` | Rakuten API, Amazon PA-API | `app/api/book-search/route.ts:11-101` |
| `/api/book-search/config` | GET | なし | - | - | `app/api/book-search/config/route.ts:8-32` |

#### レビュー系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/reviews` | GET, POST | 必須 | `Review`, `UserBook`, `ReadingProgress`, `OCRAsset`, `ReviewEvolutionLog`, `RevenueShareGateLog` | - | `app/api/reviews/route.ts:33-248` |
| `/api/reviews/[id]` | DELETE | 必須 | `Review` | - | `app/api/reviews/[id]/route.ts:13-37` |
| `/api/reviews/[id]/purchase-click` | POST | 必須 | `Review`, `RevenueShareGateLog` | - | `app/api/reviews/[id]/purchase-click/route.ts:10-72` |
| `/api/reviews/public` | GET | なし | `Review`, `User`, `Book` | - | `app/api/reviews/public/route.ts:9-119` |

#### 読書ログ系（Micro/Meso/Macro）

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/reading-logs` | GET, POST | 必須 | `ReadingLog`, `Book`, `ReadingLogTag`, `Tag` | - | `app/api/reading-logs/route.ts:25-160` |
| `/api/reading-progress` | GET, POST | 必須 | `ReadingProgress`, `UserBook` | - | `app/api/reading-progress/route.ts:16-95` |
| `/api/mesos` | GET, POST | 必須 | `Meso`, `Book`, `ReadingLog` | - | `app/api/mesos/route.ts:22-129` |
| `/api/macros` | GET, POST | 必須 | `Macro`, `Book`, `ReadingLog`, `Meso` | - | `app/api/macros/route.ts:24-183` |
| `/api/snapshots` | GET, POST | 必須 | `PublishedSnapshot`, `ReadingLog`, `ReadingLogTag`, `Meso`, `Macro`, `StudyItem` | - | `app/api/snapshots/route.ts:25-291` |

#### OCR・学習系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/ocr-assets` | GET, POST | 必須 | `OCRAsset`, `UserBook`, `User` | - | `app/api/ocr-assets/route.ts:19-150` |
| `/api/ocr-texts` | GET, POST | 必須 | `OCRText`, `Book` | - | `app/api/ocr-texts/route.ts:19-120` |
| `/api/study-items` | GET, POST | 必須 | `StudyItem`, `Book` | - | `app/api/study-items/route.ts:17-100` |
| `/api/study-items/explanations` | GET | 必須 | `StudyItem` | - | `app/api/study-items/explanations/route.ts:9-60` |
| `/api/study-records` | POST | 必須 | `StudyRecord`, `ReviewSchedule` | - | `app/api/study-records/route.ts:19-70` |
| `/api/study-records/today` | GET | 必須 | `ReviewSchedule`, `ReviewLog`, `StudyRecord` | - | `app/api/study-records/today/route.ts:10-180` |

#### ギフト・アフィリエイト系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/gifts` | GET, POST | 必須 | `Gift`, `Book`, `GiftEvent` | - | `app/api/gifts/route.ts:22-113` |
| `/api/gifts/[id]` | GET | なし | `Gift`, `Book` | - | `app/api/gifts/[id]/route.ts:7-30` |
| `/api/gifts/[id]/events` | POST | なし | `Gift`, `GiftEvent` | - | `app/api/gifts/[id]/events/route.ts:21-60` |
| `/api/gift-events` | GET | 必須 | `GiftEvent`, `Gift`, `Book` | - | `app/api/gift-events/route.ts:10-127` |
| `/api/affiliate/opt-in` | POST | 必須 | `User` | Stripe Checkout | `app/api/affiliate/opt-in/route.ts:16-172` |
| `/api/affiliate/cancel` | POST | 必須 | `User` | Stripe | `app/api/affiliate/cancel/route.ts:10-50` |
| `/api/affiliate/me` | GET | 必須 | `User` | - | `app/api/affiliate/me/route.ts:8-30` |
| `/api/affiliate/state-logs` | GET | 必須 | `AffiliateStateLog` | - | `app/api/affiliate/state-logs/route.ts:8-30` |
| `/api/affiliate/book-links` | POST | 必須 | - | - | `app/api/affiliate/book-links/route.ts:17-60` |
| `/api/revenue-shares` | GET | 必須 | `User`, `RevenueShare` | - | `app/api/revenue-shares/route.ts:9-50` |

#### 外部遷移・計測系

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/out/review/[reviewId]` | GET | なし | `Review`, `RevenueShareGateLog` | Amazon/Rakuten (redirect) | `app/out/review/[reviewId]/route.ts:14-116` |

#### Stripe Webhook

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/stripe/webhook` | POST | Stripe Signature | `User`, `AffiliateStateLog` | Stripe | `app/api/stripe/webhook/route.ts:13-200` |

#### その他

| Route | Methods | Auth | DB Access | External | Files |
|-------|---------|------|-----------|----------|-------|
| `/api/home/stats` | GET | 必須 | `ReviewSchedule`, `ReadingLog`, `Book`, `ReviewLog` | - | `app/api/home/stats/route.ts:12-120` |
| `/api/koyori` | GET, POST | 必須 | `KoyoriItem` | - | `app/api/koyori/route.ts:14-100` |
| `/api/koyori/items/[itemId]` | PUT, DELETE | 必須 | `KoyoriItem` | - | `app/api/koyori/items/[itemId]/route.ts:13-100` |
| `/api/notifications` | GET, POST | 必須 | `Notification` | - | `app/api/notifications/route.ts:7-80` |
| `/api/assets` | POST | 必須 | `Book` | - | `app/api/assets/route.ts:18-60` |
| `/api/location/default` | GET | 必須 | `StudyRecord` | - | `app/api/location/default/route.ts:12-60` |

---

## 2. 機能一覧（ユーザー行動単位）

### 2.1 認証・登録

**機能**: ユーザー登録・ログイン・ログアウト

- **入口画面**: `/login` (`app/login/page.tsx`), `/register` (`app/register/page.tsx`)
- **呼ばれるAPI**:
  - `POST /api/auth/register` (`app/api/auth/register/route.ts:11-50`)
  - `POST /api/auth/login` (`app/api/auth/login/route.ts:12-47`)
  - `POST /api/auth/logout` (`app/api/auth/logout/route.ts:4-11`)
  - `GET /api/auth/me` (`app/api/auth/me/route.ts:5-18`)
- **DBモデル**: `User` (`prisma.user.create`, `prisma.user.findUnique`)
- **外部サービス**: なし
- **根拠**: 
  - `app/api/auth/register/route.ts:17-32` (`prisma.user.findUnique`, `prisma.user.create`)
  - `app/api/auth/login/route.ts:18-30` (`prisma.user.findUnique`)

### 2.2 本検索

**機能**: 楽天・Amazonから書籍を検索し、本棚に追加

- **入口画面**: `/books` (`app/books/page.tsx:54-70`)
- **呼ばれるAPI**:
  - `GET /api/book-search` (`app/api/book-search/route.ts:11-101`)
  - `POST /api/books` (`app/api/books/route.ts:59-144`)
  - `POST /api/user-books` (`app/api/user-books/route.ts:49-95`)
- **DBモデル**: `Book`, `UserBook` (`prisma.book.findMany`, `prisma.book.create`, `prisma.userBook.create`)
- **外部サービス**: 
  - Rakuten Books API (`lib/book-search.ts:24-59`)
  - Amazon PA-API (`lib/book-search.ts:61-150`)
- **根拠**:
  - `app/api/book-search/route.ts:38-52` (`prisma.book.findMany` - 既存書籍検索)
  - `lib/book-search.ts:30-37` (Rakuten API呼び出し)
  - `lib/book-search.ts:88-150` (Amazon PA-API呼び出し)
  - `app/api/books/route.ts:75-112` (`prisma.book.create`, `prisma.userBook.create`)

### 2.3 本棚管理

**機能**: 所有書籍の一覧表示・ステータス更新・削除

- **入口画面**: `/books` (`app/books/page.tsx:1-663`)
- **呼ばれるAPI**:
  - `GET /api/books` (`app/api/books/route.ts:18-56`)
  - `GET /api/user-books` (`app/api/user-books/route.ts:15-47`)
  - `PUT /api/books/[bookId]` (`app/api/books/[bookId]/route.ts:26-100`)
  - `DELETE /api/books/[bookId]` (`app/api/books/[bookId]/route.ts:101-140`)
- **DBモデル**: `Book`, `UserBook`, `ReadingLog`, `Material`
- **外部サービス**: なし
- **根拠**:
  - `app/api/books/route.ts:23-49` (`prisma.book.findMany` with `include`)
  - `app/api/user-books/route.ts:28-46` (`prisma.userBook.findMany`)
  - `app/api/books/[bookId]/route.ts:50-79` (`prisma.userBook.update`)

### 2.4 レビュー作成・更新・公開一覧

**機能**: 書籍へのレビュー投稿・更新・削除、公開レビュー一覧表示

- **入口画面**: 
  - `/reviews` (`app/reviews/page.tsx:1-215`) - 自分のレビュー一覧
  - `/r` (`app/r/page.tsx:1-265`) - 公開レビュー一覧（未ログイン可）
  - `/books` (`app/books/page.tsx`) - レビュー作成フォーム
- **呼ばれるAPI**:
  - `GET /api/reviews` (`app/api/reviews/route.ts:33-77`)
  - `POST /api/reviews` (`app/api/reviews/route.ts:80-248`)
  - `DELETE /api/reviews/[id]` (`app/api/reviews/[id]/route.ts:13-37`)
  - `GET /api/reviews/public` (`app/api/reviews/public/route.ts:9-119`)
- **DBモデル**: 
  - `Review`, `UserBook`, `ReadingProgress`, `OCRAsset`, `ReviewEvolutionLog`, `RevenueShareGateLog`
- **外部サービス**: なし
- **根拠**:
  - `app/api/reviews/route.ts:56-70` (`prisma.review.findMany` with `include`)
  - `app/api/reviews/route.ts:176-237` (`prisma.review.create`, `evaluateRevenueEligibility`, `logRevenueShareGateDecision`)
  - `app/api/reviews/public/route.ts:39-85` (`prisma.review.count`, `prisma.review.findMany` with `select`)
  - `app/api/reviews/[id]/route.ts:23-36` (`prisma.review.delete`)

### 2.5 読書ログ（Micro/Meso/Macro）

**機能**: 読書ログの作成・一覧表示、Meso/Macroの作成・公開Snapshot化

- **入口画面**: `/books` (`app/books/page.tsx`), `/study/today` (`app/study/today/page.tsx`)
- **呼ばれるAPI**:
  - `GET /api/reading-logs` (`app/api/reading-logs/route.ts:25-69`)
  - `POST /api/reading-logs` (`app/api/reading-logs/route.ts:74-160`)
  - `GET /api/mesos` (`app/api/mesos/route.ts:22-58`)
  - `POST /api/mesos` (`app/api/mesos/route.ts:63-129`)
  - `GET /api/macros` (`app/api/macros/route.ts:24-61`)
  - `POST /api/macros` (`app/api/macros/route.ts:66-183`)
  - `GET /api/snapshots` (`app/api/snapshots/route.ts:25-66`)
  - `POST /api/snapshots` (`app/api/snapshots/route.ts:71-291`)
- **DBモデル**: 
  - `ReadingLog`, `ReadingLogTag`, `Tag`, `Meso`, `MesoItem`, `Macro`, `MacroItem`, `PublishedSnapshot`, `SnapshotSource`, `StudyItem`
- **外部サービス**: なし
- **根拠**:
  - `app/api/reading-logs/route.ts:40-57` (`prisma.readingLog.findMany` with `include`)
  - `app/api/reading-logs/route.ts:123-159` (`prisma.readingLog.create`)
  - `app/api/mesos/route.ts:35-51` (`prisma.meso.findMany` with nested `include`)
  - `app/api/macros/route.ts:37-54` (`prisma.macro.findMany` with nested `include`)
  - `app/api/snapshots/route.ts:42-59` (`prisma.publishedSnapshot.findMany` with nested `include`)

### 2.6 Snapshot公開

**機能**: ReadingLog/Meso/MacroをSnapshotとして公開（固定化）

- **入口画面**: `/books` (`app/books/page.tsx`)
- **呼ばれるAPI**: `POST /api/snapshots` (`app/api/snapshots/route.ts:71-291`)
- **DBモデル**: `PublishedSnapshot`, `SnapshotSource`, `ReadingLog`, `Meso`, `Macro`, `StudyItem`
- **外部サービス**: なし
- **根拠**:
  - `app/api/snapshots/route.ts:84-99` (`prisma.readingLog.findFirst` - MICRO)
  - `app/api/snapshots/route.ts:122-157` (`prisma.meso.findFirst` - MESO)
  - `app/api/snapshots/route.ts:159-198` (`prisma.macro.findFirst` - MACRO)
  - `app/api/snapshots/route.ts:245-291` (`prisma.publishedSnapshot.create`)

### 2.7 ギフト作成・閲覧・イベント

**機能**: 書籍をギフトとして共有、閲覧、イベント計測

- **入口画面**: 
  - `/gifts` (`app/gifts/page.tsx:1-663`) - ギフト作成・一覧
  - `/gifts/[slug]` (`app/gifts/[slug]/page.tsx:1-121`) - ギフト公開ページ（未ログイン可）
- **呼ばれるAPI**:
  - `GET /api/gifts` (`app/api/gifts/route.ts:22-48`)
  - `POST /api/gifts` (`app/api/gifts/route.ts:53-113`)
  - `GET /api/gifts/[id]` (`app/api/gifts/[id]/route.ts:7-30`)
  - `POST /api/gifts/[id]/events` (`app/api/gifts/[id]/events/route.ts:21-60`)
  - `GET /api/gift-events` (`app/api/gift-events/route.ts:10-127`)
- **DBモデル**: `Gift`, `Book`, `GiftEvent`
- **外部サービス**: なし（Stripe Checkoutはアフィリエイトopt-in時のみ）
- **根拠**:
  - `app/api/gifts/route.ts:27-41` (`prisma.gift.findMany` with `include`)
  - `app/api/gifts/route.ts:83-95` (`prisma.gift.create` with `include`)
  - `app/api/gifts/[id]/route.ts:14-19` (`prisma.gift.findUnique` with `include`)
  - `app/api/gifts/[id]/events/route.ts:29-42` (`prisma.giftEvent.create`)

### 2.8 外部遷移クリック計測（/out/review）

**機能**: レビュー経由の購入リンククリックを計測し、外部（Amazon/Rakuten）へリダイレクト

- **入口画面**: `/r` (`app/r/page.tsx:221-231`), `/books` (`components/PublicReviewsList.tsx:184-194`)
- **呼ばれるAPI**: `GET /out/review/[reviewId]` (`app/out/review/[reviewId]/route.ts:14-116`)
- **DBモデル**: `Review`, `RevenueShareGateLog`
- **外部サービス**: Amazon/Rakuten (302 redirect)
- **根拠**:
  - `app/out/review/[reviewId]/route.ts:70-78` (`prisma.review.findUnique`)
  - `app/out/review/[reviewId]/route.ts:91-105` (`logRevenueShareGateDecision` → `prisma.revenueShareGateLog.create`)
  - `app/out/review/[reviewId]/route.ts:108` (`NextResponse.redirect`)

### 2.9 アフィリエイトON（opt-in）/Webhook

**機能**: アフィリエイトプランへの加入（Stripe Checkout経由）、Webhook処理

- **入口画面**: 
  - `/affiliate/dashboard` (`app/affiliate/dashboard/page.tsx:87-126`)
  - `/gifts` (`app/gifts/page.tsx:115-150`)
- **呼ばれるAPI**:
  - `POST /api/affiliate/opt-in` (`app/api/affiliate/opt-in/route.ts:16-172`)
  - `POST /api/stripe/webhook` (`app/api/stripe/webhook/route.ts:13-200`)
  - `GET /api/affiliate/me` (`app/api/affiliate/me/route.ts:8-30`)
  - `GET /api/affiliate/state-logs` (`app/api/affiliate/state-logs/route.ts:8-30`)
- **DBモデル**: `User`, `AffiliateStateLog`
- **外部サービス**: 
  - Stripe Checkout (`lib/stripe.ts:19-92`)
  - Stripe Webhook (`app/api/stripe/webhook/route.ts:21-26`)
- **根拠**:
  - `app/api/affiliate/opt-in/route.ts:31-40` (`prisma.user.findUnique` with `select`最小化)
  - `app/api/affiliate/opt-in/route.ts:95-103` (`createAffiliateCheckoutSession` → `stripe.checkout.sessions.create`)
  - `app/api/stripe/webhook/route.ts:53-106` (`checkout.session.completed` → `prisma.user.update`, `logAffiliateStateChange`)
  - `lib/stripe.ts:25-27` (`STRIPE_AFFILIATE_PRICE_ID`)

### 2.10 OCRアセット登録

**機能**: 書籍のOCR画像をアップロード・登録（有料プランのみ）

- **入口画面**: `/books` (`app/books/page.tsx`)
- **呼ばれるAPI**: 
  - `GET /api/ocr-assets` (`app/api/ocr-assets/route.ts:19-85`)
  - `POST /api/ocr-assets` (`app/api/ocr-assets/route.ts:86-150`)
- **DBモデル**: `OCRAsset`, `UserBook`, `User`
- **外部サービス**: なし
- **根拠**:
  - `app/api/ocr-assets/route.ts:109-111` (`plan !== 'FREE'`チェック)
  - `app/api/ocr-assets/route.ts:139-149` (`prisma.oCRAsset.create`)

### 2.11 学習記録・今日のタスク

**機能**: 学習記録の作成、今日の復習タスク表示

- **入口画面**: `/study/today` (`app/study/today/page.tsx`), `/` (`app/page.tsx`)
- **呼ばれるAPI**:
  - `GET /api/study-records/today` (`app/api/study-records/today/route.ts:10-180`)
  - `POST /api/study-records` (`app/api/study-records/route.ts:19-70`)
  - `GET /api/home/stats` (`app/api/home/stats/route.ts:12-120`)
- **DBモデル**: `ReviewSchedule`, `ReviewLog`, `StudyRecord`, `ReadingLog`, `Book`
- **外部サービス**: なし
- **根拠**:
  - `app/api/study-records/today/route.ts:20-57` (`prisma.reviewSchedule.findMany`)
  - `app/api/home/stats/route.ts:22-103` (`prisma.reviewSchedule.count`, `prisma.readingLog.findMany`)

---

## 3. 運営コスト要因マップ（機能→要因）

### 3.1 DB Read/Write回数（1アクションあたり）

| 機能 | Read回数 | Write回数 | 根拠 |
|------|----------|-----------|------|
| レビュー作成 | 3-4 | 2-3 | `app/api/reviews/route.ts:90-237` (`UserBook.findFirst`, `Review.findFirst`, `Review.create`, `OCRAsset.update`, `evaluateRevenueEligibility` → `User.findUnique`, `logRevenueShareGateDecision` → `RevenueShareGateLog.create`) |
| レビュー公開一覧取得 | 2 | 0 | `app/api/reviews/public/route.ts:39-85` (`Review.count`, `Review.findMany`) |
| 外部遷移クリック | 1 | 1 | `app/out/review/[reviewId]/route.ts:70-105` (`Review.findUnique`, `RevenueShareGateLog.create`) |
| ギフト作成 | 2-3 | 2 | `app/api/gifts/route.ts:62-114` (`Book.findFirst`, `Gift.findUnique` (重複チェック), `Gift.create`, `GiftEvent.create`) |
| Snapshot作成（MICRO） | 3-4 | 2-3 | `app/api/snapshots/route.ts:84-291` (`ReadingLog.findFirst`, `ReadingLogTag.findMany`, `PublishedSnapshot.create`, `SnapshotSource.create` × N) |
| Snapshot作成（MESO） | 2-3 | 2-3 | `app/api/snapshots/route.ts:122-291` (`Meso.findFirst`, `PublishedSnapshot.create`, `SnapshotSource.create` × N) |
| Snapshot作成（MACRO） | 3-4 | 2-3 | `app/api/snapshots/route.ts:159-291` (`Macro.findFirst`, `ReadingLog.findMany`, `Meso.findMany`, `PublishedSnapshot.create`, `SnapshotSource.create` × N) |
| アフィリエイトopt-in | 1-2 | 1-2 | `app/api/affiliate/opt-in/route.ts:31-172` (`User.findUnique`, `User.update` or `User.updateMany`) |
| Stripe Webhook | 1-2 | 2-3 | `app/api/stripe/webhook/route.ts:73-116` (`User.findUnique`, `User.update`, `logAffiliateStateChange` → `AffiliateStateLog.create`) |

### 3.2 Eventログの増え方

| 機能 | 1アクションあたりのログ行数 | 根拠 |
|------|---------------------------|------|
| レビュー作成（公開） | 1 | `app/api/reviews/route.ts:224-237` (`RevenueShareGateLog.create`) |
| レビュー更新（公開） | 1 | `app/api/reviews/route.ts:156-169` (`RevenueShareGateLog.create`) |
| 外部遷移クリック | 1 | `app/out/review/[reviewId]/route.ts:91-105` (`RevenueShareGateLog.create`) |
| ギフト作成 | 1 | `app/api/gifts/route.ts:98-103` (`GiftEvent.create` with `type: 'GIFT_CREATED'`) |
| ギフト閲覧 | 1 | `app/api/gifts/[id]/events/route.ts:42-48` (`GiftEvent.create` with `type: 'GIFT_OPENED'`) |
| ギフト外部クリック | 1 | `app/api/gifts/[id]/events/route.ts:42-48` (`GiftEvent.create` with `type: 'OUTBOUND_CLICKED'`) |
| アフィリエイト状態変更 | 1 | `lib/affiliate.ts:74-83` (`AffiliateStateLog.create`) |

### 3.3 外部APIコール

| 機能 | 外部API | 1アクションあたりのコール数 | 根拠 |
|------|---------|---------------------------|------|
| 書籍検索（楽天） | Rakuten Books API | 1 | `lib/book-search.ts:30-37` (`fetch` to Rakuten API) |
| 書籍検索（Amazon） | Amazon PA-API | 1 | `lib/book-search.ts:88-150` (`SignatureV4` signed request) |
| アフィリエイトopt-in | Stripe Checkout | 1（新規作成時） | `lib/stripe.ts:45-92` (`stripe.checkout.sessions.create`) |
| Stripe Webhook | Stripe API | 1（イベントごと） | `app/api/stripe/webhook/route.ts:21-26` (`stripe.webhooks.constructEvent`) |

### 3.4 ストレージ増（画像/OCR/音声等）

| 機能 | ストレージ増加要因 | 根拠 |
|------|------------------|------|
| OCRアセット登録 | 画像ファイル（`OCRAsset.imageUrl`） | `app/api/ocr-assets/route.ts:139-149` (`prisma.oCRAsset.create`) |
| 書籍登録 | カバー画像（`Book.coverImageUrl`） | `app/api/books/route.ts:85-95` (`prisma.book.create`) |

### 3.5 増加で効く理由（重いクエリ候補）

| 機能 | 重いクエリ候補 | 理由 | 根拠 |
|------|--------------|------|------|
| レビュー公開一覧 | `Review.findMany` with nested `include` | `user`, `book`を含むため | `app/api/reviews/public/route.ts:44-85` |
| Snapshot作成（MACRO） | `Macro.findMany` → `ReadingLog.findMany` → `Meso.findMany` | ネストした`include`が深い | `app/api/snapshots/route.ts:159-198` |
| ギフト一覧 | `Gift.findMany` with `include: { book, events }` | `events`が最大10件含まれる | `app/api/gifts/route.ts:27-41` |
| 本棚一覧 | `Book.findMany` with nested `include` | `materials`, `readingLogs`を含む | `app/api/books/route.ts:23-49` |

---

## 4. ユーザーコスト（課金/プラン）

### 4.1 プラン体系

| プラン | `User.plan` | `User.affiliatePlanType` | `User.affiliateState` | 料金 | 根拠 |
|--------|-------------|-------------------------|----------------------|------|------|
| 無料プラン | `FREE` | `NONE` | `OFF` | 0円 | `prisma/schema.prisma:20-22` |
| アフィリエイトプラン | `FREE` | `AFFILIATE_SUB` | `ON` | 300円/月 | `lib/stripe.ts:25` (`STRIPE_AFFILIATE_PRICE_ID`) |
| 勉強コース | `STUDY` | `STUDY_SUB` | `ON`（自動） | 冊数制（追加料金なし） | `app/api/affiliate/opt-in/route.ts:49-72` |

### 4.2 プラン定義箇所

- **`User.plan`**: `prisma/schema.prisma:20` (`plan String @default("FREE") // FREE, AFFILIATE, STUDY`)
- **`User.affiliatePlanType`**: `prisma/schema.prisma:22` (`affiliatePlanType String @default("NONE") // NONE, AFFILIATE_SUB, STUDY_SUB`)
- **`User.affiliateState`**: `prisma/schema.prisma:21` (`affiliateState String @default("OFF") // OFF, ON, SUSPENDED`)

### 4.3 Stripe Price ID

- **`STRIPE_AFFILIATE_PRICE_ID`**: `lib/stripe.ts:25` (`process.env.STRIPE_AFFILIATE_PRICE_ID`)
  - 使用箇所: `lib/stripe.ts:45-92` (`stripe.checkout.sessions.create`)

### 4.4 報酬ゲート判定

- **条件**: `plan !== 'FREE' || affiliateState === 'ON'` (`lib/revenue-share.ts:33`)
- **根拠**: `lib/revenue-share.ts:23-40` (`evaluateRevenueEligibility`)

### 4.5 勉強コースプラン用Stripe Price ID

- **未実装**: 勉強コースプラン用のStripe Price ID設定は存在しない
- **根拠**: `lib/stripe.ts`には`STRIPE_AFFILIATE_PRICE_ID`のみ存在

---

## 5. 画面遷移図

```mermaid
flowchart TD
    Start([未ログインユーザー]) --> Home1[/]
    Home1 --> PublicReviews[/r<br/>公開レビュー一覧]
    Home1 --> Login[/login]
    Home1 --> Register[/register]
    
    Login --> Home2[/<br/>ホーム画面]
    Register --> Home2
    
    Home2 --> Books[/books<br/>本棚]
    Home2 --> Reviews[/reviews<br/>自分のレビュー]
    Home2 --> StudyToday[/study/today<br/>今日のタスク]
    
    Books --> BookSearch[書籍検索]
    BookSearch -->|POST /api/book-search| RakutenAPI[Rakuten API]
    BookSearch -->|POST /api/book-search| AmazonAPI[Amazon PA-API]
    BookSearch -->|POST /api/books| AddBook[本棚に追加]
    
    Books --> ReviewForm[レビュー作成フォーム]
    ReviewForm -->|POST /api/reviews| CreateReview[レビュー作成]
    CreateReview -->|evaluateRevenueEligibility| RevenueGate[報酬ゲート判定]
    RevenueGate -->|logRevenueShareGateDecision| GateLog[RevenueShareGateLog作成]
    
    PublicReviews -->|GET /api/reviews/public| PublicReviewsAPI[公開レビュー取得]
    PublicReviews -->|GET /out/review/[reviewId]| OutboundClick[外部遷移クリック]
    OutboundClick -->|logRevenueShareGateDecision| ClickLog[RevenueShareGateLog作成]
    OutboundClick -->|302 redirect| Amazon[Amazon/Rakuten]
    
    Books --> ReadingLog[読書ログ作成]
    ReadingLog -->|POST /api/reading-logs| CreateMicro[Micro作成]
    CreateMicro -->|POST /api/mesos| CreateMeso[Meso作成]
    CreateMeso -->|POST /api/macros| CreateMacro[Macro作成]
    CreateMacro -->|POST /api/snapshots| CreateSnapshot[Snapshot公開]
    
    Home2 --> Gifts[/gifts<br/>ギフト作成]
    Gifts -->|POST /api/gifts| CreateGift[ギフト作成]
    CreateGift -->|GiftEvent.create| GiftCreatedLog[GiftEvent作成]
    Gifts -->|GET /api/gifts/[id]| GiftPage[/gifts/[slug]<br/>ギフト公開ページ]
    GiftPage -->|POST /api/gifts/[id]/events| GiftEventLog[GiftEvent記録]
    
    Home2 --> AffiliateDashboard[/affiliate/dashboard<br/>アフィリエイトダッシュボード]
    AffiliateDashboard -->|POST /api/affiliate/opt-in| OptIn[アフィリエイトopt-in]
    OptIn -->|createAffiliateCheckoutSession| StripeCheckout[Stripe Checkout]
    StripeCheckout -->|checkout.session.completed| StripeWebhook[/api/stripe/webhook]
    StripeWebhook -->|prisma.user.update| UpdateAffiliateState[アフィリエイト状態更新]
    StripeWebhook -->|logAffiliateStateChange| AffiliateStateLog[AffiliateStateLog作成]
    
    AffiliateDashboard -->|GET /api/gift-events| GiftEventsAPI[GiftEvent取得]
    GiftEventsAPI -->|KPI計算| KPIDisplay[KPI表示]
    
    style Home1 fill:#e1f5ff
    style Home2 fill:#e1f5ff
    style PublicReviews fill:#fff4e1
    style OutboundClick fill:#ffe1e1
    style StripeCheckout fill:#e1ffe1
    style StripeWebhook fill:#e1ffe1
```

### 5.1 主要導線の根拠

1. **Home → 公開レビュー一覧**
   - `app/page.tsx:115-120` (`Link` to `/r`)
   - `app/r/page.tsx:52` (`fetch('/api/reviews/public')`)

2. **公開レビュー → 外部遷移**
   - `app/r/page.tsx:224` (`href="/out/review/${review.id}"`)
   - `app/out/review/[reviewId]/route.ts:108` (`NextResponse.redirect`)

3. **ギフト作成 → 公開ページ**
   - `app/gifts/page.tsx:256` (`giftUrl = /gifts/${data.gift.slug}`)
   - `app/gifts/[slug]/page.tsx:35` (`fetch('/api/gifts/${giftToken}')`)

4. **アフィリエイトopt-in → Stripe → Webhook**
   - `app/affiliate/dashboard/page.tsx:89-96` (`POST /api/affiliate/opt-in`)
   - `app/api/affiliate/opt-in/route.ts:95-103` (`createAffiliateCheckoutSession`)
   - `app/api/stripe/webhook/route.ts:53-106` (`checkout.session.completed`)

5. **レビュー作成 → 報酬ゲート判定**
   - `app/api/reviews/route.ts:224-237` (`evaluateRevenueEligibility`, `logRevenueShareGateDecision`)

---

## 6. まとめ

### 6.1 主要機能数
- **画面**: 16ページ
- **API**: 42エンドポイント
- **DBモデル**: 20+モデル（`User`, `Book`, `Review`, `ReadingLog`, `Meso`, `Macro`, `Gift`, `GiftEvent`, `RevenueShare`, `RevenueShareGateLog`, `AffiliateStateLog`, `OCRAsset`, `StudyItem`, `StudyRecord`, `ReviewSchedule`, `ReviewLog`, `PublishedSnapshot`, `Notification`, `KoyoriItem`, `UserBook`, `Material`, `Tag`, `ReadingLogTag`, `MesoItem`, `MacroItem`, `SnapshotSource`）

### 6.2 外部サービス統合
- **Stripe**: Checkout Session作成、Webhook処理
- **Rakuten Books API**: 書籍検索
- **Amazon PA-API**: 書籍検索（署名付きリクエスト）

### 6.3 運営コスト要因の優先度
1. **高**: Eventログ（`RevenueShareGateLog`, `GiftEvent`, `AffiliateStateLog`）の増加
2. **中**: DB Read（特に`include`が多いクエリ）
3. **低**: 外部APIコール（書籍検索はユーザーアクション時のみ）

### 6.4 ユーザーコスト
- **無料プラン**: 0円（機能制限あり）
- **アフィリエイトプラン**: 300円/月（`STRIPE_AFFILIATE_PRICE_ID`）
- **勉強コース**: 冊数制（追加料金なし、アフィリエイト自動ON）

---

**最終更新**: 2026-02-08  
**作成者**: AI Assistant  
**根拠**: コードベース全体の走査結果（推測なし）
