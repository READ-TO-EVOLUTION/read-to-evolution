# アプリケーション現状監査レポート

**調査日**: 2026-02-08  
**更新日**: 2026-02-11（レビュー中心導線／報酬ゲート／構造化フォームの矛盾解消を反映）  
**調査方法**: コードベース・ドキュメントの事実ベース確認  
**推測語禁止**: 根拠が無い場合は「不明」と記載  
**基準点**: `docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v2.md`を参照

---

## 1. 実装済みの事実（確定）

### 1.1 技術構成

#### フレームワーク
- **Next.js 14.2.35** (App Router)
  - 根拠: `package.json:28`
  - 設定: `next.config.js:1-45`

#### データベース / ORM
- **SQLite** (開発環境)
  - 根拠: `prisma/schema.prisma:11-12` (`provider = "sqlite"`)
- **Prisma 5.7.1**
  - 根拠: `package.json:17,46`
  - クライアント: `lib/prisma.ts:1-9`

#### 認証方式
- **JWT (jsonwebtoken 9.0.2) + bcryptjs 2.4.3**
  - 根拠: `package.json:21,25`
  - 実装: `lib/auth.ts:1-28`
  - トークン保存: Cookie (`token`)
    - 根拠: `lib/middleware.ts:7` (`cookieStore.get('token')`)
    - 設定: `app/api/auth/login/route.ts:43` (`cookieStore.set('token', token, ...)`)

#### その他主要ライブラリ
- **Zod 3.22.4** (バリデーション)
  - 根拠: `package.json:34`
- **Stripe 20.2.0** (決済)
  - 根拠: `package.json:32`
- **React 18.2.0** / **React DOM 18.2.0**
  - 根拠: `package.json:29-30`
- **Tailwind CSS 3.4.0**
  - 根拠: `package.json:47`

### 1.2 実装済み画面（page.tsx）

- `/` - ホーム画面
  - 根拠: `app/page.tsx:1-212`
- `/login` - ログイン画面
  - 根拠: `app/login/page.tsx:1-175`
- `/register` - 新規登録画面
  - 根拠: `app/register/page.tsx:1-85`
- `/books` - 本棚一覧
  - 根拠: `app/books/page.tsx:1-638`
  - 機能: 公開レビュー一覧表示（`PublicReviewsList`コンポーネント使用）
    - 根拠: `app/books/page.tsx:8,568-569`
- `/reviews` - レビュー一覧
  - 根拠: `app/reviews/page.tsx:1-207`
  - 機能: レビュー検索（`searchKeywords`と`comment`で部分一致検索）
    - 根拠: `app/reviews/page.tsx:24,30-48,50-58,86-102`
- `/gifts` - ギフト管理
  - 根拠: `app/gifts/page.tsx:1-504`
- `/gifts/[slug]` - ギフト公開ページ
  - 根拠: `app/gifts/[slug]/page.tsx:1-123`
- `/gifts/[slug]/analytics` - ギフト分析
  - 根拠: `app/gifts/[slug]/analytics/page.tsx:1-320`
- `/koyori` - こより一覧
  - 根拠: `app/koyori/page.tsx:1-90`
- `/settings/affiliate` - アフィリエイト設定
  - 根拠: `app/settings/affiliate/page.tsx:1-283`
- `/affiliate/dashboard` - 成果ダッシュボード
  - 根拠: `app/affiliate/dashboard/page.tsx:1-209`
- `/notifications` - 通知一覧
  - 根拠: `app/notifications/page.tsx:1-202`
- `/revenue-shares` - 報酬一覧
  - 根拠: `app/revenue-shares/page.tsx:1-142`
- `/settings/character` - キャラクター設定
  - 根拠: `app/settings/character/page.tsx:1-72`
- `/study/today` - 今日の復習一覧
  - 根拠: `app/study/today/page.tsx:1-173`
- `/r` - みんなのレビュー（公開レビュー一覧、未ログイン可）
  - 根拠: `app/r/page.tsx:1-200`
  - 機能: 構造化ブロック優先表示（買う理由、良かった点、足りない点、悪かった点、読んだ日、ページ数、引用）

### 1.3 実装済みAPI（route.ts）

#### 認証API
- `POST /api/auth/register` - ユーザー登録
  - 根拠: `app/api/auth/register/route.ts:1-（全行）`
- `POST /api/auth/login` - ログイン
  - 根拠: `app/api/auth/login/route.ts:1-（全行）`
- `POST /api/auth/logout` - ログアウト
  - 根拠: `app/api/auth/logout/route.ts:1-（全行）`
- `GET /api/auth/me` - 現在のユーザー情報取得
  - 根拠: `app/api/auth/me/route.ts:1-（全行）`

#### 書籍API
- `GET /api/books` - 書籍一覧取得
  - 根拠: `app/api/books/route.ts:1-145`
- `POST /api/books` - 書籍作成
  - 根拠: `app/api/books/route.ts:1-145`
- `PUT /api/books/[bookId]` - UserBookステータス更新
  - 根拠: `app/api/books/[bookId]/route.ts:1-219`
- `DELETE /api/books/[bookId]` - UserBook削除（関連データ含む）
  - 根拠: `app/api/books/[bookId]/route.ts:101-218`
- `GET /api/books/[bookId]/review-summary` - レビューサマリー取得
  - 根拠: `app/api/books/[bookId]/review-summary/route.ts:1-（全行）`
- `GET /api/user-books` - ユーザー本棚一覧取得
  - 根拠: `app/api/user-books/route.ts:1-（全行）`

#### レビューAPI
- `GET /api/reviews` - レビュー一覧取得（検索対応）
  - 根拠: `app/api/reviews/route.ts:1-（全行）`
  - 検索: `q`パラメータで`searchKeywords`と`comment`を部分一致検索
    - 根拠: `app/api/reviews/route.ts:28,35-42`
- `POST /api/reviews` - レビュー作成
  - 根拠: `app/api/reviews/route.ts:1-（全行）`
- `DELETE /api/reviews/[id]` - レビュー削除
  - 根拠: `app/api/reviews/[id]/route.ts:1-（全行）`
- `GET /api/reviews/public` - 公開レビュー一覧取得（bookId任意、未ログイン可）
  - 根拠: `app/api/reviews/public/route.ts:1-112`
  - 変更: `bookId`を必須から任意に変更（`bookId`が指定されていない場合は全公開レビューを取得）
    - 根拠: `app/api/reviews/public/route.ts:16-19,33-37`
  - 構造化フィールド: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`を含む
    - 根拠: `app/api/reviews/public/route.ts:47-57`

#### ギフトAPI
- `GET /api/gifts` - ギフト一覧取得
  - 根拠: `app/api/gifts/route.ts:1-（全行）`
- `POST /api/gifts` - ギフト作成
  - 根拠: `app/api/gifts/route.ts:1-（全行）`
- `GET /api/gift-events` - ギフトイベント一覧取得
  - 根拠: `app/api/gift-events/route.ts:1-（全行）`

#### アフィリエイトAPI
- `GET /api/affiliate/me` - アフィリエイト状態取得
  - 根拠: `app/api/affiliate/me/route.ts:1-（全行）`
- `POST /api/affiliate/opt-in` - アフィリエイト加入
  - 根拠: `app/api/affiliate/opt-in/route.ts:1-（全行）`
- `POST /api/affiliate/cancel` - アフィリエイト解約
  - 根拠: `app/api/affiliate/cancel/route.ts:1-（全行）`
- `GET /api/affiliate/book-links` - アフィリエイト書籍リンク取得
  - 根拠: `app/api/affiliate/book-links/route.ts:1-（全行）`
- `GET /api/affiliate/state-logs` - アフィリエイト状態ログ取得
  - 根拠: `app/api/affiliate/state-logs/route.ts:1-（全行）`

#### 学習記録API
- `GET /api/study-records` - 学習記録一覧取得
  - 根拠: `app/api/study-records/route.ts:1-（全行）`
- `POST /api/study-records` - 学習記録作成
  - 根拠: `app/api/study-records/route.ts:1-（全行）`
- `GET /api/study-records/today` - 今日の復習一覧取得
  - 根拠: `app/api/study-records/today/route.ts:19-190`

#### StudyItem API
- `GET /api/study-items` - StudyItem一覧取得
  - 根拠: `app/api/study-items/route.ts:1-（全行）`
- `POST /api/study-items` - StudyItem作成
  - 根拠: `app/api/study-items/route.ts:1-（全行）`
- `GET /api/study-items/explanations` - StudyItem解説取得
  - 根拠: `app/api/study-items/explanations/route.ts:1-（全行）`

#### OCR API
- `GET /api/ocr-assets` - OCRアセット一覧取得
  - 根拠: `app/api/ocr-assets/route.ts:41-60`
- `POST /api/ocr-assets` - OCRアセット作成
  - 根拠: `app/api/ocr-assets/route.ts:136`
- `GET /api/ocr-texts` - OCRテキスト一覧取得
  - 根拠: `app/api/ocr-texts/route.ts:41-86`
- `POST /api/ocr-texts` - OCRテキスト作成
  - 根拠: `app/api/ocr-texts/route.ts:97`

#### Snapshot API
- `GET /api/snapshots` - Snapshot一覧取得
  - 根拠: `app/api/snapshots/route.ts:1-254`
- `POST /api/snapshots` - Snapshot作成
  - 根拠: `app/api/snapshots/route.ts:203-239`

#### Meso/Macro API
- `GET /api/mesos` - Meso一覧取得
  - 根拠: `app/api/mesos/route.ts:1-110`
- `POST /api/mesos` - Meso作成
  - 根拠: `app/api/mesos/route.ts:80-93`
- `GET /api/macros` - Macro一覧取得
  - 根拠: `app/api/macros/route.ts:1-154`
- `POST /api/macros` - Macro作成
  - 根拠: `app/api/macros/route.ts:83-149`

#### こよりAPI
- `GET /api/koyori` - こより一覧取得
  - 根拠: `app/api/koyori/route.ts:1-（全行）`
- `POST /api/koyori` - こより作成
  - 根拠: `app/api/koyori/route.ts:1-（全行）`
- `DELETE /api/koyori/items/[itemId]` - こよりアイテム削除
  - 根拠: `app/api/koyori/items/[itemId]/route.ts:83-85`

#### 書籍検索API
- `GET /api/book-search` - 外部書籍検索（楽天・Amazon）
  - 根拠: `app/api/book-search/route.ts:1-（全行）`
- `GET /api/book-search/config` - 書籍検索設定取得
  - 根拠: `app/api/book-search/config/route.ts:1-（全行）`

#### その他API
- `GET /api/home/stats` - ホーム統計情報取得
  - 根拠: `app/api/home/stats/route.ts:55-91`
- `GET /api/notifications` - 通知一覧取得
  - 根拠: `app/api/notifications/route.ts:1-56`
- `GET /api/revenue-shares` - 報酬一覧取得
  - 根拠: `app/api/revenue-shares/route.ts:1-69`
- `GET /api/reading-progress` - 読書進捗取得
  - 根拠: `app/api/reading-progress/route.ts:1-96`
- `GET /api/reading-logs` - 読書ログ一覧取得
  - 根拠: `app/api/reading-logs/route.ts:1-（全行）`
- `POST /api/reading-logs` - 読書ログ作成
  - 根拠: `app/api/reading-logs/route.ts:1-（全行）`
- `GET /api/assets` - アセット一覧取得
  - 根拠: `app/api/assets/route.ts:1-47`
- `GET /api/location/default` - デフォルト位置情報取得
  - 根拠: `app/api/location/default/route.ts:25-47`
- `POST /api/stripe/webhook` - Stripe Webhook処理
  - 根拠: `app/api/stripe/webhook/route.ts:10-223`

### 1.4 バックグラウンド処理

- **Stripe Webhook処理**
  - 根拠: `app/api/stripe/webhook/route.ts:10-223`
  - 処理内容: 決済イベント処理、サブスクリプション管理、アフィリエイト状態更新
- **アフィリエイト状態ログ記録**
  - 根拠: `lib/affiliate.ts:59-82` (`logAffiliateStateChange`)

### 1.5 実装済みコンポーネント

- **`components/PublicReviewsList.tsx`**
  - 機能: 公開レビュー一覧を表示するコンポーネント
  - API: `GET /api/reviews/public?bookId=...&limit=...&offset=0`を呼び出す
  - 表示項目: ユーザー名、評価（★）、構造化ブロック（買う理由、良かった点、足りない点、悪かった点、読んだ日、ページ数、引用）、自由記述（コメント、お気に入りフレーズ、検索ワード）、感情タグ、ネタバレフラグ、作成日
  - 根拠: `components/PublicReviewsList.tsx:1-150`（構造化ブロック追加後）

- **`components/ReviewForm.tsx`**
  - 機能: 構造化レビュー投稿フォーム
  - 必須項目: `rating`, `emotionTag`
  - 構造化フィールド: `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
  - 自由記述: `comment`, `searchKeywords`, `favoritePhrase`
  - 根拠: `components/ReviewForm.tsx:1-250`

### 1.6 データベースモデル（Prisma Schema）

#### 主要モデル
- **User** (`prisma/schema.prisma:15-66`)
  - フィールド: `id`, `email`, `name`, `passwordHash`, `plan`, `affiliateState`, `affiliatePlanType`, `stripeCustomerId`, `stripeSubscriptionId`, `createdAt`, `updatedAt`
  - `userId`: なし（User自身）
  - `bookId`: なし
  - `isPublic`: なし
- **Book** (`prisma/schema.prisma:68-102`)
  - フィールド: `id`, `userId` (Legacy), `title`, `author`, `isbn13`, `publisher`, `publishedDate`, `coverImageUrl`, `createdAt`, `updatedAt`
  - `userId`: あり（Legacy、後で削除予定）
  - `bookId`: なし（Book自身）
  - `isPublic`: なし
- **UserBook** (`prisma/schema.prisma:693-708`)
  - フィールド: `id`, `userId`, `bookId`, `status`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **ReadingLog** (`prisma/schema.prisma:109-147`)
  - フィールド: `id`, `userId`, `bookId`, `rangeType`, `rangeText`, `pointText`, `reaction`, `questionText`, `privateMemo`, `highlightText`, `visibility`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし（`visibility`フィールドで管理: `PRIVATE`, `PARTIAL`, `PUBLIC`）
- **Review** (`prisma/schema.prisma:631-654`)
  - フィールド: `id`, `userId`, `bookId`, `rating`, `comment`, `searchKeywords`, `favoritePhrase`, `emotionTag`, `recommendedBooks`, `isPublic`, `hasSpoiler`, `buyReason`, `goodPoints`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: あり（`isPublic`フィールド）
  - 構造化フィールド: `buyReason`（買う理由）, `goodPoints`（良かった点）, `missingPoints`（足りない点）, `badPoints`（悪かった点）, `readDate`（読んだ日）, `pagesRead`（ページ数）, `ocrQuote`（OCR一文）
    - 根拠: `prisma/schema.prisma:631-654`（構造化フィールド追加後）
- **PublishedSnapshot** (`prisma/schema.prisma:188-224`)
  - フィールド: `id`, `type`, `status`, `ownerUserId`, `bookId`, `publicTitle`, `publicText`, `publicFields`, `visibility`, `publishedAt`, `createdAt`, `updatedAt`, `slug` (Legacy)
  - `userId`: なし（`ownerUserId`フィールド）
  - `bookId`: あり
  - `isPublic`: なし（`visibility`フィールドで管理: `PRIVATE`, `PARTIAL`, `PUBLIC`）
- **OCRAsset** (`prisma/schema.prisma:262-283`)
  - フィールド: `id`, `userId`, `bookId`, `reviewId`, `imageUrl`, `extractedText`, `pageNo`, `tags`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `reviewId`: あり（任意、Reviewとの紐づけ）
  - `isPublic`: なし
- **StudyItem** (`prisma/schema.prisma:289-319`)
  - フィールド: `id`, `userId`, `bookId`, `promptText`, `answerText`, `explanationText`, `referencePage`, `pointText`, `pointMarked`, `pointMarkedAt`, `isGraduated`, `graduatedAt`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **StudyRecord** (`prisma/schema.prisma:569-600`)
  - フィールド: `id`, `userId`, `bookId`, `materialId`, `problemAssetId`, `answerAssetId`, `explanationAssetId`, `memoText`, `locationType`, `locationValue`, `locationNote`, `step`, `state`, `nextReviewAt`, `lastReviewAt`, `referencePage`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **Gift** (`prisma/schema.prisma:357-394`)
  - フィールド: `id`, `senderUserId`, `recipientUserId`, `recipientEmail`, `bookId`, `message`, `purchaseUrl`, `provider`, `giftToken`, `status`, `channel`, `landingVariant`, `sentAt`, `openedAt`, `acceptedAt`, `expiresAt`, `createdAt`, `updatedAt`
  - `userId`: なし（`senderUserId`, `recipientUserId`フィールド）
  - `bookId`: あり
  - `isPublic`: なし
- **Koyori** (`prisma/schema.prisma:478-492`)
  - フィールド: `id`, `userId`, `title`, `memo`, `visibility`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: なし
  - `isPublic`: なし（`visibility`フィールドで管理: `PRIVATE`（将来拡張用））
- **KoyoriItem** (`prisma/schema.prisma:494-516`)
  - フィールド: `id`, `koyoriId`, `type`, `sourceId`, `order`, `note`, `readingLogId`, `ocrAssetId`, `createdAt`, `updatedAt`
  - `userId`: なし
  - `bookId`: なし（`readingLogId`または`ocrAssetId`経由で間接的に参照可能）
  - `isPublic`: なし
- **Meso** (`prisma/schema.prisma:759-774`)
  - フィールド: `id`, `userId`, `bookId`, `title`, `description`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **Macro** (`prisma/schema.prisma:790-805`)
  - フィールド: `id`, `userId`, `bookId`, `title`, `content`, `createdAt`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `isPublic`: なし
- **ReadingProgress** (`prisma/schema.prisma:674-687`)
  - フィールド: `id`, `userId`, `bookId`, `reviewId`, `pagesRead`, `percentRead`, `updatedAt`
  - `userId`: あり
  - `bookId`: あり
  - `reviewId`: あり（任意、Reviewとの紐づけ）
  - `isPublic`: なし

#### Legacyモデル（後で削除予定だが現在も使用中）
- **Subscription** (`prisma/schema.prisma:522-534`)
  - 根拠: `prisma/schema.prisma:519` (`// Legacy Models (後で削除予定)`)
- **Material** (`prisma/schema.prisma:536-549`)
  - 根拠: `prisma/schema.prisma:519`
- **Asset** (`prisma/schema.prisma:551-567`)
  - 根拠: `prisma/schema.prisma:519`
- **OcrText** (`prisma/schema.prisma:745-757`)
  - 根拠: `prisma/schema.prisma:519`
- **Notification** (`prisma/schema.prisma:710-725`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **RevenueShare** (`prisma/schema.prisma:727-743`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **ReviewEvolutionLog** (`prisma/schema.prisma:656-672`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **ReviewSchedule** (`prisma/schema.prisma:602-614`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **ReviewLog** (`prisma/schema.prisma:616-629`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **StudyAttempt** (`prisma/schema.prisma:321-351`)
  - 根拠: `prisma/schema.prisma:519`（ただし`User`のLegacy relationsに含まれる）
- **Tag** (`prisma/schema.prisma:154-166`)
- **ReadingLogTag** (`prisma/schema.prisma:168-181`)
- **SnapshotSource** (`prisma/schema.prisma:234-256`)
- **GiftEvent** (`prisma/schema.prisma:396-416`)
- **RateLimitBucket** (`prisma/schema.prisma:423-441`)
- **AffiliateStateLog** (`prisma/schema.prisma:447-461`)
- **WebhookEventLog** (`prisma/schema.prisma:467-472`)
- **MesoItem** (`prisma/schema.prisma:776-788`)
- **MacroItem** (`prisma/schema.prisma:807-820`)

#### Legacyフィールド（後で削除予定）
- **Book.userId** (`prisma/schema.prisma:70`)
  - 根拠: `prisma/schema.prisma:70` (`// Legacy: 後で削除予定`)
- **PublishedSnapshot.slug** (`prisma/schema.prisma:208`)
  - 根拠: `prisma/schema.prisma:208` (`// Legacy: 後で削除予定`)

---

## 2. 未実装だがコード上に存在するもの（準確定）

### 2.1 TODOコメント

- **アフィリエイトURL生成ロジック**
  - 根拠: `app/api/affiliate/book-links/route.ts:41-43`
  - 内容: `// TODO: 実際のアフィリエイトURL生成ロジック`、`// TODO: アフィリエイトパラメータ付与`
  - 状態: 部分実装（APIは存在するが、実際のURL生成ロジックは未実装）

- **報酬計上の実際の呼び出し箇所**
  - 根拠: `lib/revenue-share.ts:17-60`（`createRevenueShare`関数は定義されているが、呼び出し箇所が見つからない）
  - 状態: 未実装（レビュー投稿時点では報酬計上しない。購入発生時の処理で実装する必要がある）

- **OCR APIエンドポイント**
  - 根拠: `components/koyori/KoyoriAddItemModal.tsx:91`
  - 内容: `// TODO: OCR APIエンドポイントを確認・実装`
  - 状態: 不明（実装状況確認不可）

### 2.2 定義されているが未使用のフィールド

- **User.name** (`prisma/schema.prisma:18`)
  - 根拠: `prisma/schema.prisma:18` (`name String?`)
  - 状態: DBフィールドは存在、APIで参照可能（`app/api/books/[bookId]/review-summary/route.ts:60,73`で`user.name`を参照）
  - 未実装: ユーザー登録時に`name`を入力するUI導線がない（`app/api/auth/register/route.ts:32-43`で設定されていない）

- **Review.recommendedBooks** (`prisma/schema.prisma:640`)
  - 根拠: `prisma/schema.prisma:640` (`recommendedBooks String?`)
  - 状態: DBフィールド・APIスキーマは存在（`app/api/reviews/route.ts:13`でZodスキーマに含まれる）
  - 未実装: UIで入力・送信する導線がない

- **StudyItem.pointText, pointMarked, pointMarkedAt** (`prisma/schema.prisma:300-302`)
  - 根拠: `prisma/schema.prisma:300-302`
  - 状態: DBフィールドは存在
  - 未実装: UIで入力・送信する導線がない

- **StudyItem.isGraduated, graduatedAt** (`prisma/schema.prisma:304-305`)
  - 根拠: `prisma/schema.prisma:304-305`
  - 状態: DBフィールドは存在、`lib/review-engine.ts:83-93`に`checkGraduation`関数は存在
  - 未実装: UIで操作する導線がない

### 2.3 環境変数だけ用意されている機能

- **RAKUTEN_APPLICATION_ID** (`lib/book-search.ts:25`)
  - 根拠: `lib/book-search.ts:25` (`process.env.RAKUTEN_APPLICATION_ID`)
  - 参照箇所: `app/api/book-search/config/route.ts:14`, `app/api/book-search/route.ts:71`
  - 状態: 環境変数が設定されていない場合は楽天検索をスキップ

- **AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, AMAZON_PAAPI_PARTNER_TAG, AMAZON_PAAPI_REGION** (`lib/book-search.ts:77-81`)
  - 根拠: `lib/book-search.ts:77-81`
  - 参照箇所: `app/api/book-search/config/route.ts:16-18`, `app/api/book-search/route.ts:71`
  - 状態: 環境変数が設定されていない場合はAmazon検索をスキップ

- **STRIPE_SECRET_KEY** (`lib/stripe.ts:3`)
  - 根拠: `lib/stripe.ts:3` (`process.env.STRIPE_SECRET_KEY`)
  - 参照箇所: `lib/stripe.ts:7`, `app/api/affiliate/opt-in/route.ts:86`
  - 状態: 必須（未設定の場合はエラー）

- **STRIPE_AFFILIATE_PRICE_ID** (`lib/stripe.ts:20`)
  - 根拠: `lib/stripe.ts:20` (`process.env.STRIPE_AFFILIATE_PRICE_ID`)
  - 参照箇所: `lib/stripe.ts:20-23`
  - 状態: 必須（未設定の場合はエラー）

- **STRIPE_WEBHOOK_SECRET** (`lib/stripe.ts:69`)
  - 根拠: `lib/stripe.ts:69` (`process.env.STRIPE_WEBHOOK_SECRET`)
  - 参照箇所: `app/api/stripe/webhook/route.ts:26`
  - 状態: 必須（未設定の場合はエラー）

- **JWT_SECRET** (`lib/auth.ts:4`)
  - 根拠: `lib/auth.ts:4` (`process.env.JWT_SECRET`)
  - 参照箇所: `lib/auth.ts:4-7,17,23`
  - 状態: 必須（未設定の場合はエラー）

- **DATABASE_URL** (`prisma/schema.prisma:12`)
  - 根拠: `prisma/schema.prisma:12` (`url = env("DATABASE_URL")`)
  - 状態: 必須

- **APP_URL** (`lib/stripe.ts:25`)
  - 根拠: `lib/stripe.ts:25` (`process.env.APP_URL || 'http://localhost:3000'`)
  - 参照箇所: `lib/stripe.ts:25,42`
  - 状態: オプション（デフォルト: `http://localhost:3000`）

- **NODE_ENV** (`app/api/auth/login/route.ts:45`, `lib/prisma.ts:9`)
  - 根拠: `app/api/auth/login/route.ts:45` (`process.env.NODE_ENV === 'production'`), `lib/prisma.ts:9` (`process.env.NODE_ENV !== 'production'`)
  - 状態: 自動設定（Next.js）

### 2.4 READMEに記載があるが未実装の機能

- **無料ユーザー：読書進捗入力 → 空背景変化**
  - 根拠: `README.md:54`
  - 状態: 不明（実装状況確認不可）

- **ファイルアップロード機能（現在はURL入力）**
  - 根拠: `README.md:55`
  - 状態: 現在はURL入力のみ（`app/api/ocr-assets/route.ts`で`imageUrl`を受け取る）

---

## 3. 確定ではない案（バックログ・アイデア）

### 3.1 仕様書に記載があるが実装状況不明の機能

- **勉強コースプラン選択画面**
  - 根拠: `docs/FEATURE_LIST.md:93` (`TODO:確認が必要`)
  - 状態: 不明

- **StudyItem作成画面**
  - 根拠: `docs/FEATURE_LIST.md:94` (`TODO:確認が必要`)
  - 状態: 不明

- **論点マーク機能**
  - 根拠: `docs/FEATURE_LIST.md:108` (`TODO:確認が必要`)
  - 状態: DBモデルは存在（`prisma/schema.prisma:300-302`）

- **卒業判定機能**
  - 根拠: `docs/FEATURE_LIST.md:109` (`TODO:確認が必要`)
  - 状態: DBモデルは存在（`prisma/schema.prisma:304-305`）、`lib/review-engine.ts:83-93`に`checkGraduation`関数は存在

### 3.2 仕様書に記載がある将来計画

- **PublicInsight / Query / /q/[slug]**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:461-464`
  - 状態: 未発見（コード上で存在が確認できない）
  - 判断: 将来計画として残す（実装予定が明確になるまで保留）

- **横断検索（有料）**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:466`
  - 状態: 構想のみ（論点×反応×期間での横断検索）

- **成長可視化機能（有料）**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:468`
  - 状態: 構想のみ（理解までの日数推移、混乱→理解回数、Before/After等の可視化）

### 3.3 仕様書に記載があるが未実装の機能

- **本の編集機能**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:12,26,542`
  - 状態: 未実装（`PUT /api/books/[id]`は存在しない、`PUT /api/books/[bookId]`はUserBookステータス更新のみ）

- **本の削除機能**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:12,27,544`
  - 状態: 実装済み（`DELETE /api/books/[bookId]`は存在、`app/api/books/[bookId]/route.ts:101-218`）

- **レビュー中心の導線（未ログインでも閲覧可能）**
  - 根拠: `app/r/page.tsx:1-200`
  - 状態: 実装済み（`/r`ページで未ログインでも公開レビュー一覧を閲覧可能）

- **構造化レビューフォーム**
  - 根拠: `components/ReviewForm.tsx:1-（全行）`
  - 状態: 実装済み（構造化フィールド + 定型テンプレ（選択式） + OCR/進捗との任意紐づけ）
    - 必須: `goodPoints`（良かった点）
      - 根拠: `components/ReviewForm.tsx:214-238`, `app/api/reviews/route.ts:7-30`
    - 任意: `buyReason`, `missingPoints`, `badPoints`, `readDate`, `pagesRead`, `ocrQuote`
      - 根拠: `components/ReviewForm.tsx:188-367`, `app/api/reviews/route.ts:7-30`
    - 任意紐づけ: `readingProgressId`, `ocrAssetId`（payloadに含める）
      - 根拠: `components/ReviewForm.tsx:42-75,86-110`, `app/api/reviews/route.ts:27-30,203-219`

- **報酬ゲート（投稿は全員OK、報酬計上は有料またはaffiliate opt-inのみ）**
  - 根拠: `lib/revenue-share.ts:21-122`, `prisma/schema.prisma:765-788`
  - 状態: 実装済み（`plan !== 'FREE' || affiliateState === 'ON'`で判定し、判定ログをDBに記録）
    - 判定: `evaluateRevenueEligibility`
      - 根拠: `lib/revenue-share.ts:21-38`
    - ログ: `RevenueShareGateLog`
      - 根拠: `prisma/schema.prisma:765-788`, `lib/revenue-share.ts:40-58`
    - レビュー投稿時（公開レビューのみ）に判定ログを記録
      - 根拠: `app/api/reviews/route.ts:154-170,221-238`

- **レビュー検索機能**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:15,31,546`
  - 状態: 実装済み（`GET /api/reviews?q=検索語`は存在、`app/api/reviews/route.ts:28,35-42`）

- **他人のレビュー閲覧機能（一覧）**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:16,32,548`
  - 状態: 実装済み（`GET /api/reviews/public?bookId=xxx`は存在、`app/api/reviews/public/route.ts:1-112`、`components/PublicReviewsList.tsx:1-134`で使用）

- **おすすめ本機能（UI実装）**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:14,29`
  - 状態: 部分実装（`Review.recommendedBooks`フィールドは存在するが、UI導線がない）

- **ユーザー名入力機能**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:17,28`
  - 状態: 部分実装（`User.name`フィールドは存在するが、登録時に入力するUI導線がない）

- **マイページ機能**
  - 根拠: `docs/SPEC_FINAL_CONSISTENT.md:586`
  - 状態: 未実装（`/profile`画面は存在しない）

### 3.4 料金プラン不一致

- **実装済みプラン** (`lib/plan-config.ts:5-11`): 3冊(450円), 5冊(700円), 10冊(1400円), 20冊(2600円)
- **README記載プラン** (`README.md:149-154`): 3冊(450円), 10冊(1000円), 20冊(1800円), 30冊(2500円), 50冊(3500円)
- **状態**: 不一致（実装とREADMEで異なる）
- **単一の正本**: `docs/pricing/PRICING_TRUTH.md`に実装上の事実を集約
  - 根拠: `docs/pricing/PRICING_TRUTH.md:1-（全行）`
- **不一致一覧**: `docs/changes/C_pricing_audit.md`に差分を一覧化
  - 根拠: `docs/changes/C_pricing_audit.md:1-（全行）`

### 3.5 将来拡張用フィールド

- **Koyori.visibility** (`prisma/schema.prisma:483`)
  - 根拠: `prisma/schema.prisma:483` (`// PRIVATE（将来拡張用）`)
  - 状態: 現在は`PRIVATE`のみ

- **StudyItem.snapshotSources** (`prisma/schema.prisma:314`)
  - 根拠: `prisma/schema.prisma:314` (`// 将来：学習成果をSnapshot化するなら使う`)
  - 状態: リレーションは定義されているが、使用されていない

---

## 4. 明確に「未対応・未存在」と言えるもの

### 4.1 コード・docs上で検索しても0件のもの

- **cron / スケジュール実行**
  - 検索語: `cron`
  - 検索コマンド: `Select-String -Path "app\**\*.ts","app\**\*.tsx","lib\**\*.ts","components\**\*.tsx" -Pattern "cron" -SimpleMatch | Where-Object { $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*.next*" }`
  - 結果: 0件（何も出力されない）
  - 根拠: バックグラウンド処理はStripe Webhookのみ実装済み

- **schedule / スケジュール実行**
  - 検索語: `schedule`（ただし`ReviewSchedule`や`nextReviewAt`は除外）
  - 検索コマンド: `Select-String -Path "app\**\*.ts","app\**\*.tsx","lib\**\*.ts","components\**\*.tsx" -Pattern "schedule" -SimpleMatch | Where-Object { $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*.next*" -and $_.Line -notmatch "ReviewSchedule|nextReviewAt" }`
  - 結果: 0件（何も出力されない）
  - 根拠: スケジュール実行システムは実装されていない

- **queue / ジョブキュー**
  - 検索語: `queue`
  - 検索コマンド: `Select-String -Path "app\**\*.ts","app\**\*.tsx","lib\**\*.ts","components\**\*.tsx" -Pattern "queue" -SimpleMatch | Where-Object { $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*.next*" -and $_.Path -notlike "*package-lock.json*" }`
  - 結果: 0件（何も出力されない）
  - 根拠: ジョブキューシステムは実装されていない（`package-lock.json`に`queue-microtask`は存在するが、これはNode.js標準ライブラリ）

- **worker / ワーカープロセス**
  - 検索語: `worker`
  - 検索コマンド: `Select-String -Path "app\**\*.ts","app\**\*.tsx","lib\**\*.ts","components\**\*.tsx" -Pattern "worker" -SimpleMatch | Where-Object { $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*.next*" }`
  - 結果: 0件（何も出力されない）
  - 根拠: ワーカープロセスは実装されていない

- **migrations ディレクトリ**
  - 検索コマンド: `Test-Path "prisma\migrations"`
  - 結果: False（存在しない）
  - 根拠: Prisma migrationsは使用されていない（`prisma db push`を使用）

- **.env.example ファイル**
  - 検索コマンド: `Test-Path ".env.example"`
  - 結果: False（存在しない）
  - 根拠: `.env.example`ファイルは存在しない

- **API: PUT /api/books/[id]（Bookマスタ編集）**
  - 検索: `app/api/books/[id]/route.ts`は存在しない
  - 根拠: `app/api/books/[bookId]/route.ts`は存在するが、これはUserBookステータス更新のみ（Bookマスタ編集ではない）

---

**作成日**: 2026-02-08  
**基準点**: `docs/snapshots/CURRENT_APP_STATUS_AUDIT__SNAPSHOT_v2.md`を参照  
**調査方法**: コードベース・ドキュメントの事実ベース確認（推測禁止、根拠必須）
