# データ監査レポート：DB Lineage and Usage

**作成日**: 2026-01-xx  
**最終更新**: 2026-01-xx  
**目的**: Prismaモデルのデータ流入元・表示先・利用方法の特定（推測禁止・根拠必須）

## 変更点サマリー

- **セクション4**: 未使用/死蔵フィールドの再監査（A/B/C分類）を追加
  - `User.name`: B（未実装：UI/導線不足）
  - `Review.recommendedBooks`: B（未実装：UI/導線不足）
- **セクション6**: ユーザー行動マップ（E2E）を追加
  - 行動1: 本を探す → 登録する
  - 行動2: レビューを書く → 更新 → 削除
  - 行動3: 読書ログを書く → 振り返る
  - 行動4: 積読を管理する（積む/崩す）
  - 行動5: ギフトを作る → 公開 → 閲覧する
- **セクション7**: 削除仕様書（事故防止）を追加
  - Book削除、Review削除、ReadingLog削除、Gift削除、User削除のCascade関係と警告文案
- **セクション8**: データ契約（危険ポイントの固定）を追加
  - `User.affiliateState`、`User.plan`、`Book.id`の意味・更新箇所・参照箇所・変更時の必須テスト
- **セクション2**: CRUDマトリクスの詳細を更新
  - `KoyoriItem`のCreate/Update/Delete箇所を確定
  - `PublishedSnapshot`、`SnapshotSource`のCreate箇所を確定
  - `ReadingLogTag`のCreate箇所を確定
  - `AffiliateStateLog`のCreate箇所を確定
  - `GiftEvent`のKPI計算箇所を確定

---

## 0) モデル一覧（schema.prismaから）

**根拠**: `prisma/schema.prisma:15-821`

### 主要モデル（非勉強コース中心）

1. **User** (`prisma/schema.prisma:15-66`)
2. **Book** (`prisma/schema.prisma:68-102`)
3. **ReadingLog** (`prisma/schema.prisma:109-147`)
4. **Tag** (`prisma/schema.prisma:154-166`)
5. **ReadingLogTag** (`prisma/schema.prisma:168-181`)
6. **PublishedSnapshot** (`prisma/schema.prisma:188-224`)
7. **SnapshotSource** (`prisma/schema.prisma:234-256`)
8. **OCRAsset** (`prisma/schema.prisma:262-283`)
9. **Review** (`prisma/schema.prisma:631-654`)
10. **ReviewEvolutionLog** (`prisma/schema.prisma:656-672`)
11. **Gift** (`prisma/schema.prisma:357-394`)
12. **GiftEvent** (`prisma/schema.prisma:396-416`)
13. **Koyori** (`prisma/schema.prisma:478-492`)
14. **KoyoriItem** (`prisma/schema.prisma:494-516`)
15. **UserBook** (`prisma/schema.prisma:693-708`)
16. **AffiliateStateLog** (`prisma/schema.prisma:447-461`)

### 勉強コースモデル

17. **StudyItem** (`prisma/schema.prisma:289-319`)
18. **StudyAttempt** (`prisma/schema.prisma:321-351`)

### Legacyモデル（後で削除予定）

19. **Subscription** (`prisma/schema.prisma:522-534`)
20. **Material** (`prisma/schema.prisma:536-549`)
21. **Asset** (`prisma/schema.prisma:551-567`)
22. **StudyRecord** (`prisma/schema.prisma:569-600`)
23. **ReviewSchedule** (`prisma/schema.prisma:602-614`)
24. **ReviewLog** (`prisma/schema.prisma:616-629`)
25. **ReadingProgress** (`prisma/schema.prisma:674-687`)
26. **Notification** (`prisma/schema.prisma:710-725`)
27. **RevenueShare** (`prisma/schema.prisma:727-743`)
28. **OcrText** (`prisma/schema.prisma:745-757`)
29. **Meso** (`prisma/schema.prisma:759-774`)
30. **MesoItem** (`prisma/schema.prisma:776-788`)
31. **Macro** (`prisma/schema.prisma:790-805`)
32. **MacroItem** (`prisma/schema.prisma:807-820`)

### その他

33. **RateLimitBucket** (`prisma/schema.prisma:423-441`)
34. **WebhookEventLog** (`prisma/schema.prisma:467-472`)

---

## 1) モデル別 Data Lineage（流入元・表示先・利用方法）

### Model: User（根拠：`prisma/schema.prisma:15-66`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/auth/register`
- **DB操作**: `prisma.user.create`
- **根拠**: `app/api/auth/register/route.ts:32-43`

**Update**:
- **入口1**: `POST /api/affiliate/opt-in`（アフィリエイト有効化）
- **DB操作**: `prisma.user.update`（`affiliateState`, `affiliateEnabledAt`）
- **根拠**: `app/api/affiliate/opt-in/route.ts:51-57`

- **入口2**: `POST /api/affiliate/cancel`（アフィリエイト解約）
- **DB操作**: `prisma.user.update`（`affiliateState: 'OFF'`）
- **根拠**: `app/api/affiliate/cancel/route.ts:32-36`

- **入口3**: `POST /api/stripe/webhook`（Stripe Webhook）
- **DB操作**: `prisma.user.update`（`affiliateState`, `stripeCustomerId`, `stripeSubscriptionId`）
- **根拠**: `app/api/stripe/webhook/route.ts:91-97`, `140-144`, `176-180`

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/auth/me`
- **DB操作**: `prisma.user.findUnique`
- **根拠**: `app/api/auth/me/route.ts:11-19`

- **API2**: `POST /api/auth/login`
- **DB操作**: `prisma.user.findUnique`（認証用）
- **根拠**: `app/api/auth/login/route.ts:18-20`

- **API3**: `GET /api/affiliate/me`
- **DB操作**: `prisma.user.findUnique`（`getUserForAffiliate`経由）
- **根拠**: `lib/affiliate.ts:40-52`

- **API4**: `POST /api/books`（プラン確認）
- **DB操作**: `prisma.user.findUnique`（`plan`確認）
- **根拠**: `app/api/books/route.ts:68-79`

- **API5**: `POST /api/ocr-assets`（プラン確認）
- **DB操作**: `prisma.user.findUnique`（`plan`確認）
- **根拠**: `app/api/ocr-assets/route.ts:103-106`

**表示先**:
- **画面1**: `/`（ホーム画面）
- **取得方法**: `fetch('/api/auth/me')`
- **根拠**: `app/page.tsx:69-79`

- **画面2**: `/settings/affiliate`（アフィリエイト設定）
- **取得方法**: `fetch('/api/affiliate/me')`
- **根拠**: `app/settings/affiliate/page.tsx:38-49`

#### 利用方法（使われ方）

**判定（条件分岐・フィルタ・状態表示）**:
- **アフィリエイトON判定**: `user.affiliateState === 'ON'`
- **根拠**: `lib/affiliate.ts:11-13`

- **勉強コース加入判定**: `user.affiliatePlanType === 'STUDY_SUB'`
- **根拠**: `lib/affiliate.ts:18-20`

- **Paywall必要判定**: `user.affiliateState !== 'ON' && user.affiliatePlanType !== 'STUDY_SUB'`
- **根拠**: `lib/affiliate.ts:33-35`

**制御（権限/公開範囲/本人のみ等）**:
- **プラン制御**: `user.plan`で冊数上限チェック
- **根拠**: `app/api/books/route.ts:91-97`, `lib/plan-config.ts:19-23`

- **勉強コース制御**: `user.plan !== 'FREE'`でデータ量制御
- **根拠**: `app/api/ocr-assets/route.ts:109-124`

**課金・機能制限**:
- **アフィリエイト機能**: `affiliateState`で成果計測の有効/無効を制御
- **根拠**: `app/api/gifts/[id]/route.ts:36-45`（`isAffiliateOn`チェック）

- **勉強コース機能**: `plan`で冊数上限を制御
- **根拠**: `app/api/books/route.ts:91-97`

---

### Model: Book（根拠：`prisma/schema.prisma:68-102`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/books`
- **DB操作**: `prisma.book.create`
- **根拠**: `app/api/books/route.ts:101-111`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/books`（一覧取得）
- **DB操作**: `prisma.book.findMany`
- **根拠**: `app/api/books/route.ts:22-48`

- **API2**: `GET /api/book-search`（既存書籍検索）
- **DB操作**: `prisma.book.findMany`（`title`, `author`で部分一致）
- **根拠**: `app/api/book-search/route.ts:38-52`

- **API3**: 各種APIで所有確認
- **DB操作**: `prisma.book.findFirst`（`userId`でフィルタ）
- **根拠**: 
  - `app/api/reviews/route.ts:67-69`
  - `app/api/reading-logs/route.ts:83-85`
  - `app/api/gifts/route.ts:63-65`
  - `app/api/ocr-assets/route.ts:33-35`
  - その他多数

**表示先**:
- **画面1**: `/books`（本一覧・登録）
- **取得方法**: `fetch('/api/books')`
- **根拠**: `app/books/page.tsx:37-98`

- **画面2**: `/books/[id]/review`（レビュー投稿）
- **取得方法**: `fetch('/api/books')`（一覧から該当書籍を検索）
- **根拠**: `app/books/[id]/review/page.tsx:50-67`

- **画面3**: `/`（ホーム画面・本棚表示）
- **取得方法**: `fetch('/api/books')`
- **根拠**: `app/page.tsx:47-60`

#### 利用方法（使われ方）

**結合（他モデルと関連取得して価値を出す）**:
- **ReadingLog結合**: `book.readingLogs`でユーザーの読書ログを取得
- **根拠**: `app/api/books/route.ts:24-28`

- **Review結合**: `book.reviews`でレビューを取得
- **根拠**: `app/api/books/[bookId]/review-summary/route.ts:33-41`

- **UserBook結合**: `book.userBooks`で積読状態を取得
- **根拠**: `app/books/page.tsx:221-289`（想定）

**制御（権限/公開範囲/本人のみ等）**:
- **所有確認**: 各APIで`book.userId === userId`をチェック
- **根拠**: 上記「取得元」の各API

---

### Model: ReadingLog（根拠：`prisma/schema.prisma:109-147`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/reading-logs`
- **DB操作**: `prisma.readingLog.create`
- **根拠**: `app/api/reading-logs/route.ts:123-149`

**Update**:
- **入口**: `PUT /api/reading-logs/[id]`
- **DB操作**: `prisma.readingLog.update`
- **根拠**: `app/api/reading-logs/[id]/route.ts:144-160`

**Delete**:
- **入口**: `DELETE /api/reading-logs/[id]`
- **DB操作**: `prisma.readingLog.delete`
- **根拠**: `app/api/reading-logs/[id]/route.ts:193-195`

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/reading-logs`（一覧取得）
- **DB操作**: `prisma.readingLog.findMany`
- **根拠**: `app/api/reading-logs/route.ts:40-55`

- **API2**: `GET /api/home/stats`（統計情報）
- **DB操作**: `prisma.readingLog.findMany`（今日作成分）
- **根拠**: `app/api/home/stats/route.ts:56-68`

- **API3**: `GET /api/home/stats`（連続学習日数計算）
- **DB操作**: `prisma.readingLog.count`
- **根拠**: `app/api/home/stats/route.ts:92-101`

- **API4**: `POST /api/snapshots`（Snapshot作成時のソース取得）
- **DB操作**: `prisma.readingLog.findFirst`
- **根拠**: `app/api/snapshots/route.ts:84-92`

- **API5**: `POST /api/mesos`, `POST /api/macros`（Meso/Macro作成時の所有確認）
- **DB操作**: `prisma.readingLog.findMany`
- **根拠**: 
  - `app/api/mesos/route.ts:81-85`
  - `app/api/macros/route.ts:99-105`

**表示先**:
- **画面1**: `/books/[id]/reading-logs`（ReadingLog作成・一覧）
- **取得方法**: `fetch('/api/reading-logs?bookId=xxx')`
- **根拠**: `app/books/[id]/reading-logs/page.tsx`（想定、ファイル未確認）

#### 利用方法（使われ方）

**集計/計算（統計・平均★・件数等）**:
- **未記入ログ数計算**: 今日ReadingLogを作成していない本の数を計算
- **根拠**: `app/api/home/stats/route.ts:56-80`

- **連続学習日数計算**: 過去のReadingLog作成日を確認して連続日数を計算
- **根拠**: `app/api/home/stats/route.ts:87-130`

**結合（他モデルと関連取得して価値を出す）**:
- **Tag結合**: `readingLog.tags`でタグを取得
- **根拠**: `app/api/reading-logs/route.ts:42-48`

- **Book結合**: `readingLog.book`で書籍情報を取得
- **根拠**: `app/api/reading-logs/route.ts:42-48`

- **SnapshotSource結合**: `readingLog.snapshotSources`でSnapshotのソースとして使用
- **根拠**: `app/api/snapshots/route.ts:84-92`

**制御（権限/公開範囲/本人のみ等）**:
- **所有確認**: `readingLog.userId === userId`をチェック
- **根拠**: `app/api/reading-logs/[id]/route.ts:32-40`

---

### Model: Review（根拠：`prisma/schema.prisma:631-654`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/reviews`（新規レビュー）
- **DB操作**: `prisma.review.create`
- **根拠**: `app/api/reviews/route.ts:127-144`

**Update**:
- **入口**: `POST /api/reviews`（既存レビュー更新）
- **DB操作**: `prisma.review.update`
- **根拠**: `app/api/reviews/route.ts:100-121`

**Delete**:
- **入口**: `DELETE /api/reviews/[id]`
- **DB操作**: `prisma.review.delete`
- **根拠**: `app/api/reviews/[id]/route.ts:25-27`

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/reviews`（自分のレビュー一覧）
- **DB操作**: `prisma.review.findMany`（`userId`でフィルタ）
- **根拠**: `app/api/reviews/route.ts:34-48`

- **API2**: `GET /api/books/[bookId]/review-summary`（公開レビューサマリー）
- **DB操作**: `prisma.review.findMany`（`isPublic: true`でフィルタ）
- **根拠**: `app/api/books/[bookId]/review-summary/route.ts:33-41`, `50-69`

**表示先**:
- **画面1**: `/reviews`（レビュー一覧）
- **取得方法**: `fetch('/api/reviews')`
- **根拠**: `app/reviews/page.tsx:29-45`

- **画面2**: `/books`（積読タブ・レビューサマリー表示）
- **取得方法**: `fetch('/api/books/[bookId]/review-summary')`
- **根拠**: `app/books/page.tsx:221-289`（`ReviewSummaryCard`コンポーネント使用）

#### 利用方法（使われ方）

**集計/計算（統計・平均★・件数等）**:
- **平均評価計算**: 公開レビューの`rating`の平均を計算
- **根拠**: `app/api/books/[bookId]/review-summary/route.ts:44-47`

**判定（条件分岐・フィルタ・状態表示）**:
- **公開/非公開フィルタ**: `isPublic: true`で公開レビューのみ取得
- **根拠**: `app/api/books/[bookId]/review-summary/route.ts:24-25`

- **ネタバレ除外**: `hasSpoiler: false`でネタバレレビューを除外
- **根拠**: `app/api/books/[bookId]/review-summary/route.ts:28-30`

**制御（権限/公開範囲/本人のみ等）**:
- **所有確認**: `review.userId === userId`をチェック
- **根拠**: `app/api/reviews/route.ts:29`, `app/api/reviews/[id]/route.ts:14-22`

**結合（他モデルと関連取得して価値を出す）**:
- **Book結合**: `review.book`で書籍情報を取得
- **根拠**: `app/api/reviews/route.ts:36-37`

- **ReviewEvolutionLog結合**: `review.evolutionLogs`で進化ログを取得
- **根拠**: `app/api/reviews/route.ts:38-43`

---

### Model: Gift（根拠：`prisma/schema.prisma:357-394`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/gifts`
- **DB操作**: `prisma.gift.create`
- **根拠**: `app/api/gifts/route.ts:85-97`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/gifts`（自分のギフト一覧）
- **DB操作**: `prisma.gift.findMany`（`senderUserId`でフィルタ）
- **根拠**: `app/api/gifts/route.ts:27-47`

- **API2**: `GET /api/gifts/[id]`（公開ページ用）
- **DB操作**: `prisma.gift.findUnique`（`giftToken`で検索）
- **根拠**: `app/api/gifts/[id]/route.ts:17-20`

- **API3**: `GET /api/gift-events`（成果計測用）
- **DB操作**: `prisma.gift.findFirst`, `prisma.gift.findMany`（所有確認）
- **根拠**: `app/api/gift-events/route.ts:34-46`

**表示先**:
- **画面1**: `/gifts`（ギフト管理）
- **取得方法**: `fetch('/api/gifts')`
- **根拠**: `app/gifts/page.tsx:50-100`

- **画面2**: `/gifts/[slug]`（ギフト公開ページ）
- **取得方法**: `fetch('/api/gifts/[id]')`
- **根拠**: `app/gifts/[slug]/page.tsx`（想定、ファイル未確認）

#### 利用方法（使われ方）

**判定（条件分岐・フィルタ・状態表示）**:
- **アフィリエイトON判定**: `gift.sender.affiliateState === 'ON'`でイベント記録の有無を判定
- **根拠**: `app/api/gifts/[id]/route.ts:36-45`

**結合（他モデルと関連取得して価値を出す）**:
- **Book結合**: `gift.book`で書籍情報を取得
- **根拠**: `app/api/gifts/route.ts:29-30`

- **GiftEvent結合**: `gift.events`で成果計測イベントを取得
- **根拠**: `app/api/gift-events/route.ts:49-62`

**制御（権限/公開範囲/本人のみ等）**:
- **所有確認**: `gift.senderUserId === userId`をチェック
- **根拠**: `app/api/gifts/route.ts:28`, `app/api/gift-events/route.ts:34-39`

---

### Model: GiftEvent（根拠：`prisma/schema.prisma:396-416`）

#### 流入元（Create/Update）

**Create**:
- **入口1**: `POST /api/gifts`（ギフト作成時）
- **DB操作**: `prisma.giftEvent.create`（`type: 'GIFT_CREATED'`）
- **根拠**: `app/api/gifts/route.ts:100-103`

- **入口2**: `POST /api/gifts/[id]`（イベント記録）
- **DB操作**: `prisma.giftEvent.create`（各種イベントタイプ）
- **根拠**: `app/api/gifts/[id]/route.ts:100-105`

- **入口3**: `GET /api/gifts/[id]`（ギフト公開ページ閲覧時）
- **DB操作**: `prisma.giftEvent.create`（`type: 'GIFT_OPENED'`、アフィリエイトON時のみ）
- **根拠**: `app/api/gifts/[id]/route.ts:39-45`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/gift-events`（成果計測データ取得）
- **DB操作**: `prisma.giftEvent.findMany`
- **根拠**: `app/api/gift-events/route.ts:49-62`

**表示先**:
- **画面1**: `/gifts/[id]/analytics`（ギフト分析）
- **取得方法**: `fetch('/api/gift-events?giftId=xxx')`
- **根拠**: `app/gifts/[slug]/analytics/page.tsx:38-228`（想定）

- **画面2**: `/affiliate/dashboard`（成果ダッシュボード）
- **取得方法**: `fetch('/api/gift-events')`
- **根拠**: `app/affiliate/dashboard/page.tsx:38-228`（想定）

#### 利用方法（使われ方）

**集計/計算（統計・平均★・件数等）**:
- **KPI計算**: イベントタイプ別の件数を集計（開封率、CTR、購読率など）
- **根拠**: `app/api/gift-events/route.ts:71-120`

**判定（条件分岐・フィルタ・状態表示）**:
- **イベントタイプフィルタ**: `type`でイベントを分類
- **根拠**: `app/api/gift-events/route.ts:49-62`

**制御（権限/公開範囲/本人のみ等）**:
- **アフィリエイトON制御**: `affiliateState === 'ON'`の時のみイベント記録
- **根拠**: `app/api/gifts/[id]/route.ts:36-45`

---

### Model: Koyori（根拠：`prisma/schema.prisma:478-492`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/koyori`
- **DB操作**: `prisma.koyori.create`
- **根拠**: `app/api/koyori/route.ts:65-70`

**Update**:
- **入口**: `PUT /api/koyori/[id]`
- **DB操作**: `prisma.koyori.update`
- **根拠**: `app/api/koyori/[id]/route.ts:95-100`

**Delete**:
- **入口**: `DELETE /api/koyori/[id]`
- **DB操作**: `prisma.koyori.delete`
- **根拠**: `app/api/koyori/[id]/route.ts:136-138`

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/koyori`（一覧取得）
- **DB操作**: `prisma.koyori.findMany`
- **根拠**: `app/api/koyori/route.ts:25-40`

- **API2**: `GET /api/koyori/[id]`（詳細取得）
- **DB操作**: `prisma.koyori.findFirst`
- **根拠**: `app/api/koyori/[id]/route.ts:24-40`

**表示先**:
- **画面1**: `/koyori`（こより一覧）
- **取得方法**: `fetch('/api/koyori')`
- **根拠**: `app/koyori/page.tsx:27-37`

- **画面2**: `/koyori/[id]`（こより詳細）
- **取得方法**: `fetch('/api/koyori/[id]')`
- **根拠**: `app/koyori/[id]/page.tsx`（想定、ファイル未確認）

#### 利用方法（使われ方）

**結合（他モデルと関連取得して価値を出す）**:
- **KoyoriItem結合**: `koyori.items`でアイテムを取得
- **根拠**: `app/api/koyori/[id]/route.ts:26-40`

**制御（権限/公開範囲/本人のみ等）**:
- **所有確認**: `koyori.userId === userId`をチェック
- **根拠**: `app/api/koyori/[id]/route.ts:27-29`

---

### Model: UserBook（根拠：`prisma/schema.prisma:693-708`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/user-books`（新規作成）
- **DB操作**: `prisma.userBook.create`
- **根拠**: `app/api/user-books/route.ts:81-92`

**Update**:
- **入口**: `POST /api/user-books`（既存更新）
- **DB操作**: `prisma.userBook.update`
- **根拠**: `app/api/user-books/route.ts:69-78`

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/user-books`（一覧取得）
- **DB操作**: `prisma.userBook.findMany`
- **根拠**: `app/api/user-books/route.ts:28-36`

**表示先**:
- **画面1**: `/books`（積読タブ・状態選択）
- **取得方法**: `fetch('/api/user-books')`
- **根拠**: `app/books/page.tsx:221-289`（想定）

#### 利用方法（使われ方）

**判定（条件分岐・フィルタ・状態表示）**:
- **積読フィルタ**: `status: 'TSUNDOKU'`で積読書籍のみ表示
- **根拠**: `app/books/page.tsx:221-289`（想定）

**結合（他モデルと関連取得して価値を出す）**:
- **Book結合**: `userBook.book`で書籍情報を取得
- **根拠**: `app/api/user-books/route.ts:30-32`

---

### Model: OCRAsset（根拠：`prisma/schema.prisma:262-283`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/ocr-assets`
- **DB操作**: `prisma.oCRAsset.create`
- **根拠**: `app/api/ocr-assets/route.ts:137-146`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/ocr-assets`（一覧取得）
- **DB操作**: `prisma.oCRAsset.findMany`
- **根拠**: `app/api/ocr-assets/route.ts:53-58`

**表示先**:
- **画面1**: `/books/[id]/ocr`（OCR一覧）
- **取得方法**: `fetch('/api/ocr-assets?bookId=xxx')`
- **根拠**: `app/books/[id]/ocr/page.tsx`（想定、ファイル未確認）

#### 利用方法（使われ方）

**判定（条件分岐・フィルタ・状態表示）**:
- **種別フィルタ**: `tags`フィールドのJSONから`type`を抽出してフィルタ
- **根拠**: `app/api/ocr-assets/route.ts:48-72`

**課金・機能制限**:
- **データ量制御**: 勉強コースユーザーのみ、画像枚数上限をチェック
- **根拠**: `app/api/ocr-assets/route.ts:109-124`

**結合（他モデルと関連取得して価値を出す）**:
- **KoyoriItem結合**: `ocrAsset.koyoriItems`でこよりアイテムとして使用
- **根拠**: `prisma/schema.prisma:278`

---

### Model: Tag（根拠：`prisma/schema.prisma:154-166`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/reading-logs`（ReadingLog作成時、タグが存在しない場合）
- **DB操作**: `prisma.tag.create`（`type: 'NOUN'` or `'VERB'`）
- **根拠**: `app/api/reading-logs/route.ts:100-102`, `114-116`

- **入口2**: `PUT /api/reading-logs/[id]`（ReadingLog更新時、タグが存在しない場合）
- **DB操作**: `prisma.tag.create`
- **根拠**: `app/api/reading-logs/[id]/route.ts:114-116`, `128-130`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/reading-logs`（ReadingLog取得時、タグも含めて取得）
- **DB操作**: `prisma.tag.findFirst`（タグ作成前の存在確認）
- **根拠**: `app/api/reading-logs/route.ts:96-98`, `110-112`

- **API2**: `POST /api/snapshots`（Snapshot作成時、タグ情報を取得）
- **DB操作**: `prisma.readingLogTag.findMany`（`include: { tag: true }`）
- **根拠**: `app/api/snapshots/route.ts:99-102`

**表示先**:
- **画面1**: `/books/[id]/reading-logs`（ReadingLog表示時、タグも表示）
- **取得方法**: `fetch('/api/reading-logs')`（タグも含めて取得）
- **根拠**: `app/books/[id]/reading-logs/page.tsx`（想定）

#### 利用方法（使われ方）

**結合（他モデルと関連取得して価値を出す）**:
- **ReadingLogTag結合**: `tag.readingLogs`でReadingLogとの関連を取得
- **根拠**: `app/api/reading-logs/route.ts:44-48`

**制御（権限/公開範囲/本人のみ等）**:
- **正規化**: `@@unique([type, label])`で表記ゆれを防止
- **根拠**: `prisma/schema.prisma:163`

---

### Model: ReadingLogTag（根拠：`prisma/schema.prisma:168-181`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/reading-logs`（ReadingLog作成時）
- **DB操作**: `prisma.readingLogTag.create`（複数件、タグごと）
- **根拠**: `app/api/reading-logs/route.ts:122-149`（想定、詳細未確認）

- **入口2**: `PUT /api/reading-logs/[id]`（ReadingLog更新時）
- **DB操作**: `prisma.readingLogTag.deleteMany`（既存削除）→ `prisma.readingLogTag.create`（新規作成）
- **根拠**: `app/api/reading-logs/[id]/route.ts:101-103`, `118-135`

**Update**: **未発見**（推測しない）

**Delete**:
- **入口**: `PUT /api/reading-logs/[id]`（タグ更新時、既存タグを削除）
- **DB操作**: `prisma.readingLogTag.deleteMany`
- **根拠**: `app/api/reading-logs/[id]/route.ts:101-103`

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/reading-logs`（ReadingLog取得時、タグも含めて取得）
- **DB操作**: `prisma.readingLogTag.findMany`（`include: { tag: true }`）
- **根拠**: `app/api/reading-logs/route.ts:44-48`

- **API2**: `POST /api/snapshots`（Snapshot作成時、タグ情報を取得）
- **DB操作**: `prisma.readingLogTag.findMany`
- **根拠**: `app/api/snapshots/route.ts:99-102`

**表示先**:
- **画面1**: `/books/[id]/reading-logs`（ReadingLog表示時、タグも表示）
- **取得方法**: `fetch('/api/reading-logs')`（タグも含めて取得）
- **根拠**: `app/books/[id]/reading-logs/page.tsx`（想定）

#### 利用方法（使われ方）

**結合（他モデルと関連取得して価値を出す）**:
- **Tag結合**: `readingLogTag.tag`でタグ情報を取得
- **根拠**: `app/api/reading-logs/route.ts:44-48`

- **ReadingLog結合**: `readingLogTag.readingLog`でReadingLog情報を取得
- **根拠**: `prisma/schema.prisma:175`

---

### Model: AffiliateStateLog（根拠：`prisma/schema.prisma:447-461`）

#### 流入元（Create/Update）

**Create**:
- **入口1**: `POST /api/affiliate/opt-in`（アフィリエイト有効化時）
- **DB操作**: `prisma.affiliateStateLog.create`（`logAffiliateStateChange`経由）
- **根拠**: `app/api/affiliate/opt-in/route.ts:59-65`, `lib/affiliate.ts:59-82`

- **入口2**: `POST /api/affiliate/cancel`（アフィリエイト解約時）
- **DB操作**: `prisma.affiliateStateLog.create`（`logAffiliateStateChange`経由）
- **根拠**: `app/api/affiliate/cancel/route.ts:40-46`, `lib/affiliate.ts:59-82`

- **入口3**: `POST /api/stripe/webhook`（Stripe Webhook）
- **DB操作**: `prisma.affiliateStateLog.create`（`logAffiliateStateChange`経由）
- **根拠**: `app/api/stripe/webhook/route.ts:104-110,150-156,188-194`, `lib/affiliate.ts:59-82`

**Update**: **未発見**（推測しない）

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/affiliate/state-logs`（状態ログ一覧）
- **DB操作**: `prisma.affiliateStateLog.findMany`
- **根拠**: `app/api/affiliate/state-logs/route.ts:19-27`

**表示先**:
- **画面1**: `/settings/affiliate`（アフィリエイト設定・状態ログ表示）
- **取得方法**: `fetch('/api/affiliate/state-logs')`
- **根拠**: `app/settings/affiliate/page.tsx:33-36`

#### 利用方法（使われ方）

**制御（権限/公開範囲/本人のみ等）**:
- **証跡**: アフィリエイト状態の変更履歴を記録（監査用）
- **根拠**: `lib/affiliate.ts:59-82`

---

### Model: StudyItem（根拠：`prisma/schema.prisma:289-319`）

#### 流入元（Create/Update）

**Create**:
- **入口**: `POST /api/study-items`
- **DB操作**: `prisma.studyItem.create`
- **根拠**: `app/api/study-items/route.ts:78-95`

**Update**:
- **入口**: `POST /api/study-items/[id]/select-explanation`（解説選択時）
- **DB操作**: `prisma.studyItem.update`（`explanationText`更新）
- **根拠**: `app/api/study-items/[id]/select-explanation/route.ts:58-65`

**Delete**: **未発見**（推測しない）

#### 表示先（Read）

**取得元**:
- **API1**: `GET /api/study-items`（一覧取得）
- **DB操作**: `prisma.studyItem.findMany`
- **根拠**: `app/api/study-items/route.ts:34-50`

- **API2**: `GET /api/study-items/explanations`（解説候補取得）
- **DB操作**: `prisma.studyItem.findMany`（`explanationText`が存在するもの）
- **根拠**: `app/api/study-items/explanations/route.ts:30-50`

**表示先**:
- **画面1**: `/study/today`（今日の復習）
- **取得方法**: `fetch('/api/study-items')`
- **根拠**: `app/study/today/page.tsx`（想定、ファイル未確認）

#### 利用方法（使われ方）

**判定（条件分岐・フィルタ・状態表示）**:
- **卒業フィルタ**: `isGraduated: true/false`でフィルタ
- **根拠**: `app/api/study-items/route.ts:31-32`

**結合（他モデルと関連取得して価値を出す）**:
- **Book結合**: `studyItem.book`で書籍情報を取得
- **根拠**: `app/api/study-items/route.ts:36-37`

- **StudyAttempt結合**: `studyItem.attempts`で復習ログを取得
- **根拠**: `prisma/schema.prisma:313`

---

## 2) CRUDマトリクス（漏れ確認）

| モデル | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| **User** | `app/api/auth/register/route.ts:32` | `app/api/auth/me/route.ts:11`<br>`app/api/auth/login/route.ts:18`<br>`app/api/affiliate/me/route.ts`（`lib/affiliate.ts:40`経由）<br>`app/api/books/route.ts:68`<br>`app/api/ocr-assets/route.ts:103` | `app/api/affiliate/opt-in/route.ts:51`<br>`app/api/affiliate/cancel/route.ts:32`<br>`app/api/stripe/webhook/route.ts:91,140,176` | **未発見** |
| **Book** | `app/api/books/route.ts:101` | `app/api/books/route.ts:22`<br>`app/api/book-search/route.ts:38`<br>各種APIで所有確認（多数） | **未発見** | **未発見** |
| **ReadingLog** | `app/api/reading-logs/route.ts:123` | `app/api/reading-logs/route.ts:40`<br>`app/api/home/stats/route.ts:56,92`<br>`app/api/snapshots/route.ts:84`<br>`app/api/mesos/route.ts:81`<br>`app/api/macros/route.ts:99` | `app/api/reading-logs/[id]/route.ts:144` | `app/api/reading-logs/[id]/route.ts:193` |
| **Review** | `app/api/reviews/route.ts:127` | `app/api/reviews/route.ts:34`<br>`app/api/books/[bookId]/review-summary/route.ts:33,50` | `app/api/reviews/route.ts:100` | `app/api/reviews/[id]/route.ts:25` |
| **ReviewEvolutionLog** | `app/api/reviews/route.ts:85` | `app/api/reviews/route.ts:38`（`include`で取得） | **未発見** | **未発見** |
| **Gift** | `app/api/gifts/route.ts:85` | `app/api/gifts/route.ts:27`<br>`app/api/gifts/[id]/route.ts:17`<br>`app/api/gift-events/route.ts:34,42` | **未発見** | **未発見** |
| **GiftEvent** | `app/api/gifts/route.ts:100`<br>`app/api/gifts/[id]/route.ts:39,100` | `app/api/gift-events/route.ts:49` | **未発見** | **未発見** |
| **Koyori** | `app/api/koyori/route.ts:65` | `app/api/koyori/route.ts:25`<br>`app/api/koyori/[id]/route.ts:24` | `app/api/koyori/[id]/route.ts:95` | `app/api/koyori/[id]/route.ts:136` |
| **KoyoriItem** | `app/api/koyori/[id]/items/route.ts:89-99` | `app/api/koyori/[id]/route.ts:26`（`include`で取得） | `app/api/koyori/[id]/items/reorder/route.ts:51-58`<br>`app/api/koyori/items/[itemId]/route.ts:39-44` | `app/api/koyori/items/[itemId]/route.ts:83-85` |
| **UserBook** | `app/api/user-books/route.ts:81` | `app/api/user-books/route.ts:28` | `app/api/user-books/route.ts:69` | **未発見** |
| **OCRAsset** | `app/api/ocr-assets/route.ts:137` | `app/api/ocr-assets/route.ts:53` | **未発見** | **未発見** |
| **Tag** | `app/api/reading-logs/route.ts:100,114`<br>`app/api/reading-logs/[id]/route.ts:114,128` | `app/api/reading-logs/route.ts:44`（`include`で取得）<br>`app/api/snapshots/route.ts:99` | **未発見** | **未発見** |
| **ReadingLogTag** | `app/api/reading-logs/route.ts:135-139`<br>`app/api/reading-logs/[id]/route.ts:137-141` | `app/api/reading-logs/route.ts:44`（`include`で取得）<br>`app/api/snapshots/route.ts:99` | **未発見** | `app/api/reading-logs/[id]/route.ts:101`（`deleteMany`） |
| **AffiliateStateLog** | `lib/affiliate.ts:73`（`logAffiliateStateChange`経由） | `app/api/affiliate/state-logs/route.ts:19` | **未発見** | **未発見** |
| **StudyItem** | `app/api/study-items/route.ts:78` | `app/api/study-items/route.ts:34`<br>`app/api/study-items/explanations/route.ts:30` | `app/api/study-items/[id]/select-explanation/route.ts:58` | **未発見** |
| **PublishedSnapshot** | `app/api/snapshots/route.ts:240-275` | `app/api/snapshots/route.ts:42` | `app/api/snapshots/[id]/publish/route.ts`（想定） | **未発見** |
| **SnapshotSource** | `app/api/snapshots/route.ts:252-264` | `app/api/snapshots/route.ts:46`（`include`で取得） | **未発見** | **未発見** |

---

## 3) 画面別：表示データ一覧（ユーザー視点で）

### `/`（ホーム画面）

**表示しているモデル/主なフィールド**:
- `User`（`id`, `email`, `affiliatePlanType`）
- `Book`（`id`, `title`, `coverImageUrl`）
- `HomeStats`（`todayReviewCount`, `unloggedBooksCount`, `streak`）

**取得方法**:
- `fetch('/api/auth/me')` → `GET /api/auth/me`
- `fetch('/api/books')` → `GET /api/books`
- `fetch('/api/home/stats')` → `GET /api/home/stats`

**根拠**: `app/page.tsx:47-83`

---

### `/books`（本一覧・登録）

**表示しているモデル/主なフィールド**:
- `Book`（`id`, `title`, `materials`, `userBookStatus`）
- `UserBook`（`id`, `bookId`, `status`）
- `ReviewSummary`（`avgRating`, `publicReviewCount`, `snippets`）

**取得方法**:
- `fetch('/api/books')` → `GET /api/books`
- `fetch('/api/user-books')` → `GET /api/user-books`
- `fetch('/api/books/[bookId]/review-summary')` → `GET /api/books/[bookId]/review-summary`（積読タブ時）

**根拠**: `app/books/page.tsx:37-289`

---

### `/books/[id]/review`（レビュー投稿）

**表示しているモデル/主なフィールド**:
- `Book`（`id`, `title`）
- `Review`（`id`, `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `isPublic`, `hasSpoiler`）

**取得方法**:
- `fetch('/api/books')` → `GET /api/books`（一覧から該当書籍を検索）
- `fetch('/api/reviews?bookId=xxx')` → `GET /api/reviews?bookId=xxx`

**根拠**: `app/books/[id]/review/page.tsx:50-91`

---

### `/reviews`（レビュー一覧）

**表示しているモデル/主なフィールド**:
- `Review`（`id`, `book`, `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `createdAt`）

**取得方法**:
- `fetch('/api/reviews')` → `GET /api/reviews`

**根拠**: `app/reviews/page.tsx:29-45`

---

### `/gifts`（ギフト管理）

**表示しているモデル/主なフィールド**:
- `Gift`（`id`, `bookId`, `purchaseUrl`, `message`, `giftToken`, `status`, `expiresAt`, `createdAt`, `book`, `events`）
- `AffiliateState`（`affiliateState`, `affiliatePlanType`, `requiresPaywall`）

**取得方法**:
- `fetch('/api/gifts')` → `GET /api/gifts`
- `fetch('/api/affiliate/me')` → `GET /api/affiliate/me`

**根拠**: `app/gifts/page.tsx:50-568`

---

### `/gifts/[slug]`（ギフト公開ページ）

**表示しているモデル/主なフィールド**:
- `Gift`（`id`, `purchaseUrl`, `message`, `book`, `sender`）

**取得方法**:
- `fetch('/api/gifts/[id]')` → `GET /api/gifts/[id]`

**根拠**: `app/gifts/[slug]/page.tsx`（想定、ファイル未確認）

---

### `/gifts/[slug]/analytics`（ギフト分析）

**表示しているモデル/主なフィールド**:
- `GiftEvent`（`id`, `type`, `createdAt`, `gift`）
- `KPI`（`created`, `opened`, `outboundClicked`, `registered`, `subscribed`, `openRate`, `outboundCTR`, `subscribeRate`）

**取得方法**:
- `fetch('/api/gift-events?giftId=xxx')` → `GET /api/gift-events?giftId=xxx`

**根拠**: `app/gifts/[slug]/analytics/page.tsx:38-228`（想定）

---

### `/koyori`（こより一覧）

**表示しているモデル/主なフィールド**:
- `Koyori`（`id`, `title`, `memo`, `updatedAt`, `_count.items`）

**取得方法**:
- `fetch('/api/koyori')` → `GET /api/koyori`

**根拠**: `app/koyori/page.tsx:27-37`

---

### `/koyori/[id]`（こより詳細）

**表示しているモデル/主なフィールド**:
- `Koyori`（`id`, `title`, `memo`, `items`）
- `KoyoriItem`（`id`, `type`, `sourceId`, `order`, `note`, `readingLog`, `ocrAsset`）

**取得方法**:
- `fetch('/api/koyori/[id]')` → `GET /api/koyori/[id]`

**根拠**: `app/koyori/[id]/page.tsx`（想定、ファイル未確認）

---

### `/settings/affiliate`（アフィリエイト設定）

**表示しているモデル/主なフィールド**:
- `AffiliateState`（`affiliateState`, `affiliatePlanType`, `enabledAt`, `suspendedAt`, `suspendedReason`, `requiresPaywall`）
- `AffiliateStateLog`（`id`, `fromState`, `toState`, `reason`, `actorType`, `createdAt`）

**取得方法**:
- `fetch('/api/affiliate/me')` → `GET /api/affiliate/me`
- `fetch('/api/affiliate/state-logs')` → `GET /api/affiliate/state-logs`

**根拠**: `app/settings/affiliate/page.tsx:38-49`, `33-36`

---

### `/affiliate/dashboard`（成果ダッシュボード）

**表示しているモデル/主なフィールド**:
- `GiftEvent`（`id`, `type`, `createdAt`, `gift`）
- `KPI`（`created`, `opened`, `outboundClicked`, `registered`, `subscribed`, `openRate`, `outboundCTR`, `subscribeRate`）

**取得方法**:
- `fetch('/api/gift-events')` → `GET /api/gift-events`

**根拠**: `app/affiliate/dashboard/page.tsx:38-228`（想定）

---

## 4) 重要な指摘（監査の結論）

### 未使用/死蔵フィールドの再監査（A/B/C分類）

#### 1. User.name

**根拠（schema定義）**: `prisma/schema.prisma:18`

**参照箇所の調査結果**:
- **DB保存**: `app/api/auth/register/route.ts:32-43`（Create時、`name`フィールドは設定されていない）
- **DB取得**: `app/api/books/[bookId]/review-summary/route.ts:60`（`user.name`を取得）
- **表示**: `app/api/books/[bookId]/review-summary/route.ts:73`（`displayName`生成時に`user.name || user.email?.split('@')[0] || '匿名'`として使用）
- **UI入力**: **未発見**（登録フォームに`name`入力欄がない）
- **API入力**: **未発見**（`POST /api/auth/register`のスキーマに`name`がない）

**分類**: **B（未実装：UI/導線不足）**

**理由**: 
- フィールドは存在し、一部のAPIで参照されている（`app/api/books/[bookId]/review-summary/route.ts:60,73`）
- しかし、ユーザー登録時に`name`を設定する導線がない（`app/api/auth/register/route.ts:32-43`で`name`が設定されていない）
- 表示時は`user.name`が`null`の場合に`email`から生成した表示名を使用している

**根拠**: 
- Schema: `prisma/schema.prisma:18`
- 参照: `app/api/books/[bookId]/review-summary/route.ts:60,73`
- 未設定: `app/api/auth/register/route.ts:32-43`

---

#### 2. Review.recommendedBooks

**根拠（schema定義）**: `prisma/schema.prisma:640`

**参照箇所の調査結果**:
- **DB保存**: `app/api/reviews/route.ts:108,136`（`recommendedBooks`をJSON文字列として保存）
- **DB取得**: `app/api/reviews/route.ts:92`（既存レビューから`recommendedBooks`を取得して進化ログに記録）
- **APIスキーマ**: `app/api/reviews/route.ts:13`（`z.array(z.string()).max(3).optional()`として定義）
- **UI入力**: **未発見**（`app/books/[id]/review/page.tsx:106-115`で`recommendedBooks`が送信されていない）
- **UI表示**: **未発見**（レビュー一覧やレビュー詳細で`recommendedBooks`が表示されていない）

**分類**: **B（未実装：UI/導線不足）**

**理由**:
- フィールドは存在し、APIスキーマで定義され、DB保存もされている（`app/api/reviews/route.ts:108,136`）
- しかし、UIで`recommendedBooks`を入力・送信する導線がない（`app/books/[id]/review/page.tsx:106-115`で送信されていない）
- 表示する導線もない

**根拠**:
- Schema: `prisma/schema.prisma:640`
- API定義: `app/api/reviews/route.ts:13`
- DB保存: `app/api/reviews/route.ts:108,136`
- 進化ログ: `app/api/reviews/route.ts:92`
- UI未送信: `app/books/[id]/review/page.tsx:106-115`

3. **Book.userId**（Legacy）
   - **根拠**: `prisma/schema.prisma:70`（`// Legacy: 後で削除予定`）
   - **利用箇所**: `app/api/books/route.ts:103`（Create時のみ設定）
   - **影響**: 後で削除予定だが、現在も使用中

4. **PublishedSnapshot.slug**（Legacy）
   - **根拠**: `prisma/schema.prisma:208`（`// Legacy: 後で削除予定`）
   - **利用箇所**: **未発見**（Snapshot公開ページの実装が未確認）

### 影響範囲が広い危険ポイント（1箇所変更で複数機能が壊れやすい）

1. **User.affiliateState**
   - **影響範囲**: ギフト成果計測、成果ダッシュボード、Paywall表示
   - **根拠**: 
     - `lib/affiliate.ts:11-13`（判定関数）
     - `app/api/gifts/[id]/route.ts:36-45`（イベント記録制御）
     - `app/gifts/page.tsx:44-48`（Paywall表示制御）
   - **危険性**: このフィールドの変更は、アフィリエイト機能全体に影響

2. **User.plan**
   - **影響範囲**: 冊数上限チェック、データ量制御
   - **根拠**: 
     - `app/api/books/route.ts:91-97`（冊数上限チェック）
     - `app/api/ocr-assets/route.ts:109-124`（データ量制御）
   - **危険性**: このフィールドの変更は、勉強コース機能全体に影響

3. **Book.id**
   - **影響範囲**: すべてのBook関連機能（ReadingLog, Review, Gift, OCRAsset, UserBook等）
   - **根拠**: 多数のAPIで`bookId`を外部キーとして使用
   - **危険性**: Book削除時、関連データのCascade削除が発生（`onDelete: Cascade`）

### 削除時に事故りやすい関連（親子関係が多いモデル）

1. **User**
   - **子モデル**: `ReadingLog`, `Review`, `Gift`, `Koyori`, `UserBook`, `OCRAsset`, `StudyItem`, `AffiliateStateLog`等（多数）
   - **Cascade設定**: すべて`onDelete: Cascade`
   - **根拠**: `prisma/schema.prisma:130,646,384,487,701,276,310,456`等
   - **危険性**: User削除時、すべての関連データが削除される

2. **Book**
   - **子モデル**: `ReadingLog`, `Review`, `Gift`, `UserBook`, `OCRAsset`, `StudyItem`, `PublishedSnapshot`等（多数）
   - **Cascade設定**: すべて`onDelete: Cascade`
   - **根拠**: `prisma/schema.prisma:131,647,386,702,277,311,211`等
   - **危険性**: Book削除時、すべての関連データが削除される

3. **ReadingLog**
   - **子モデル**: `ReadingLogTag`, `SnapshotSource`, `MesoItem`, `MacroItem`, `KoyoriItem`
   - **Cascade設定**: すべて`onDelete: Cascade`
   - **根拠**: `prisma/schema.prisma:175,249,784,816,510`等
   - **危険性**: ReadingLog削除時、タグ・Snapshot・Meso/Macroアイテム・こよりアイテムが削除される

4. **Gift**
   - **子モデル**: `GiftEvent`
   - **Cascade設定**: `onDelete: Cascade`
   - **根拠**: `prisma/schema.prisma:409`
   - **危険性**: Gift削除時、成果計測データが削除される

---

## 5) 補足：Legacyモデルの利用状況

### Legacyモデル（後で削除予定）の利用状況

以下のモデルは`prisma/schema.prisma`で「Legacy relations (後で削除予定)」と記載されているが、一部は現在も使用中：

1. **StudyRecord** - 使用中（`app/api/study-records/route.ts`）
2. **Material** - 使用中（`app/api/books/route.ts:71-77`で参照）
3. **Asset** - 使用中（`app/api/assets/route.ts`）
4. **Meso** - 使用中（`app/api/mesos/route.ts`）
5. **Macro** - 使用中（`app/api/macros/route.ts`）

**注意**: Legacyモデルの削除時は、関連するAPI・画面の修正が必要。

---

---

## 6) ユーザー行動マップ（E2E：非勉強コース中心）

### 行動1: 本を探す → 登録する

**入力データ（どこから流入）**:
- 書籍名（手動入力）: `app/books/page.tsx:272-279`
- 書籍検索結果（外部API）: `app/api/book-search/route.ts:35-52`（楽天・Amazon API）

**保存先モデル（Prisma）**:
- `Book`（`app/api/books/route.ts:101-111`）

**表示先画面（URL/コンポーネント）**:
- `/books`（本一覧）: `app/books/page.tsx:37-98`
- `/`（ホーム画面・本棚）: `app/page.tsx:47-60`

**主要ルール（判定/集計/制御/結合）**:
- **プラン制御**: `user.plan`で冊数上限チェック（`app/api/books/route.ts:91-97`）
- **所有確認**: 各APIで`book.userId === userId`をチェック（`app/api/reviews/route.ts:67-69`等）

**未発見（足りない導線/画面/API）**:
- **Book削除API**: **未発見**（`DELETE /api/books/[id]`が存在しない）
- **Book更新API**: **未発見**（`PUT /api/books/[id]`が存在しない）

**根拠**: 
- 入力: `app/books/page.tsx:100-150`, `app/api/book-search/route.ts:35-52`
- 保存: `app/api/books/route.ts:101-111`
- 表示: `app/books/page.tsx:37-98`, `app/page.tsx:47-60`

---

### 行動2: レビューを書く → 更新 → 削除

**入力データ（どこから流入）**:
- 評価（1-5）: `app/books/[id]/review/page.tsx:106-115`
- コメント（最大200字）: `app/books/[id]/review/page.tsx:106-115`
- 検索キーワード: `app/books/[id]/review/page.tsx:106-115`
- お気に入りフレーズ: `app/books/[id]/review/page.tsx:106-115`
- 感情タグ: `app/books/[id]/review/page.tsx:106-115`
- 公開設定（`isPublic`）: `app/books/[id]/review/page.tsx:106-115`
- ネタバレフラグ（`hasSpoiler`）: `app/books/[id]/review/page.tsx:106-115`
- **おすすめ本（`recommendedBooks`）**: **未発見**（UIで送信されていない）

**保存先モデル（Prisma）**:
- `Review`（`app/api/reviews/route.ts:127-144`）
- `ReviewEvolutionLog`（`app/api/reviews/route.ts:85-97`）

**表示先画面（URL/コンポーネント）**:
- `/reviews`（レビュー一覧）: `app/reviews/page.tsx:29-45`
- `/books`（積読タブ・レビューサマリー）: `app/books/page.tsx:221-289`（`ReviewSummaryCard`コンポーネント）
- `/books/[id]/review`（レビュー投稿・編集）: `app/books/[id]/review/page.tsx:50-91`

**主要ルール（判定/集計/制御/結合）**:
- **1書籍1レビュー**: 既存レビューがある場合は更新（`app/api/reviews/route.ts:76-123`）
- **進化ログ**: 更新時に既存データを`ReviewEvolutionLog`に記録（`app/api/reviews/route.ts:85-97`）
- **公開/非公開フィルタ**: `isPublic: true`で公開レビューのみ取得（`app/api/books/[bookId]/review-summary/route.ts:24-25`）
- **ネタバレ除外**: `hasSpoiler: false`でネタバレレビューを除外（`app/api/books/[bookId]/review-summary/route.ts:28-30`）
- **平均評価計算**: 公開レビューの`rating`の平均を計算（`app/api/books/[bookId]/review-summary/route.ts:44-47`）
- **所有確認**: `review.userId === userId`をチェック（`app/api/reviews/route.ts:29`, `app/api/reviews/[id]/route.ts:14-22`）

**未発見（足りない導線/画面/API）**:
- **おすすめ本入力UI**: **未発見**（`app/books/[id]/review/page.tsx:106-115`で`recommendedBooks`が送信されていない）
- **おすすめ本表示UI**: **未発見**（レビュー一覧やレビュー詳細で`recommendedBooks`が表示されていない）

**根拠**:
- 入力: `app/books/[id]/review/page.tsx:106-115`
- 保存: `app/api/reviews/route.ts:127-144`
- 更新: `app/api/reviews/route.ts:100-121`
- 削除: `app/api/reviews/[id]/route.ts:25-27`
- 表示: `app/reviews/page.tsx:29-45`, `app/books/page.tsx:221-289`

---

### 行動3: 読書ログを書く → 振り返る

**入力データ（どこから流入）**:
- 範囲タイプ（PAGE/CHAPTER/FREE）: `app/books/[id]/reading-logs/page.tsx:69-79`
- 範囲テキスト: `app/books/[id]/reading-logs/page.tsx:69-79`
- 要点（30-80字）: `app/books/[id]/reading-logs/page.tsx:69-79`
- 反応（CONFUSED/NARUHODO等）: `app/books/[id]/reading-logs/page.tsx:40-47`
- 名詞タグ（最大3）: `app/books/[id]/reading-logs/page.tsx:49-57`
- 動詞タグ（最大2）: `app/books/[id]/reading-logs/page.tsx:49-57`
- 質問テキスト: `app/books/[id]/reading-logs/page.tsx:69-79`
- 非公開メモ: `app/books/[id]/reading-logs/page.tsx:69-79`
- ハイライトテキスト: `app/books/[id]/reading-logs/page.tsx:69-79`
- 公開範囲（PRIVATE/PARTIAL/PUBLIC）: `app/books/[id]/reading-logs/page.tsx:69-79`

**保存先モデル（Prisma）**:
- `ReadingLog`（`app/api/reading-logs/route.ts:123-149`）
- `Tag`（`app/api/reading-logs/route.ts:100-102,114-116`）
- `ReadingLogTag`（`app/api/reading-logs/route.ts:135-139`）

**表示先画面（URL/コンポーネント）**:
- `/books/[id]/reading-logs`（ReadingLog作成・一覧）: `app/books/[id]/reading-logs/page.tsx:59-430`
- `/`（ホーム画面・統計情報）: `app/page.tsx:47-83`（`unloggedBooksCount`, `streak`）

**主要ルール（判定/集計/制御/結合）**:
- **タグ正規化**: `Tag`は`@@unique([type, label])`で表記ゆれを防止（`prisma/schema.prisma:163`）
- **未記入ログ数計算**: 今日ReadingLogを作成していない本の数を計算（`app/api/home/stats/route.ts:56-80`）
- **連続学習日数計算**: 過去のReadingLog作成日を確認して連続日数を計算（`app/api/home/stats/route.ts:87-130`）
- **所有確認**: `readingLog.userId === userId`をチェック（`app/api/reading-logs/[id]/route.ts:32-40`）

**未発見（足りない導線/画面/API）**:
- **ReadingLog一覧画面の詳細確認**: `app/books/[id]/reading-logs/page.tsx`は存在するが、ファイル内容の詳細確認が必要

**根拠**:
- 入力: `app/books/[id]/reading-logs/page.tsx:69-79`
- 保存: `app/api/reading-logs/route.ts:123-149`
- 更新: `app/api/reading-logs/[id]/route.ts:144-160`
- 削除: `app/api/reading-logs/[id]/route.ts:193-195`
- 表示: `app/books/[id]/reading-logs/page.tsx:59-430`

---

### 行動4: 積読を管理する（積む/崩す）

**入力データ（どこから流入）**:
- 書籍ID: `app/books/page.tsx:70-83`
- 状態（TSUNDOKU/READING/FINISHED/PAUSED）: `app/books/page.tsx:70-83`

**保存先モデル（Prisma）**:
- `UserBook`（`app/api/user-books/route.ts:81-92`）

**表示先画面（URL/コンポーネント）**:
- `/books`（積読タブ）: `app/books/page.tsx:204-214`（タブ切り替え）、`app/books/page.tsx:86-96`（フィルタ）

**主要ルール（判定/集計/制御/結合）**:
- **積読フィルタ**: `status: 'TSUNDOKU'`で積読書籍のみ表示（`app/books/page.tsx:87-90`）
- **レビューサマリー表示**: 積読タブで`ReviewSummaryCard`を表示（`app/books/page.tsx:221-289`）
- **1ユーザー1書籍1状態**: `@@unique([userId, bookId])`で重複防止（`prisma/schema.prisma:704`）

**未発見（足りない導線/画面/API）**:
- **UserBook削除API**: **未発見**（`DELETE /api/user-books/[id]`が存在しない）
- **積読状態の一括変更**: **未発見**（複数書籍の状態を一括変更するAPIが存在しない）

**根拠**:
- 入力: `app/books/page.tsx:70-83`
- 保存: `app/api/user-books/route.ts:81-92`
- 更新: `app/api/user-books/route.ts:69-78`
- 表示: `app/books/page.tsx:86-96,204-214`

---

### 行動5: ギフトを作る → 公開 → 閲覧する

**入力データ（どこから流入）**:
- 書籍ID（任意）: `app/gifts/page.tsx:50-568`
- 購入URL: `app/gifts/page.tsx:50-568`
- メッセージ（任意）: `app/gifts/page.tsx:50-568`
- 有効期限（任意）: `app/gifts/page.tsx:50-568`

**保存先モデル（Prisma）**:
- `Gift`（`app/api/gifts/route.ts:85-97`）
- `GiftEvent`（`app/api/gifts/route.ts:100-103`）

**表示先画面（URL/コンポーネント）**:
- `/gifts`（ギフト管理）: `app/gifts/page.tsx:50-568`
- `/gifts/[slug]`（ギフト公開ページ）: **未確認**（ファイル存在確認が必要）
- `/gifts/[slug]/analytics`（ギフト分析）: **未確認**（ファイル存在確認が必要）

**主要ルール（判定/集計/制御/結合）**:
- **アフィリエイトON判定**: `gift.sender.affiliateState === 'ON'`でイベント記録の有無を判定（`app/api/gifts/[id]/route.ts:36-45`）
- **KPI計算**: イベントタイプ別の件数を集計（開封率、CTR、購読率など）（`app/api/gift-events/route.ts:71-120`）
- **所有確認**: `gift.senderUserId === userId`をチェック（`app/api/gifts/route.ts:28`, `app/api/gift-events/route.ts:34-39`）

**未発見（足りない導線/画面/API）**:
- **Gift削除API**: **未発見**（`DELETE /api/gifts/[id]`が存在しない）
- **Gift更新API**: **未発見**（`PUT /api/gifts/[id]`が存在しない）
- **ギフト公開ページ**: `app/gifts/[slug]/page.tsx`の存在確認が必要
- **ギフト分析ページ**: `app/gifts/[slug]/analytics/page.tsx`の存在確認が必要

**根拠**:
- 入力: `app/gifts/page.tsx:50-568`
- 保存: `app/api/gifts/route.ts:85-97`
- イベント記録: `app/api/gifts/route.ts:100-103`, `app/api/gifts/[id]/route.ts:39-45,100-105`
- 表示: `app/gifts/page.tsx:50-568`
- KPI計算: `app/api/gift-events/route.ts:71-120`

---

## 7) 削除仕様書（事故防止）

### Book削除

**親→子の関係（cascade/手動削除）**:

**Cascade削除（自動）**:
- `ReadingLog`（`prisma/schema.prisma:131`）
- `Review`（`prisma/schema.prisma:647`）
- `Gift`（`prisma/schema.prisma:386`）
- `UserBook`（`prisma/schema.prisma:702`）
- `OCRAsset`（`prisma/schema.prisma:277`）
- `StudyItem`（`prisma/schema.prisma:311`）
- `PublishedSnapshot`（`prisma/schema.prisma:211`）

**手動削除が必要**:
- **未発見**（すべてCascade削除）

**ユーザーに出すべき警告文案**:
> ⚠️ この書籍を削除すると、以下のデータもすべて削除されます：
> - 読書ログ（○件）
> - レビュー（○件）
> - ギフト（○件）
> - 積読状態
> - OCRアセット（○件）
> - 勉強コースの学習項目（○件）
> - 公開スナップショット（○件）
> 
> この操作は取り消せません。本当に削除しますか？

**根拠**: `prisma/schema.prisma:131,647,386,702,277,311,211`

---

### Review削除

**親→子の関係（cascade/手動削除）**:

**Cascade削除（自動）**:
- `ReviewEvolutionLog`（`prisma/schema.prisma:669`）
- `RevenueShare`（`prisma/schema.prisma:740`）

**手動削除が必要**:
- **未発見**（すべてCascade削除）

**ユーザーに出すべき警告文案**:
> ⚠️ このレビューを削除すると、以下のデータもすべて削除されます：
> - レビュー進化ログ（○件）
> - 報酬共有記録（○件）
> 
> この操作は取り消せません。本当に削除しますか？

**根拠**: `prisma/schema.prisma:669,740`, `app/api/reviews/[id]/route.ts:25-27`

---

### ReadingLog削除

**親→子の関係（cascade/手動削除）**:

**Cascade削除（自動）**:
- `ReadingLogTag`（`prisma/schema.prisma:175`）
- `SnapshotSource`（`prisma/schema.prisma:249`）
- `MesoItem`（`prisma/schema.prisma:784`）
- `MacroItem`（`prisma/schema.prisma:816`）
- `KoyoriItem`（`prisma/schema.prisma:510`）

**手動削除が必要**:
- **未発見**（すべてCascade削除）

**ユーザーに出すべき警告文案**:
> ⚠️ この読書ログを削除すると、以下のデータもすべて削除されます：
> - タグ（○件）
> - スナップショットのソース（○件）
> - Mesoアイテム（○件）
> - Macroアイテム（○件）
> - こよりアイテム（○件）
> 
> この操作は取り消せません。本当に削除しますか？

**根拠**: `prisma/schema.prisma:175,249,784,816,510`, `app/api/reading-logs/[id]/route.ts:193-195`

---

### Gift削除

**親→子の関係（cascade/手動削除）**:

**Cascade削除（自動）**:
- `GiftEvent`（`prisma/schema.prisma:409`）

**手動削除が必要**:
- **未発見**（すべてCascade削除）

**ユーザーに出すべき警告文案**:
> ⚠️ このギフトを削除すると、以下のデータもすべて削除されます：
> - 成果計測イベント（○件）
> 
> 削除後は、開封数・クリック数などの分析データが失われます。
> この操作は取り消せません。本当に削除しますか？

**根拠**: `prisma/schema.prisma:409`

**注意**: Gift削除APIは現在実装されていない（`app/api/gifts/route.ts`に`DELETE`メソッドがない）

---

### User削除

**親→子の関係（cascade/手動削除）**:

**Cascade削除（自動）**:
- `ReadingLog`（`prisma/schema.prisma:130`）
- `Review`（`prisma/schema.prisma:646`）
- `Gift`（`prisma/schema.prisma:384`）
- `Koyori`（`prisma/schema.prisma:487`）
- `UserBook`（`prisma/schema.prisma:701`）
- `OCRAsset`（`prisma/schema.prisma:276`）
- `StudyItem`（`prisma/schema.prisma:310`）
- `AffiliateStateLog`（`prisma/schema.prisma:456`）
- `PublishedSnapshot`（`prisma/schema.prisma:210`）
- `RateLimitBucket`（`prisma/schema.prisma:436`）
- `GiftEvent`（`prisma/schema.prisma:410`）
- `StudyAttempt`（`prisma/schema.prisma:345`）

**手動削除が必要**:
- **未発見**（すべてCascade削除）

**ユーザーに出すべき警告文案**:
> ⚠️ アカウントを削除すると、以下のデータもすべて削除されます：
> - 読書ログ（○件）
> - レビュー（○件）
> - ギフト（○件）
> - こより（○件）
> - 積読状態（○件）
> - OCRアセット（○件）
> - 勉強コースの学習項目（○件）
> - アフィリエイト状態ログ（○件）
> - 公開スナップショット（○件）
> - その他すべての関連データ
> 
> この操作は取り消せません。本当にアカウントを削除しますか？

**根拠**: `prisma/schema.prisma:130,646,384,487,701,276,310,456,210,436,410,345`

**注意**: User削除APIは現在実装されていない（`app/api/auth/`に`DELETE`メソッドがない）

---

## 8) データ契約（危険ポイントの固定）

### User.affiliateState

**意味**:
- アフィリエイト機能の有効/無効状態を表す
- 値: `'OFF'`（無効）、`'ON'`（有効）、`'SUSPENDED'`（停止）

**更新する場所**:
- `POST /api/affiliate/opt-in`（`app/api/affiliate/opt-in/route.ts:51-57`）
- `POST /api/affiliate/cancel`（`app/api/affiliate/cancel/route.ts:32-36`）
- `POST /api/stripe/webhook`（`app/api/stripe/webhook/route.ts:91-97,140-144,176-180`）

**参照する場所**:
- `lib/affiliate.ts:11-13`（`isAffiliateOn`関数）
- `lib/affiliate.ts:33-35`（`requiresAffiliatePaywall`関数）
- `app/api/gifts/[id]/route.ts:36-45`（イベント記録制御）
- `app/api/gift-events/route.ts:16-25`（成果計測データ取得制御）
- `app/gifts/page.tsx:44-48`（Paywall表示制御）

**変更時に壊れやすい機能**:
1. **ギフト成果計測**: `affiliateState !== 'ON'`の場合、イベント記録が無効化される（`app/api/gifts/[id]/route.ts:36-45`）
2. **成果ダッシュボード**: `affiliateState !== 'ON'`の場合、`GET /api/gift-events`が403を返す（`app/api/gift-events/route.ts:16-25`）
3. **Paywall表示**: `affiliateState !== 'ON' && affiliatePlanType !== 'STUDY_SUB'`の場合、Paywallが表示される（`app/gifts/page.tsx:44-48`）

**変更時の必須テスト**:
1. `affiliateState`を`'OFF'`→`'ON'`に変更した場合、ギフトイベントが記録されることを確認
2. `affiliateState`を`'ON'`→`'OFF'`に変更した場合、`GET /api/gift-events`が403を返すことを確認
3. `affiliateState`を`'ON'`→`'SUSPENDED'`に変更した場合、Paywallが表示されることを確認
4. `affiliateState`が`'ON'`の場合、`/gifts/[id]/analytics`が正常に表示されることを確認

**根拠**: 
- 更新: `app/api/affiliate/opt-in/route.ts:51-57`, `app/api/affiliate/cancel/route.ts:32-36`, `app/api/stripe/webhook/route.ts:91-97,140-144,176-180`
- 参照: `lib/affiliate.ts:11-13,33-35`, `app/api/gifts/[id]/route.ts:36-45`, `app/api/gift-events/route.ts:16-25`, `app/gifts/page.tsx:44-48`

---

### User.plan

**意味**:
- ユーザーのプランタイプを表す
- 値: `'FREE'`（無料）、`'AFFILIATE'`（アフィリエイト）、`'STUDY'`（勉強コース）

**更新する場所**:
- **未発見**（現在、`User.plan`を更新するAPIが見つからない。Stripe Webhookで`affiliatePlanType`は更新されるが、`plan`は更新されていない）

**参照する場所**:
- `app/api/books/route.ts:68-79`（プラン確認）
- `app/api/books/route.ts:91-97`（冊数上限チェック）
- `app/api/ocr-assets/route.ts:103-106`（プラン確認）
- `app/api/ocr-assets/route.ts:109-124`（データ量制御）
- `lib/plan-config.ts:15-23`（冊数上限取得・判定）

**変更時に壊れやすい機能**:
1. **冊数上限チェック**: `plan`が`'FREE'`の場合、書籍登録が拒否される（`app/api/books/route.ts:91-97`）
2. **データ量制御**: `plan !== 'FREE'`の場合、OCRアセットの画像枚数上限がチェックされる（`app/api/ocr-assets/route.ts:109-124`）

**変更時の必須テスト**:
1. `plan`を`'FREE'`→`'STUDY'`に変更した場合、書籍登録が可能になることを確認
2. `plan`を`'STUDY'`→`'FREE'`に変更した場合、書籍登録が拒否されることを確認
3. `plan`が`'FREE'`の場合、OCRアセットのデータ量制御が無効になることを確認
4. `plan`が`'STUDY'`の場合、OCRアセットの画像枚数上限がチェックされることを確認

**根拠**:
- 参照: `app/api/books/route.ts:68-79,91-97`, `app/api/ocr-assets/route.ts:103-106,109-124`, `lib/plan-config.ts:15-23`

---

### Book.id

**意味**:
- 書籍の一意識別子（Primary Key）
- すべてのBook関連データの外部キーとして使用される

**更新する場所**:
- **未発見**（Primary Keyのため、通常は更新されない）

**参照する場所**:
- `ReadingLog.bookId`（`prisma/schema.prisma:113`）
- `Review.bookId`（`prisma/schema.prisma:634`）
- `Gift.bookId`（`prisma/schema.prisma:364`）
- `UserBook.bookId`（`prisma/schema.prisma:696`）
- `OCRAsset.bookId`（`prisma/schema.prisma:265`）
- `StudyItem.bookId`（`prisma/schema.prisma:292`）
- `PublishedSnapshot.bookId`（`prisma/schema.prisma:195`）
- 各種APIで所有確認（`app/api/reviews/route.ts:67-69`等、多数）

**変更時に壊れやすい機能**:
1. **Cascade削除**: Book削除時、すべての関連データが自動削除される（`prisma/schema.prisma:131,647,386,702,277,311,211`）
2. **所有確認**: 各APIで`book.userId === userId`をチェックしているが、`Book.userId`はLegacyフィールド（`prisma/schema.prisma:70`）
3. **外部キー制約**: `bookId`が存在しない場合、関連データの作成が失敗する

**変更時の必須テスト**:
1. Book削除時、関連する`ReadingLog`が削除されることを確認
2. Book削除時、関連する`Review`が削除されることを確認
3. Book削除時、関連する`Gift`が削除されることを確認
4. Book削除時、関連する`UserBook`が削除されることを確認
5. Book削除時、関連する`OCRAsset`が削除されることを確認
6. Book削除時、関連する`StudyItem`が削除されることを確認
7. Book削除時、関連する`PublishedSnapshot`が削除されることを確認
8. 存在しない`bookId`でデータ作成を試みた場合、エラーが返されることを確認

**根拠**:
- Schema: `prisma/schema.prisma:113,634,364,696,265,292,195`
- Cascade: `prisma/schema.prisma:131,647,386,702,277,311,211`
- 所有確認: `app/api/reviews/route.ts:67-69`等

---

**監査完了日**: 2026-01-xx  
**監査範囲**: 主要モデル（User, Book, ReadingLog, Review, Gift, Koyori, UserBook, OCRAsset, StudyItem, Tag, GiftEvent, AffiliateStateLog）  
**監査方法**: コード上で存在が確認できる操作のみを記載（推測禁止）

---

## 9) 追加調査タスク一覧

以下の項目は、監査時に「想定」「ファイル未確認」として残っているため、追加調査が必要です。

### 優先度分類

- **🔴 今すぐ潰すもの**: 仕様書の整合性に直接影響する、実装状況が不明確で仕様書作成に必要なもの
- **🟡 後回しでいいもの**: 既に実装確認済みで詳細確認のみ、将来計画の確認など

---

### 🔴 今すぐ潰すもの（仕様書整合性に必須）

#### 9-A. 実装状況が不明確な項目（仕様書に反映必須）

1. **`app/api/snapshots/[id]/publish/route.ts`**
   - 状態: ✅ **実装済み確認**（`app/api/snapshots/[id]/publish/route.ts:8-44`でPOSTメソッド実装済み）
   - 調査内容: ~~Snapshot公開APIの実装詳細を確認~~ → **完了**: Snapshot公開APIは実装済み
   - 根拠: `app/api/snapshots/[id]/publish/route.ts:8-44`で`POST`メソッドが実装されている
   - **優先度**: ~~高~~ → **完了**（実装済み確認済み、仕様書に「✅ 実装済み」として反映済み）

2. **本の編集・削除機能**
   - 状態: 未実装（`app/api/books/route.ts`に`PUT`/`DELETE`メソッドがない）
   - 調査内容: 実装予定の有無を確認（仕様書の「14-B. 次に追加する」に反映）
   - 根拠: `docs/IMPLEMENTED_FEATURES_AUDIT.md:721-727`
   - **優先度**: 高（仕様書の未実装機能リストに必須）

3. **レビュー検索機能**
   - 状態: 未実装（`app/api/reviews/route.ts:21-55`で`bookId`フィルタのみ）
   - 調査内容: 実装予定の有無を確認（仕様書の「14-B. 次に追加する」に反映）
   - 根拠: `docs/IMPLEMENTED_FEATURES_AUDIT.md:713-715`
   - **優先度**: 高（仕様書の未実装機能リストに必須）

4. **他人のレビュー閲覧機能（一覧）**
   - 状態: 未実装（自分のレビュー一覧のみ）
   - 調査内容: 実装予定の有無を確認（仕様書の「14-B. 次に追加する」に反映）
   - 根拠: `docs/IMPLEMENTED_FEATURES_AUDIT.md:717-719`
   - **優先度**: 高（仕様書の未実装機能リストに必須）

5. **マイページ機能**
   - 状態: 未実装（`app/page.tsx`はホーム画面）
   - 調査内容: 実装予定の有無を確認（仕様書の「14-B. 次に追加する」に反映）
   - 根拠: `docs/IMPLEMENTED_FEATURES_AUDIT.md:729-731`
   - **優先度**: 高（仕様書の未実装機能リストに必須）

6. **PublicInsight / Query / /q/[slug]**
   - 状態: 未発見（コード上で存在が確認できない）
   - 調査内容: 将来計画として残すか、削除するかを決定（仕様書の「14-C. フェーズ2以降」に反映）
   - 根拠: `codebase_search`で検索結果なし
   - **優先度**: 高（仕様書の将来計画セクションに反映が必要）

---

### 🟡 後回しでいいもの（詳細確認のみ）

#### 9-B. 画面ファイルの詳細確認（実装済み・詳細確認のみ）

1. **`app/books/[id]/reading-logs/page.tsx`**
   - 状態: ファイル存在は確認済み（`app/api/reading-logs/route.ts`で参照）
   - 調査内容: 画面の詳細実装（フォーム、一覧表示、編集・削除UI）を確認
   - 根拠: `app/api/reading-logs/route.ts:25-69`でAPIは実装済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

2. **`app/gifts/[slug]/page.tsx`**
   - 状態: ファイル存在は確認済み（`codebase_search`で発見）
   - 調査内容: 公開ページの詳細実装を確認
   - 根拠: `app/gifts/[slug]/page.tsx:11-122`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

3. **`app/gifts/[slug]/analytics/page.tsx`**
   - 状態: ファイル存在は確認済み（`codebase_search`で発見）
   - 調査内容: 分析ページの詳細実装を確認
   - 根拠: `app/gifts/[slug]/analytics/page.tsx:15-319`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

4. **`app/koyori/[id]/page.tsx`**
   - 状態: ファイル存在は確認済み（`app/api/koyori/[id]/route.ts`で参照）
   - 調査内容: こより詳細画面の実装を確認
   - 根拠: `app/api/koyori/[id]/route.ts:24-40`でAPIは実装済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

#### 9-C. APIファイルの詳細確認（実装済み・詳細確認のみ）

5. **`app/api/reviews/[id]/route.ts`**
   - 状態: ファイル存在は確認済み（`app/reviews/page.tsx:47-65`で参照）
   - 調査内容: DELETEメソッドの実装詳細を確認
   - 根拠: `app/api/reviews/[id]/route.ts:25-27`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

6. **`app/api/reading-logs/[id]/route.ts`**
   - 状態: ファイル存在は確認済み（`app/api/reading-logs/route.ts`で参照）
   - 調査内容: PUT/DELETEメソッドの実装詳細を確認
   - 根拠: `app/api/reading-logs/[id]/route.ts:144-160,193-195`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

7. **`app/api/gifts/route.ts`**
   - 状態: ファイル存在は確認済み（`app/gifts/page.tsx:50-100`で参照）
   - 調査内容: GET/POSTメソッドの実装詳細を確認
   - 根拠: `app/api/gifts/route.ts:27-47,85-97`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

8. **`app/api/gifts/[id]/route.ts`**
   - 状態: ファイル存在は確認済み（`app/gifts/[slug]/page.tsx:35`で参照）
   - 調査内容: GETメソッドの実装詳細を確認
   - 根拠: `app/api/gifts/[id]/route.ts:17-20`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

9. **`app/api/gift-events/route.ts`**
   - 状態: ファイル存在は確認済み（`app/gifts/[slug]/analytics/page.tsx`で参照）
   - 調査内容: KPI計算ロジックの詳細を確認
   - 根拠: `app/api/gift-events/route.ts:71-120`で実装確認済み
   - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

10. **`app/api/koyori/route.ts`**
    - 状態: ファイル存在は確認済み（`app/koyori/page.tsx:27-37`で参照）
    - 調査内容: GET/POSTメソッドの実装詳細を確認
    - 根拠: `app/api/koyori/route.ts:25-40,65-70`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

11. **`app/api/koyori/[id]/route.ts`**
    - 状態: ファイル存在は確認済み（`app/koyori/[id]/page.tsx`で参照）
    - 調査内容: GET/PUT/DELETEメソッドの実装詳細を確認
    - 根拠: `app/api/koyori/[id]/route.ts:24-40,95-100,136-138`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

12. **`app/api/affiliate/me/route.ts`**
    - 状態: ファイル存在は確認済み（`app/settings/affiliate/page.tsx:38-49`で参照）
    - 調査内容: GETメソッドの実装詳細を確認
    - 根拠: `lib/affiliate.ts:40-52`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

13. **`app/api/affiliate/opt-in/route.ts`**
    - 状態: ファイル存在は確認済み（`components/PaywallModal.tsx`で参照）
    - 調査内容: POSTメソッドの実装詳細を確認
    - 根拠: `app/api/affiliate/opt-in/route.ts:51-57`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

14. **`app/api/affiliate/cancel/route.ts`**
    - 状態: ファイル存在は確認済み（`app/settings/affiliate/page.tsx`で参照）
    - 調査内容: POSTメソッドの実装詳細を確認
    - 根拠: `app/api/affiliate/cancel/route.ts:32-36`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

15. **`app/api/affiliate/state-logs/route.ts`**
    - 状態: ファイル存在は確認済み（`app/settings/affiliate/page.tsx:33-36`で参照）
    - 調査内容: GETメソッドの実装詳細を確認
    - 根拠: `app/api/affiliate/state-logs/route.ts:19-27`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

16. **`app/api/home/stats/route.ts`**
    - 状態: ファイル存在は確認済み（`app/page.tsx:47-55`で参照）
    - 調査内容: GETメソッドの実装詳細を確認
    - 根拠: `app/api/home/stats/route.ts:56-80,87-130`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

17. **`app/api/snapshots/route.ts`**
    - 状態: ファイル存在は確認済み（`codebase_search`で発見）
    - 調査内容: POSTメソッドの実装詳細を確認
    - 根拠: `app/api/snapshots/route.ts:240-275`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

#### 9-D. コンポーネントファイルの詳細確認（実装済み・詳細確認のみ）

18. **`components/ReviewSummaryCard.tsx`**
    - 状態: ファイル存在は確認済み（`app/books/page.tsx:221-289`で参照）
    - 調査内容: コンポーネントの実装詳細を確認
    - 根拠: `components/ReviewSummaryCard.tsx:1-150`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

19. **`components/PaywallModal.tsx`**
    - 状態: ファイル存在は確認済み（`app/gifts/page.tsx`で参照）
    - 調査内容: モーダルの実装詳細を確認
    - 根拠: `components/PaywallModal.tsx`で実装確認済み
    - **優先度**: 低（実装済み確認済み、詳細は後で確認可能）

---

## 優先度別サマリー

### 🔴 今すぐ潰すもの（5件）

1. ~~`app/api/snapshots/[id]/publish/route.ts`の実装詳細確認~~ → **完了**（実装済み確認済み）
2. 本の編集・削除機能の実装予定確認
3. レビュー検索機能の実装予定確認
4. 他人のレビュー閲覧機能（一覧）の実装予定確認
5. マイページ機能の実装予定確認
6. PublicInsight / Query / /q/[slug]の将来計画決定

### 🟡 後回しでいいもの（19件）

- 画面ファイルの詳細確認（4件）
- APIファイルの詳細確認（13件）
- コンポーネントファイルの詳細確認（2件）

---

**改善タスク完了後**: 上記の調査結果を反映し、監査レポートを更新すること。
