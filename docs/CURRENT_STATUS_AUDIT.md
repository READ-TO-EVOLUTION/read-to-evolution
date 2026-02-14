# アプリ現状把握レポート（事実ベース）

**作成日**: 2026-01-xx  
**目的**: 推測なし・事実ベースで現在のアプリの状況を正確に把握する

---

## 1. 実装済みの事実（確定）

### 1.1 技術構成

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UI**: React 18.2.0 + Tailwind CSS
- **DB**: SQLite (開発環境)
- **ORM**: Prisma 5.7.1
- **認証方式**: JWT (jsonwebtoken) + Cookie (`token`)
- **認証ミドルウェア**: `lib/middleware.ts` (`requireAuth`, `getCurrentUser`)
- **決済**: Stripe (Webhook実装済み)

### 1.2 実装済み画面（page.tsx）

| パス | ファイル | 機能 |
|------|---------|------|
| `/` | `app/page.tsx` | ホーム画面（学習部屋） |
| `/login` | `app/login/page.tsx` | ログイン |
| `/register` | `app/register/page.tsx` | ユーザー登録 |
| `/books` | `app/books/page.tsx` | 本棚一覧（検索・フィルタ・ソート・ステータス更新・削除） |
| `/reviews` | `app/reviews/page.tsx` | レビュー一覧 |
| `/gifts` | `app/gifts/page.tsx` | ギフト管理 |
| `/gifts/[slug]` | `app/gifts/[slug]/page.tsx` | ギフト公開ページ |
| `/gifts/[slug]/analytics` | `app/gifts/[slug]/analytics/page.tsx` | ギフト分析 |
| `/koyori` | `app/koyori/page.tsx` | こより一覧 |
| `/notifications` | `app/notifications/page.tsx` | 通知一覧 |
| `/revenue-shares` | `app/revenue-shares/page.tsx` | 報酬履歴 |
| `/study/today` | `app/study/today/page.tsx` | 今日の復習一覧 |
| `/settings/affiliate` | `app/settings/affiliate/page.tsx` | アフィリエイト設定 |
| `/settings/character` | `app/settings/character/page.tsx` | キャラクター設定 |
| `/affiliate/dashboard` | `app/affiliate/dashboard/page.tsx` | アフィリエイト成果ダッシュボード |

### 1.3 実装済みAPI（route.ts）

#### 認証
- `POST /api/auth/register` (`app/api/auth/register/route.ts`)
- `POST /api/auth/login` (`app/api/auth/login/route.ts`)
- `POST /api/auth/logout` (`app/api/auth/logout/route.ts`)
- `GET /api/auth/me` (`app/api/auth/me/route.ts`)

#### 書籍
- `GET /api/books` (`app/api/books/route.ts`)
- `POST /api/books` (`app/api/books/route.ts`)
- `GET /api/book-search` (`app/api/book-search/route.ts`)
- `GET /api/book-search/config` (`app/api/book-search/config/route.ts`)
- `PUT /api/books/[bookId]` (`app/api/books/[bookId]/route.ts`) - UserBook.status更新
- `DELETE /api/books/[bookId]` (`app/api/books/[bookId]/route.ts`) - UserBook削除
- `GET /api/books/[bookId]/review-summary` (`app/api/books/[bookId]/review-summary/route.ts`)

#### レビュー
- `GET /api/reviews` (`app/api/reviews/route.ts`)
- `POST /api/reviews` (`app/api/reviews/route.ts`)
- `PUT /api/reviews/[id]` (`app/api/reviews/[id]/route.ts`)
- `DELETE /api/reviews/[id]` (`app/api/reviews/[id]/route.ts`)

#### 読書ログ
- `GET /api/reading-logs` (`app/api/reading-logs/route.ts`)
- `POST /api/reading-logs` (`app/api/reading-logs/route.ts`)
- `PUT /api/reading-logs/[id]` (`app/api/reading-logs/[id]/route.ts`)
- `DELETE /api/reading-logs/[id]` (`app/api/reading-logs/[id]/route.ts`)

#### ユーザー×本
- `GET /api/user-books` (`app/api/user-books/route.ts`)
- `POST /api/user-books` (`app/api/user-books/route.ts`)

#### ギフト
- `GET /api/gifts` (`app/api/gifts/route.ts`)
- `POST /api/gifts` (`app/api/gifts/route.ts`)
- `GET /api/gift-events` (`app/api/gift-events/route.ts`)

#### こより
- `GET /api/koyori` (`app/api/koyori/route.ts`)
- `POST /api/koyori` (`app/api/koyori/route.ts`)
- `GET /api/koyori/[id]` (`app/api/koyori/[id]/route.ts`)
- `PUT /api/koyori/[id]` (`app/api/koyori/[id]/route.ts`)
- `DELETE /api/koyori/[id]` (`app/api/koyori/[id]/route.ts`)
- `POST /api/koyori/[id]/items` (`app/api/koyori/[id]/items/route.ts`)
- `POST /api/koyori/[id]/items/reorder` (`app/api/koyori/[id]/items/reorder/route.ts`)
- `PUT /api/koyori/items/[itemId]` (`app/api/koyori/items/[itemId]/route.ts`)
- `DELETE /api/koyori/items/[itemId]` (`app/api/koyori/items/[itemId]/route.ts`)

#### アフィリエイト
- `GET /api/affiliate/me` (`app/api/affiliate/me/route.ts`)
- `POST /api/affiliate/opt-in` (`app/api/affiliate/opt-in/route.ts`)
- `POST /api/affiliate/cancel` (`app/api/affiliate/cancel/route.ts`)
- `GET /api/affiliate/state-logs` (`app/api/affiliate/state-logs/route.ts`)
- `POST /api/affiliate/book-links` (`app/api/affiliate/book-links/route.ts`)

#### 勉強コース
- `GET /api/study-items` (`app/api/study-items/route.ts`)
- `POST /api/study-items` (`app/api/study-items/route.ts`)
- `PUT /api/study-items/[id]` (`app/api/study-items/[id]/route.ts`)
- `GET /api/study-items/explanations` (`app/api/study-items/explanations/route.ts`)
- `POST /api/study-items/[id]/select-explanation` (`app/api/study-items/[id]/select-explanation/route.ts`)
- `GET /api/study-records/today` (`app/api/study-records/today/route.ts`)
- `POST /api/study-records` (`app/api/study-records/route.ts`)
- `GET /api/ocr-assets` (`app/api/ocr-assets/route.ts`)
- `POST /api/ocr-assets` (`app/api/ocr-assets/route.ts`)
- `GET /api/ocr-texts` (`app/api/ocr-texts/route.ts`)
- `POST /api/ocr-texts` (`app/api/ocr-texts/route.ts`)

#### その他
- `GET /api/home/stats` (`app/api/home/stats/route.ts`)
- `GET /api/snapshots` (`app/api/snapshots/route.ts`)
- `POST /api/snapshots/publish` (`app/api/snapshots/publish/route.ts`)
- `GET /api/mesos` (`app/api/mesos/route.ts`)
- `POST /api/mesos` (`app/api/mesos/route.ts`)
- `GET /api/macros` (`app/api/macros/route.ts`)
- `POST /api/macros` (`app/api/macros/route.ts`)
- `GET /api/notifications` (`app/api/notifications/route.ts`)
- `POST /api/reading-progress` (`app/api/reading-progress/route.ts`)
- `GET /api/revenue-shares` (`app/api/revenue-shares/route.ts`)
- `POST /api/stripe/webhook` (`app/api/stripe/webhook/route.ts`)
- `GET /api/location/default` (`app/api/location/default/route.ts`)
- `GET /api/assets` (`app/api/assets/route.ts`)

### 1.4 DBモデル一覧（prisma/schema.prisma）

#### 主要モデル（現行使用）
- **User** (`prisma/schema.prisma:15-66`)
  - フィールド: `id`, `email`, `name`, `passwordHash`, `plan`, `affiliateState`, `affiliatePlanType`, `stripeCustomerId`, `stripeSubscriptionId`, 等
  - `userId`: なし（主キーは`id`）
  - `bookId`: なし
  - `isPublic`: なし
- **Book** (`prisma/schema.prisma:68-102`)
  - フィールド: `id`, `title`, `author`, `isbn13`, `publisher`, `publishedDate`, `coverImageUrl`, `userId` (Legacy)
  - `userId`: あり（Legacy、後で削除予定）
  - `bookId`: なし（主キーは`id`）
  - `isPublic`: なし
- **ReadingLog** (`prisma/schema.prisma:109-147`)
  - フィールド: `id`, `userId`, `bookId`, `rangeType`, `rangeText`, `pointText`, `reaction`, `visibility`, 等
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし（`visibility`フィールドで管理: PRIVATE/PARTIAL/PUBLIC）
- **Review** (`prisma/schema.prisma:631-654`)
  - フィールド: `id`, `userId`, `bookId`, `rating`, `comment`, `isPublic`, `hasSpoiler`, 等
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: あり（Boolean）
- **UserBook** (`prisma/schema.prisma:693-708`)
  - フィールド: `id`, `userId`, `bookId`, `status` (TSUNDOKU/READING/FINISHED/PAUSED)
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **Gift** (`prisma/schema.prisma:357-394`)
  - フィールド: `id`, `senderUserId`, `recipientUserId`, `bookId`, `giftToken`, `status`, 等
  - `userId`: なし（`senderUserId`, `recipientUserId`で管理）
  - `bookId`: あり
  - `isPublic`: なし
- **Koyori** (`prisma/schema.prisma:478-492`)
  - フィールド: `id`, `userId`, `title`, `memo`, `visibility`
  - `userId`: あり
  - `bookId`: なし
  - `isPublic`: なし（`visibility`フィールドで管理: PRIVATE）
- **OCRAsset** (`prisma/schema.prisma:262-283`)
  - フィールド: `id`, `userId`, `bookId`, `imageUrl`, `extractedText`, `pageNo`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **StudyItem** (`prisma/schema.prisma:289-319`)
  - フィールド: `id`, `userId`, `bookId`, `promptText`, `answerText`, `explanationText`, `pointText`, `pointMarked`, `pointMarkedAt`, `isGraduated`, `graduatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **StudyAttempt** (`prisma/schema.prisma:321-351`)
  - フィールド: `id`, `studyItemId`, `userId`, `recallResult`, `pointText`, `pointMarked`, `confusionToUnderstanding`
  - `userId`: あり
  - `bookId`: なし（`studyItemId`経由）
  - `isPublic`: なし
- **PublishedSnapshot** (`prisma/schema.prisma:188-224`)
  - フィールド: `id`, `type`, `status`, `ownerUserId`, `bookId`, `publicTitle`, `publicText`, `visibility`
  - `userId`: なし（`ownerUserId`で管理）
  - `bookId`: あり
  - `isPublic`: なし（`visibility`フィールドで管理: PRIVATE/PARTIAL/PUBLIC）
- **Tag** (`prisma/schema.prisma:154-166`)
- **ReadingLogTag** (`prisma/schema.prisma:168-181`)
- **SnapshotSource** (`prisma/schema.prisma:234-256`)
- **GiftEvent** (`prisma/schema.prisma:396-416`)
- **KoyoriItem** (`prisma/schema.prisma:494-516`)
- **AffiliateStateLog** (`prisma/schema.prisma:447-461`)
- **RateLimitBucket** (`prisma/schema.prisma:423-441`)
- **WebhookEventLog** (`prisma/schema.prisma:467-472`)

#### Legacyモデル（後で削除予定）
- **Subscription** (`prisma/schema.prisma:522-534`)
- **Material** (`prisma/schema.prisma:536-549`)
- **Asset** (`prisma/schema.prisma:551-567`)
- **StudyRecord** (`prisma/schema.prisma:569-600`)
- **ReviewSchedule** (`prisma/schema.prisma:602-614`)
- **ReviewLog** (`prisma/schema.prisma:616-629`)
- **ReviewEvolutionLog** (`prisma/schema.prisma:656-672`)
- **ReadingProgress** (`prisma/schema.prisma:674-687`)
- **Notification** (`prisma/schema.prisma:710-725`)
- **RevenueShare** (`prisma/schema.prisma:727-743`)
- **OcrText** (`prisma/schema.prisma:745-757`)
- **Meso** (`prisma/schema.prisma:759-774`)
- **MesoItem** (`prisma/schema.prisma:776-788`)
- **Macro** (`prisma/schema.prisma:790-805`)
- **MacroItem** (`prisma/schema.prisma:807-820`)

### 1.5 バックグラウンド処理

- **Stripe Webhook処理**: `app/api/stripe/webhook/route.ts` - 決済イベント処理、サブスクリプション管理
- **アフィリエイト状態ログ記録**: `lib/affiliate.ts` (`logAffiliateStateChange`) - 状態変更の証跡保存

---

## 2. 未実装だがコード上に存在するもの（準確定）

### 2.1 TODOコメント

- **アフィリエイトURL生成ロジック** (`app/api/affiliate/book-links/route.ts:41-43`)
  - 内容: `// TODO: 実際のアフィリエイトURL生成ロジック`、`// TODO: アフィリエイトパラメータ付与`
  - 状態: 部分実装（APIは存在するが、実際のURL生成ロジックは未実装）

### 2.2 定義されているが未使用のフィールド

- **User.name** (`prisma/schema.prisma:18`)
  - 状態: DBフィールドは存在、APIで参照可能（`app/api/books/[bookId]/review-summary/route.ts:60,73`）
  - 未実装: ユーザー登録時に`name`を入力するUI導線がない（`app/api/auth/register/route.ts:32-43`で設定されていない）

- **Review.recommendedBooks** (`prisma/schema.prisma:640`, `app/api/reviews/route.ts:13`)
  - 状態: DBフィールド・APIスキーマは存在
  - 未実装: UIで入力・送信する導線がない（`app/books/[id]/review/page.tsx`で送信されていない）

- **StudyItem.pointText, pointMarked, pointMarkedAt** (`prisma/schema.prisma:300-302`)
  - 状態: DBフィールドは存在
  - 未実装: 論点マークUI・APIが未確認（`codebase_search`で実装が見つからない）

- **StudyItem.isGraduated, graduatedAt** (`prisma/schema.prisma:304-305`)
  - 状態: DBフィールドは存在
  - 未実装: 卒業判定UI・APIが未確認（`codebase_search`で実装が見つからない）

- **StudyAttempt.pointText, pointMarked** (`prisma/schema.prisma:336-337`)
  - 状態: DBフィールドは存在
  - 未実装: 復習時の論点記述・マークUIが未確認

### 2.3 環境変数依存機能（設定されていない場合はスキップ）

- **楽天書籍検索API**: `process.env.RAKUTEN_APPLICATION_ID` (`app/api/book-search/route.ts`)
- **Amazon書籍検索API**: `process.env.AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, `AMAZON_PAAPI_PARTNER_TAG` (`app/api/book-search/route.ts`)
- **Stripe Webhook**: `process.env.STRIPE_WEBHOOK_SECRET` (`app/api/stripe/webhook/route.ts`)

### 2.4 Legacyモデル（後で削除予定だが現在も使用中）

- **Book.userId** (`prisma/schema.prisma:70`) - Legacy: 後で削除予定
- **PublishedSnapshot.slug** (`prisma/schema.prisma:208`) - Legacy: 後で削除予定
- **User.books, subscriptions, studyRecords, reviews, readingProgress, notifications, revenueShares, mesos, macros** (`prisma/schema.prisma:52-60`) - Legacy relations (後で削除予定)

---

## 3. 確定ではない案（バックログ・アイデア）

### 3.1 仕様書に記載があるが未実装の機能

#### 優先度：高（docs/SPEC_FINAL_CONSISTENT.md:419-436）
- **本の編集機能**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:421-423`
  - 状態: 未着手（`app/api/books/route.ts`に`PUT`メソッドがない）
  - 備考: `PUT /api/books/[bookId]`は存在するが、これは`UserBook.status`更新用。Bookマスタ編集用ではない

- **本の削除機能**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:425-427`
  - 状態: 実装済み（`DELETE /api/books/[bookId]`は`UserBook`削除用として実装済み）
  - 備考: 仕様書では「未実装」と記載されているが、実際には実装済み

- **ユーザー名入力機能**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:429-431`
  - 状態: 未着手（登録フォームに`name`入力欄がない）

- **おすすめ本機能（UI実装）**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:433-435`
  - 状態: 部分実装（DB/APIは存在、UI導線がない）

#### 優先度：中（docs/SPEC_FINAL_CONSISTENT.md:437-450）
- **レビュー検索機能**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:439-441`
  - 状態: 未着手（`app/api/reviews/route.ts:21-55`で`bookId`フィルタのみ）

- **他人のレビュー閲覧機能（一覧）**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:443-445`
  - 状態: 未着手（`app/api/reviews/route.ts:29`で`where: { userId }`のみ）

- **マイページ機能**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:447-449`
  - 状態: 未着手（`app/page.tsx`はホーム画面であり、マイページではない）

#### 優先度：低（docs/SPEC_FINAL_CONSISTENT.md:451-456）
- **料金設定の統一**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:453-455`
  - 状態: 不一致（仕様書と`lib/plan-config.ts`で料金が異なる）

### 3.2 フェーズ2以降（将来計画）（docs/SPEC_FINAL_CONSISTENT.md:459-469）

- **PublicInsight / Query / /q/[slug]**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:461-464`
  - 状態: 未発見（コード上で存在が確認できない）
  - 判断: 将来計画として残す（実装予定が明確になるまで保留）

- **横断検索（有料）**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:466`
  - 状態: 構想のみ（論点×反応×期間での横断検索）

- **成長可視化機能（有料）**
  - 出典: `docs/SPEC_FINAL_CONSISTENT.md:468`
  - 状態: 構想のみ（理解までの日数推移、混乱→理解回数、Before/After等の可視化）

### 3.3 READMEに記載があるが未実装の機能（README.md:52-57）

- **無料ユーザー：読書進捗入力 → 空背景変化**
  - 出典: `README.md:54`
  - 状態: 未確認（実装状況不明）

- **ファイルアップロード機能（現在はURL入力）**
  - 出典: `README.md:55`
  - 状態: 未確認（現在はURL入力のみ）

- **通知機能**
  - 出典: `README.md:56`
  - 状態: 実装済み（`app/notifications/page.tsx`, `app/api/notifications/route.ts`）

- **プラン管理・決済機能**
  - 出典: `README.md:57`
  - 状態: 部分実装（Stripe Webhookは実装済み、プラン選択UIは未確認）

### 3.4 仕様書に記載があるが実装状況不明の機能

- **勉強コースプラン選択画面** (`docs/FEATURE_LIST.md:93`)
  - 状態: 未確認（`TODO:確認が必要`）

- **StudyItem作成画面** (`docs/FEATURE_LIST.md:94`)
  - 状態: 未確認（`TODO:確認が必要`）

- **論点マーク機能** (`docs/FEATURE_LIST.md:108`)
  - 状態: 未確認（DBモデルは存在）

- **卒業判定機能** (`docs/FEATURE_LIST.md:109`)
  - 状態: 未確認（DBモデルは存在、`lib/review-engine.ts:83-93`に`checkGraduation`関数は存在）

### 3.5 料金プラン不一致

- **実装済みプラン** (`lib/plan-config.ts:5-11`): 3冊(450円), 5冊(700円), 10冊(1400円), 20冊(2600円)
- **仕様書記載プラン** (`docs/SPEC_FINAL_CONSISTENT.md:280-285`): 3冊(600円), 10冊(1500円), 20冊(2600円), 30冊(3600円), 50冊(5000円)
- **不一致**: 3冊・10冊の料金が異なる、30冊・50冊プランは未実装

---

## 4. 明確に「未対応・未存在」と言えるもの

### 4.1 仕様書に記載があるが実装痕跡がない機能

- **PublicInsight / Query / /q/[slug]**: コード上で存在が確認できない（`codebase_search`で検索結果なし）

### 4.2 仕様書に記載があるが実装されていないAPI

- **本の編集API（Bookマスタ編集）**: `PUT /api/books/[id]`（Bookマスタ編集用）は存在しない（`PUT /api/books/[bookId]`は`UserBook.status`更新用）
- **レビュー検索API**: `GET /api/reviews?q=検索語`は存在しない（`bookId`フィルタのみ）
- **他人のレビュー一覧API**: `GET /api/reviews/public?bookId=xxx`は存在しない

### 4.3 仕様書に記載があるが実装されていない画面

- **マイページ**: `/profile`は存在しない
- **他人のレビュー一覧**: `/reviews/public`は存在しない

### 4.4 仕様書に記載があるが実装されていないプラン

- **30冊プラン**: `lib/plan-config.ts`に存在しない
- **50冊プラン**: `lib/plan-config.ts`に存在しない

---

## 補足：実装状況の判定基準

- **✅ 実装済み**: コード上で存在が確認できる機能（ファイルパス:行番号で根拠あり）
- **🟡 部分実装**: フィールドやAPIスキーマは存在するが、UI導線がない
- **🔴 未発見**: コード上で存在が確認できない機能

---

最終更新: 2026-01-xx
