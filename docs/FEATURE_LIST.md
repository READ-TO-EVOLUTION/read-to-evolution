# 機能一覧（勉強コース／非勉強コース別）

**作成日**: 2026-01-xx  
**参照ファイル一覧**: 下記参照

---

## 参照したファイル/パス一覧

### 仕様書・設計資料
- `docs/INTEGRATED_SPEC.md` - 統合仕様書
- `docs/STUDY_COURSE_SPEC.md` - 勉強コース仕様
- `SPECIFICATION.md` - 最終仕様書
- `README.md` - プロジェクト概要
- `docs/SECURITY_AUDIT_REPORT.md` - セキュリティ監査レポート

### 実装ファイル
- `prisma/schema.prisma` - データベーススキーマ
- `lib/plan-config.ts` - 料金プラン設定
- `lib/affiliate.ts` - アフィリエイト判定ロジック
- `lib/study-volume-limit.ts` - データ量制御
- `app/api/auth/*/route.ts` - 認証API
- `app/api/books/route.ts` - 書籍API
- `app/api/reviews/route.ts` - レビューAPI
- `app/api/reading-logs/route.ts` - 読書ログAPI
- `app/api/gifts/route.ts` - ギフトAPI
- `app/api/koyori/route.ts` - こよりAPI
- `app/api/study-items/route.ts` - 勉強コースAPI
- `app/api/ocr-assets/route.ts` - OCRアセットAPI
- `app/api/affiliate/*/route.ts` - アフィリエイトAPI
- `app/api/stripe/webhook/route.ts` - Stripe Webhook

### 画面ファイル
- `app/page.tsx` - ホーム
- `app/login/page.tsx` - ログイン
- `app/register/page.tsx` - 登録
- `app/books/page.tsx` - 書籍一覧
- `app/reviews/page.tsx` - レビュー一覧
- `app/gifts/page.tsx` - ギフト管理
- `app/koyori/page.tsx` - こより一覧
- `app/study/today/page.tsx` - 今日の復習
- `app/settings/affiliate/page.tsx` - アフィリエイト設定

---

## A. 非勉強コース（無料/有料の区別）

| 機能名 | コース | 価値 | 画面 | API | DB | 権限 | 金銭 | 著作権配慮 | 実装状況 | 根拠 |
|--------|--------|------|------|-----|-----|------|------|------------|----------|------|
| ユーザー登録 | 非勉強/共通 | アカウント作成 | `/register` | `POST /api/auth/register` | `User` | 公開 | 無料 | - | 実装済 | `app/api/auth/register/route.ts` |
| ログイン | 非勉強/共通 | 認証 | `/login` | `POST /api/auth/login` | `User` | 公開 | 無料 | - | 実装済 | `app/api/auth/login/route.ts` |
| ログアウト | 非勉強/共通 | セッション終了 | - | `POST /api/auth/logout` | - | ログイン必須 | 無料 | - | 実装済 | `app/api/auth/logout/route.ts` |
| 書籍登録 | 非勉強/共通 | 読書管理 | `/books` | `POST /api/books` | `Book` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/books/route.ts` |
| 書籍一覧取得 | 非勉強/共通 | 登録書籍確認 | `/books` | `GET /api/books` | `Book` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/books/route.ts` |
| レビュー投稿 | 非勉強/共通 | 読書感想記録 | `/reviews` | `POST /api/reviews` | `Review` | ログイン必須/本人のみ | 無料 | 引用文字数制限あり | 実装済 | `app/api/reviews/route.ts` |
| レビュー編集 | 非勉強/共通 | 感想更新 | `/reviews` | `PUT /api/reviews/[id]` | `Review` | ログイン必須/本人のみ | 無料 | 引用文字数制限あり | 実装済 | `app/api/reviews/[id]/route.ts` |
| レビュー削除 | 非勉強/共通 | 感想削除 | `/reviews` | `DELETE /api/reviews/[id]` | `Review` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/reviews/[id]/route.ts` |
| レビュー一覧取得 | 非勉強/共通 | 自分の感想確認 | `/reviews` | `GET /api/reviews` | `Review` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/reviews/route.ts` |
| 読書ログ作成 | 非勉強/共通 | 読んだ部分記録 | `/books/[id]/reading-logs` | `POST /api/reading-logs` | `ReadingLog` | ログイン必須/本人のみ | 無料 | 自分の言葉必須 | 実装済 | `app/api/reading-logs/route.ts` |
| 読書ログ編集 | 非勉強/共通 | ログ更新 | `/books/[id]/reading-logs` | `PUT /api/reading-logs/[id]` | `ReadingLog` | ログイン必須/本人のみ | 無料 | 自分の言葉必須 | 実装済 | `app/api/reading-logs/[id]/route.ts` |
| 読書ログ削除 | 非勉強/共通 | ログ削除 | `/books/[id]/reading-logs` | `DELETE /api/reading-logs/[id]` | `ReadingLog` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/reading-logs/[id]/route.ts` |
| 読書ログ一覧取得 | 非勉強/共通 | ログ確認 | `/books/[id]/reading-logs` | `GET /api/reading-logs` | `ReadingLog` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/reading-logs/route.ts` |
| ギフト作成 | 非勉強/共通 | 購入URL贈与 | `/gifts` | `POST /api/gifts` | `Gift` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/gifts/route.ts` |
| ギフト一覧取得 | 非勉強/共通 | 贈ったギフト確認 | `/gifts` | `GET /api/gifts` | `Gift` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/gifts/route.ts` |
| ギフト公開ページ閲覧 | 非勉強/共通 | 贈られたギフト確認 | `/gifts/[slug]` | `GET /api/gifts/[id]` | `Gift` | 公開（トークン必須） | 無料 | - | 実装済 | `app/gifts/[slug]/page.tsx` |
| ギフト分析閲覧 | 非勉強/有料 | 成果計測確認 | `/gifts/[slug]/analytics` | `GET /api/gift-events` | `GiftEvent` | ログイン必須/本人のみ | アフィリエイトON必須（300円/月 or STUDY加入） | - | 実装済 | `app/gifts/[slug]/analytics/page.tsx` |
| こより作成 | 非勉強/共通 | 断片束ね | `/koyori` | `POST /api/koyori` | `Koyori` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/route.ts` |
| こより編集 | 非勉強/共通 | タイトル・メモ更新 | `/koyori/[id]` | `PUT /api/koyori/[id]` | `Koyori` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/[id]/route.ts` |
| こより削除 | 非勉強/共通 | こより削除 | `/koyori/[id]` | `DELETE /api/koyori/[id]` | `Koyori` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/[id]/route.ts` |
| こより一覧取得 | 非勉強/共通 | こより確認 | `/koyori` | `GET /api/koyori` | `Koyori` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/route.ts` |
| こよりアイテム追加 | 非勉強/共通 | ReadingLog/OCR/Note追加 | `/koyori/[id]` | `POST /api/koyori/[id]/items` | `KoyoriItem` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/[id]/items/route.ts` |
| こよりアイテム並び替え | 非勉強/共通 | D&D並び替え | `/koyori/[id]` | `POST /api/koyori/[id]/items/reorder` | `KoyoriItem` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/[id]/items/reorder/route.ts` |
| こよりアイテム削除 | 非勉強/共通 | アイテム削除 | `/koyori/[id]` | `DELETE /api/koyori/items/[itemId]` | `KoyoriItem` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/koyori/items/[itemId]/route.ts` |
| アフィリエイト有効化 | 非勉強/有料 | 成果計測開始 | `/settings/affiliate` | `POST /api/affiliate/opt-in` | `User`, `AffiliateStateLog` | ログイン必須/本人のみ | 300円/月（STUDY加入者は無料） | - | 実装済 | `app/api/affiliate/opt-in/route.ts` |
| アフィリエイト解約 | 非勉強/有料 | 成果計測停止 | `/settings/affiliate` | `POST /api/affiliate/cancel` | `User`, `AffiliateStateLog` | ログイン必須/本人のみ | 無料（解約） | - | 実装済 | `app/api/affiliate/cancel/route.ts` |
| アフィリエイト状態確認 | 非勉強/共通 | 現在の状態確認 | `/settings/affiliate` | `GET /api/affiliate/me` | `User` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/affiliate/me/route.ts` |
| アフィリエイト状態ログ取得 | 非勉強/共通 | 状態変更履歴 | `/settings/affiliate` | `GET /api/affiliate/state-logs` | `AffiliateStateLog` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/affiliate/state-logs/route.ts` |
| アフィリエイト成果ダッシュボード | 非勉強/有料 | 成果サマリー確認 | `/affiliate/dashboard` | `GET /api/gift-events` | `GiftEvent` | ログイン必須/本人のみ/アフィリエイトON必須 | アフィリエイトON必須（300円/月 or STUDY加入） | - | 実装済 | `app/affiliate/dashboard/page.tsx` |
| アフィリエイト購入URL生成 | 非勉強/有料 | 報酬付きURL作成 | - | `POST /api/affiliate/book-links` | - | ログイン必須/本人のみ/アフィリエイトON必須 | アフィリエイトON必須（300円/月 or STUDY加入） | - | 実装済 | `app/api/affiliate/book-links/route.ts` |
| Snapshot公開 | 非勉強/共通 | 公開ページ作成 | `/books/[id]/snapshots` | `POST /api/snapshots/[id]/publish` | `PublishedSnapshot` | ログイン必須/本人のみ | 無料 | 自分の言葉必須、OCR本文公開禁止 | 実装済 | `app/api/snapshots/[id]/publish/route.ts` |
| Snapshot一覧取得 | 非勉強/共通 | 公開ページ確認 | `/books/[id]/snapshots` | `GET /api/snapshots` | `PublishedSnapshot` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/snapshots/route.ts` |
| Meso作成 | 非勉強/共通 | テーマ・章まとめ | `/books/[id]/mesos` | `POST /api/mesos` | `Meso` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/mesos/route.ts` |
| Meso編集 | 非勉強/共通 | まとめ更新 | `/books/[id]/mesos/[id]` | `PUT /api/mesos/[id]` | `Meso` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/mesos/[id]/route.ts` |
| Macro作成 | 非勉強/共通 | 1冊全体の成果 | `/books/[id]/macros` | `POST /api/macros` | `Macro` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/macros/route.ts` |
| Macro編集 | 非勉強/共通 | 成果更新 | `/books/[id]/macros/[id]` | `PUT /api/macros/[id]` | `Macro` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/macros/[id]/route.ts` |

---

## B. 勉強コース（無料/有料の区別）

| 機能名 | コース | 価値 | 画面 | API | DB | 権限 | 金銭 | 著作権配慮 | 実装状況 | 根拠 |
|--------|--------|------|------|-----|-----|------|------|------------|----------|------|
| 勉強コースプラン選択 | 勉強/有料 | 冊数制プラン選択 | TODO:確認が必要 | TODO:確認が必要 | `User` | ログイン必須/本人のみ | 3冊:450円/月、5冊:700円/月、10冊:1400円/月、20冊:2600円/月 | - | 未確認 | `lib/plan-config.ts` |
| StudyItem作成 | 勉強/有料 | 問題・解説登録 | TODO:確認が必要 | `POST /api/study-items` | `StudyItem` | ログイン必須/本人のみ/プラン制限あり | プラン制限あり（冊数上限） | ユーザー投稿のみ | 実装済 | `app/api/study-items/route.ts` |
| StudyItem編集 | 勉強/有料 | 問題・解説更新 | TODO:確認が必要 | `PUT /api/study-items/[id]` | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | ユーザー投稿のみ | 実装済 | `app/api/study-items/[id]/route.ts` |
| StudyItem一覧取得 | 勉強/有料 | 登録問題確認 | TODO:確認が必要 | `GET /api/study-items` | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-items/route.ts` |
| OCRアセット作成（問題） | 勉強/有料 | 問題画像+OCR登録 | `/books/[id]/ocr` | `POST /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ/プラン制限あり | プラン制限あり、1冊1500枚上限 | ユーザー投稿のみ | 実装済 | `app/api/ocr-assets/route.ts` |
| OCRアセット作成（解説） | 勉強/有料 | 解説画像+OCR登録 | `/books/[id]/ocr` | `POST /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ/プラン制限あり | プラン制限あり、1冊1500枚上限 | ユーザー投稿のみ | 実装済 | `app/api/ocr-assets/route.ts` |
| OCRアセット作成（基本書） | 勉強/有料 | 基本書画像+OCR登録 | `/books/[id]/ocr` | `POST /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ/プラン制限あり | プラン制限あり、1冊1500枚上限 | ユーザー投稿のみ | 実装済 | `app/api/ocr-assets/route.ts` |
| OCRアセット一覧取得 | 勉強/有料 | 登録画像確認 | `/books/[id]/ocr` | `GET /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/ocr-assets/route.ts` |
| データ量制御（警告） | 勉強/有料 | 1,200枚超で警告 | `/books/[id]/ocr` | `POST /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `lib/study-volume-limit.ts` |
| データ量制御（上限） | 勉強/有料 | 1,500枚で追加不可 | `/books/[id]/ocr` | `POST /api/ocr-assets` | `OCRAsset` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `lib/study-volume-limit.ts` |
| 今日の復習一覧取得 | 勉強/有料 | 復習対象確認 | `/study/today` | `GET /api/study-records/today` | `StudyRecord` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-records/today/route.ts` |
| 復習実行 | 勉強/有料 | 復習実施 | `/study/review/[id]` | `POST /api/study-records/[id]/review` | `StudyAttempt` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-records/[id]/review/route.ts` |
| 登録済み解説一覧取得（Stage1） | 勉強/有料 | 過去の解説から選択 | `/study/review/[id]` | `GET /api/study-items/explanations` | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-items/explanations/route.ts` |
| キーワード検索解説（Stage2） | 勉強/有料 | OCRテキスト検索 | `/study/review/[id]` | `GET /api/study-items/explanations?keyword=...` | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-items/explanations/route.ts` |
| 解説選択 | 勉強/有料 | 解説確定 | `/study/review/[id]` | `POST /api/study-items/[id]/select-explanation` | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 実装済 | `app/api/study-items/[id]/select-explanation/route.ts` |
| 論点マーク | 勉強/有料 | 理解要点記録 | TODO:確認が必要 | TODO:確認が必要 | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 未確認 | `prisma/schema.prisma` |
| 卒業判定 | 勉強/有料 | 論点習得完了 | TODO:確認が必要 | TODO:確認が必要 | `StudyItem` | ログイン必須/本人のみ | プラン制限あり | - | 未確認 | `prisma/schema.prisma` |

---

## C. 共通機能

| 機能名 | コース | 価値 | 画面 | API | DB | 権限 | 金銭 | 著作権配慮 | 実装状況 | 根拠 |
|--------|--------|------|------|-----|-----|------|------|------------|----------|------|
| ホーム画面 | 共通 | ダッシュボード | `/` | `GET /api/home/stats` | `User`, `Book`, `Review`, `ReadingLog` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/page.tsx` |
| 書籍検索 | 共通 | 書籍情報取得 | `/books` | `GET /api/book-search` | - | ログイン必須 | 無料 | - | 実装済 | `app/api/book-search/route.ts` |
| 通知一覧取得 | 共通 | 通知確認 | `/notifications` | `GET /api/notifications` | `Notification` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/notifications/route.ts` |
| 通知既読 | 共通 | 通知読了 | `/notifications` | `PUT /api/notifications/[id]/read` | `Notification` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/notifications/[id]/read/route.ts` |
| 読書進捗更新 | 共通 | 読了ページ記録 | `/books/[id]/progress` | `POST /api/reading-progress` | `ReadingProgress` | ログイン必須/本人のみ | 無料 | - | 実装済 | `app/api/reading-progress/route.ts` |
| Stripe Webhook処理 | 共通 | 決済処理 | - | `POST /api/stripe/webhook` | `User`, `WebhookEventLog` | Stripe署名検証 | 決済処理 | - | 実装済 | `app/api/stripe/webhook/route.ts` |

---

## D. 金銭発生ポイント一覧（課金・アフィリエイト・手数料・支払い先/支払い元）

| 項目 | 種類 | 金額 | 支払い元 | 支払い先 | 発生条件 | 根拠 |
|------|------|------|----------|----------|----------|------|
| 勉強コース3冊プラン | 課金 | 450円/月 | ユーザー | 運営 | プラン選択時 | `lib/plan-config.ts` |
| 勉強コース5冊プラン | 課金 | 700円/月 | ユーザー | 運営 | プラン選択時 | `lib/plan-config.ts` |
| 勉強コース10冊プラン | 課金 | 1,400円/月 | ユーザー | 運営 | プラン選択時 | `lib/plan-config.ts` |
| 勉強コース20冊プラン | 課金 | 2,600円/月 | ユーザー | 運営 | プラン選択時 | `lib/plan-config.ts` |
| アフィリエイト機能 | 課金 | 300円/月 | ユーザー | 運営 | アフィリエイト有効化時 | `app/api/affiliate/opt-in/route.ts` |
| アフィリエイト機能（STUDY加入者） | 課金 | 0円/月 | ユーザー | 運営 | STUDY加入者は自動ON | `app/api/affiliate/opt-in/route.ts` |
| アフィリエイト報酬 | 報酬 | TODO:料金未記載 | 運営 | ユーザー | 成果発生時 | TODO:確認が必要 |
| Stripe決済手数料 | 手数料 | TODO:料金未記載 | 運営 | Stripe | 決済処理時 | TODO:確認が必要 |

---

## E. 未確定・不足情報（TODO一覧）

| 項目 | 内容 | 優先度 |
|------|------|--------|
| 勉強コースプラン選択画面 | プラン選択UIの実装状況確認 | 高 |
| StudyItem作成画面 | 問題・解説登録UIの実装状況確認 | 高 |
| 論点マーク機能 | 論点マークAPI・UIの実装状況確認 | 中 |
| 卒業判定機能 | 卒業判定API・UIの実装状況確認 | 中 |
| アフィリエイト報酬金額 | 報酬率・計算方法の確認 | 中 |
| Stripe決済手数料 | 手数料率の確認 | 低 |
| プラン変更機能 | プラン変更API・UIの実装状況確認 | 中 |
| プラン解約機能 | プラン解約API・UIの実装状況確認 | 中 |

---

## 現状の実装状況

### 実装済
- 認証機能（登録・ログイン・ログアウト）
- 書籍管理機能
- レビュー機能（投稿・編集・削除・一覧）
- 読書ログ機能（作成・編集・削除・一覧）
- ギフト機能（作成・一覧・公開ページ・分析）
- こより機能（作成・編集・削除・一覧・アイテム管理）
- アフィリエイト機能（有効化・解約・状態確認・ログ・ダッシュボード）
- 勉強コース機能（StudyItem作成・編集・一覧、OCRアセット作成・一覧、データ量制御）
- 復習機能（今日の復習一覧、復習実行、解説選択2段階）
- Snapshot公開機能
- Meso/Macro機能
- 通知機能
- 読書進捗機能
- Stripe Webhook処理

### 未実装
- プラン選択・変更・解約UI（APIは未確認）
- 論点マークUI（DBモデルは存在）
- 卒業判定UI（DBモデルは存在）

### 部分実装
- 書籍検索（警告表示あり、実装は未確認）
- アフィリエイト購入URL生成（TODOコメントあり）

---

## 参照ファイル詳細

### 確認したファイル一覧（実装状況判定用）

**認証関連**:
- `app/api/auth/register/route.ts` ✅
- `app/api/auth/login/route.ts` ✅
- `app/api/auth/logout/route.ts` ✅
- `app/api/auth/me/route.ts` ✅

**書籍関連**:
- `app/api/books/route.ts` ✅
- `app/api/book-search/route.ts` ✅

**レビュー関連**:
- `app/api/reviews/route.ts` ✅
- `app/api/reviews/[id]/route.ts` ✅

**読書ログ関連**:
- `app/api/reading-logs/route.ts` ✅
- `app/api/reading-logs/[id]/route.ts` ✅

**ギフト関連**:
- `app/api/gifts/route.ts` ✅
- `app/api/gifts/[id]/route.ts` ✅
- `app/api/gift-events/route.ts` ✅

**こより関連**:
- `app/api/koyori/route.ts` ✅
- `app/api/koyori/[id]/route.ts` ✅
- `app/api/koyori/[id]/items/route.ts` ✅
- `app/api/koyori/[id]/items/reorder/route.ts` ✅
- `app/api/koyori/items/[itemId]/route.ts` ✅

**アフィリエイト関連**:
- `app/api/affiliate/opt-in/route.ts` ✅
- `app/api/affiliate/cancel/route.ts` ✅
- `app/api/affiliate/me/route.ts` ✅
- `app/api/affiliate/state-logs/route.ts` ✅
- `app/api/affiliate/book-links/route.ts` ✅

**勉強コース関連**:
- `app/api/study-items/route.ts` ✅
- `app/api/study-items/[id]/route.ts` ✅
- `app/api/study-items/explanations/route.ts` ✅
- `app/api/study-items/[id]/select-explanation/route.ts` ✅
- `app/api/ocr-assets/route.ts` ✅
- `app/api/study-records/today/route.ts` ✅
- `app/api/study-records/[id]/review/route.ts` ✅

**その他**:
- `app/api/snapshots/route.ts` ✅
- `app/api/snapshots/[id]/publish/route.ts` ✅
- `app/api/mesos/route.ts` ✅
- `app/api/mesos/[id]/route.ts` ✅
- `app/api/macros/route.ts` ✅
- `app/api/macros/[id]/route.ts` ✅
- `app/api/notifications/route.ts` ✅
- `app/api/notifications/[id]/read/route.ts` ✅
- `app/api/reading-progress/route.ts` ✅
- `app/api/stripe/webhook/route.ts` ✅
- `app/api/home/stats/route.ts` ✅
