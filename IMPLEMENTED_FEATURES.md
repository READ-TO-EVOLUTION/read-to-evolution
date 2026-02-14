# READ TO EVOLUTION - 実装済み機能一覧

最終更新: 2026-01-24

---

## 📋 目次

1. [認証機能](#認証機能)
2. [ReadingLog（Micro）機能](#readinglogmicro機能)
3. [Meso機能](#meso機能)
4. [Macro機能](#macro機能)
5. [Snapshot公開機能](#snapshot公開機能)
6. [ギフト機能](#ギフト機能)
7. [勉強コース機能](#勉強コース機能)
8. [レビュー機能](#レビュー機能)
9. [OCR機能](#ocr機能)
10. [その他の機能](#その他の機能)

---

## 1. 認証機能

### 実装済み
- ✅ ユーザー登録 (`/register`)
- ✅ ログイン (`/login`)
- ✅ ログアウト (`/api/auth/logout`)
- ✅ 認証状態確認 (`/api/auth/me`)
- ✅ JWT認証（httpOnly Cookie）

### ページ
- `/register` - 新規登録ページ
- `/login` - ログインページ

---

## 2. ReadingLog（Micro）機能

### 実装済み
- ✅ ReadingLog作成
- ✅ ReadingLog一覧取得
- ✅ ReadingLog取得（詳細）
- ✅ ReadingLog更新（進化ログ記録）
- ✅ ReadingLog削除
- ✅ Tag正規化（Tag / ReadingLogTag）
  - 名詞タグ（最大3つ）
  - 動詞タグ（最大2つ）

### ページ
- `/books/[id]/reading-logs` - ReadingLog作成・一覧ページ

### API
- `GET /api/reading-logs` - 一覧取得
- `POST /api/reading-logs` - 作成
- `GET /api/reading-logs/[id]` - 取得
- `PUT /api/reading-logs/[id]` - 更新
- `DELETE /api/reading-logs/[id]` - 削除

### 機能詳細
- 範囲タイプ選択（PAGE / CHAPTER / FREE）
- 要点入力（30〜80字）
- 反応選択（6種類）
- タグ選択（名詞・動詞）
- 質問・気になった言葉・非公開メモ
- 公開設定（PRIVATE / PARTIAL / PUBLIC）

---

## 3. Meso機能

### 実装済み
- ✅ Meso作成（複数のReadingLogを束ねる）
- ✅ Meso一覧取得
- ✅ Meso取得（詳細）
- ✅ Meso更新
- ✅ Meso削除

### ページ
- `/books/[id]/mesos` - Meso作成・一覧ページ
- `/books/[id]/mesos/[mesoId]` - Meso詳細ページ

### API
- `GET /api/mesos` - 一覧取得
- `POST /api/mesos` - 作成
- `GET /api/mesos/[id]` - 取得
- `PUT /api/mesos/[id]` - 更新
- `DELETE /api/mesos/[id]` - 削除

### 機能詳細
- ReadingLog選択（チェックボックス）
- タイトル・説明入力
- 順序保持（order）

---

## 4. Macro機能

### 実装済み
- ✅ Macro作成（1冊につき1つのみ）
- ✅ Macro一覧取得
- ✅ Macro取得（詳細）
- ✅ Macro更新
- ✅ Macro削除

### ページ
- `/books/[id]/macros` - Macro作成・編集ページ
- `/books/[id]/macros/[macroId]` - Macro詳細ページ

### API
- `GET /api/macros` - 一覧取得
- `POST /api/macros` - 作成
- `GET /api/macros/[id]` - 取得
- `PUT /api/macros/[id]` - 更新
- `DELETE /api/macros/[id]` - 削除

### 機能詳細
- ReadingLog/Meso選択
- タイトル・内容入力
- 1冊につき1つのみ制約

---

## 5. Snapshot公開機能

### 実装済み
- ✅ Snapshot作成（固定化）
- ✅ Snapshot一覧取得
- ✅ Snapshot公開（DRAFT → PUBLISHED）
- ✅ Snapshot公開ページ（認証不要）

### ページ
- `/books/[id]/snapshots` - Snapshot作成・一覧ページ
- `/snapshots/[slug]` - 公開ページ（認証不要）

### API
- `GET /api/snapshots` - 一覧取得
- `POST /api/snapshots` - 作成
- `GET /api/snapshots/[slug]` - 公開取得（認証不要）
- `POST /api/snapshots/[id]/publish` - 公開

### 機能詳細
- タイプ選択（MICRO / MESO / MACRO）
- 公開タイトル・公開テキスト（100〜180字）
- 公開設定（PRIVATE / PARTIAL / PUBLIC）
- SnapshotSourceによるソース管理
- SEO・負荷・著作権対策（固定化）

---

## 6. ギフト機能

### 実装済み
- ✅ ギフト作成
- ✅ ギフト一覧取得
- ✅ ギフト公開ページ（認証不要）
- ✅ ギフト成果計測
- ✅ イベント記録
  - GIFT_CREATED
  - GIFT_OPENED
  - OUTBOUND_CLICKED
  - REGISTERED
  - REVIEW_CREATED
  - STUDY_VIEWED
  - SUBSCRIBED

### ページ
- `/gifts` - ギフト作成・管理ページ
- `/gifts/[slug]` - ギフト公開ページ（認証不要）
- `/gifts/[id]/analytics` - ギフト成果計測ダッシュボード

### API
- `GET /api/gifts` - 一覧取得
- `POST /api/gifts` - 作成
- `GET /api/gifts/[slug]` - 公開取得（認証不要）
- `POST /api/gifts/[slug]` - イベント記録
- `GET /api/gift-events` - 成果計測データ取得

### 機能詳細
- 購入URL入力
- メッセージ（任意）
- 有効期限（任意）
- 書籍選択（任意）
- KPI表示（開封率、CTR、購読率など）

---

## 7. 勉強コース機能

### 実装済み
- ✅ 書籍登録
- ✅ 教材登録
- ✅ 学習記録（StudyRecord）作成
- ✅ 今日の復習（出題順ルール実装）
- ✅ 復習実行（Step1-6）
- ✅ 復習ログ記録
  - 答えを出すまでの時間（timeToAnswerSec）
  - 解説の理解度
  - 詰まった箇所

### ページ
- `/books` - 書籍一覧
- `/books/[id]/materials` - 教材登録ページ
- `/study/today` - 今日の復習ページ
- `/study/review/[id]` - 復習実行ページ

### API
- `GET /api/books` - 書籍一覧取得
- `POST /api/books` - 書籍作成
- `GET /api/study-records` - 学習記録一覧
- `POST /api/study-records` - 学習記録作成
- `GET /api/study-records/today` - 今日の復習一覧（出題順ルール）
- `POST /api/study-records/[id]/review` - 復習実行

### 機能詳細
- 出題順ルール（前日復習 → 短時間優先 → 弱点補強）
- Step1-6の復習システム
- 卒業機能
- リフレッシュ復習

---

## 8. レビュー機能

### 実装済み
- ✅ レビュー作成
- ✅ レビュー一覧取得
- ✅ レビュー更新（進化ログ記録）
- ✅ レビュー削除
- ✅ 進化ログ（ReviewEvolutionLog）

### ページ
- `/books/[id]/review` - レビュー投稿ページ
- `/reviews` - レビュー一覧ページ

### API
- `GET /api/reviews` - 一覧取得
- `POST /api/reviews` - 作成
- `GET /api/reviews/[id]` - 取得
- `PUT /api/reviews/[id]` - 更新
- `DELETE /api/reviews/[id]` - 削除

### 機能詳細
- 5段階評価
- 自由コメント（最大200文字）
- 検索キーワード
- お気に入りの一文
- おすすめ本（最大3冊）
- 感情タグ

---

## 9. OCR機能

### 実装済み
- ✅ OCRテキスト作成
- ✅ OCRテキスト一覧取得
- ✅ OCRテキスト取得
- ✅ OCRテキスト更新
- ✅ OCRテキスト削除

### ページ
- `/books/[id]/ocr` - OCR管理ページ

### API
- `GET /api/ocr-texts` - 一覧取得
- `POST /api/ocr-texts` - 作成
- `GET /api/ocr-texts/[id]` - 取得
- `PUT /api/ocr-texts/[id]` - 更新
- `DELETE /api/ocr-texts/[id]` - 削除

### 機能詳細
- 本ごとのOCRテキスト管理
- 編集・検索機能
- 画像データ保存（OCRAsset）

---

## 10. その他の機能

### 通知機能
- ✅ 通知一覧取得
- ✅ 通知既読機能
- ✅ 未読数表示
- `/notifications` - 通知一覧ページ

### 進捗管理
- ✅ 読書進捗記録
- `/books/[id]/progress` - 進捗入力ページ

### 収益還元
- ✅ 収益還元一覧取得
- `/revenue-shares` - 収益還元ページ

### 浮遊メニュー
- ✅ ドラッグ可能な浮遊メニュー
- ✅ 位置の永続化（localStorage）
- ✅ リセット機能

---

## 📊 データベースモデル

### コアモデル
- `User` - ユーザー
- `Book` - 書籍
- `ReadingLog` - 読書ログ（Micro）
- `Tag` / `ReadingLogTag` - タグ正規化
- `Meso` / `MesoItem` - テーマ・章まとめ
- `Macro` / `MacroItem` - 1冊全体の成果
- `PublishedSnapshot` / `SnapshotSource` - 公開固定データ

### 勉強コース
- `StudyItem` - 学習項目
- `StudyAttempt` - 復習ログ

### ギフト
- `Gift` - ギフト
- `GiftEvent` - ギフト成果計測イベント
- `RateLimitBucket` - レート制限（悪用抑止）

### OCR
- `OCRAsset` - OCR画像・テキスト

### その他
- `Review` / `ReviewEvolutionLog` - レビュー
- `StudyRecord` / `ReviewSchedule` / `ReviewLog` - 学習記録
- `Notification` - 通知
- `RevenueShare` - 収益還元
- `Material` / `Asset` - 教材・アセット

---

## 🎯 実装状況サマリー

### ✅ 完全実装済み
1. 認証機能
2. ReadingLog（Micro）機能
3. Meso機能
4. Macro機能
5. Snapshot公開機能
6. ギフト機能
7. ギフト成果計測
8. 勉強コース機能（基本）
9. レビュー機能
10. OCR機能
11. 通知機能
12. 進捗管理
13. 収益還元

### 🔄 部分実装
- 勉強コースの高度な機能（一部）
- レート制限機能（DB設計のみ）

### ⏳ 未実装
- 無料/有料の境界制御（APIゲート）
- 横断検索機能（有料）
- 成長可視化機能（有料）

---

## 📝 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: SQLite (Prisma ORM)
- **認証**: JWT (httpOnly Cookie)
- **スタイリング**: Tailwind CSS
- **バリデーション**: Zod

---

## 🔗 主要なURL

### 認証
- `/register` - 新規登録
- `/login` - ログイン

### 書籍・ReadingLog
- `/books` - 書籍一覧
- `/books/[id]/reading-logs` - ReadingLog作成・一覧

### Meso / Macro
- `/books/[id]/mesos` - Meso管理
- `/books/[id]/macros` - Macro管理

### Snapshot
- `/books/[id]/snapshots` - Snapshot管理
- `/snapshots/[slug]` - 公開ページ

### ギフト
- `/gifts` - ギフト管理
- `/gifts/[slug]` - ギフト公開ページ
- `/gifts/[id]/analytics` - 成果計測

### 勉強コース
- `/study/today` - 今日の復習
- `/books/[id]/materials` - 教材登録

### その他
- `/reviews` - レビュー一覧
- `/notifications` - 通知一覧
- `/revenue-shares` - 収益還元

---

最終更新: 2026-01-24
