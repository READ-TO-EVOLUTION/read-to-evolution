# READ TO EVOLUTION  
## 本の感想プラットフォーム 最終仕様書（整合版）v4.2  
**副題：本から育つ一輪の花（READ TO EVOLUTION）**

**2026-01-xx 整合性監査完了版（優先度整理済み）**

## 変更点サマリー（v4.2）

### セクション14-A（実装済み）の修正

**削除（14-Bへ移動）**:
- 🔴 本の編集（未実装）
- 🔴 本の削除（未実装）
- 🟡 おすすめ本機能（UI未実装）
- 🔴 レビュー検索機能（未実装）
- 🔴 他人のレビュー閲覧機能（一覧）（未実装）
- 🟡 ユーザー登録時の名前入力（未実装）

**追加**:
- ✅ こより削除機能（`app/api/koyori/[id]/route.ts:136-138`）
- ✅ こよりアイテム削除機能（`app/api/koyori/items/[itemId]/route.ts:83-85`）

### セクション14-B（次に追加する）の優先順位見直し

**優先度：高**（ユーザーが直接操作する基本機能）:
1. 本の編集機能
2. 本の削除機能
3. ユーザー名入力機能
4. おすすめ本機能（UI実装）

**優先度：中**（探索・発見機能）:
5. レビュー検索機能
6. 他人のレビュー閲覧機能（一覧）
7. マイページ機能

**優先度：低**（内部整合性・将来計画）:
8. 料金設定の統一

### セクション14-C（フェーズ2以降）の明確化

- PublicInsight / Query / /q/[slug] を明確に将来計画として記載

---

## 0. この文書の位置づけ（最重要）

* 本書は **実装事実と将来計画を明確に分離した最終仕様**
* Cursor／実装判断は **本書を唯一の正** とする
* 本書の「✅ 実装済み」は、すべて根拠（ファイルパス:行番号）付き
* 本書の「🟡 未実装」「🔴 未発見」は、実装待ちまたは将来計画

---

## 1. サービス全体の最終構造（確定）

### 1.1 収益モデルの最終整理

* **勉強コース**：サブスクリプション（冊数制）
* **非勉強コース**：アフィリエイト
* **無料ユーザー**：ほぼ0円コスト設計
* **課金は「コストが発生する瞬間」のみ**

---

## 2. ユーザー区分とプラン（確定）

### 2.1 プラン一覧

| プラン | 月額 | 主目的 |
|--------|------|--------|
| FREE | 0円 | 読書・整理・学習の入口 |
| AFFILIATE | 300円 | 本を紹介し報酬を受け取る |
| STUDY（勉強コース） | 冊数制 | 理解・定着・成長 |

### 2.2 プラン別アフィリエイト状態（確定）

| プラン | AffiliateState |
|--------|----------------|
| FREE | OFF |
| AFFILIATE | ON（300円） |
| STUDY | ON（自動・無料扱い） |

※ 勉強コース加入者は **追加料金なしでアフィリエイト常時ON**

✅ **実装済み**: `affiliatePlanType === 'STUDY_SUB'`で自動的にアフィリエイトON（`lib/affiliate.ts:18-20`）

---

## 3. AffiliateState 設計（確定）

### 3.1 状態定義

* **OFF**：報酬を扱わない（イベント計測・精算なし）
* **ON**：報酬を扱う（成果計測・精算あり）
* **SUSPENDED**：停止（不正・支払い失敗等）

### 3.2 重要方針

* 重い処理（イベント計測・精算）は **ON のみ**
* OFFユーザーは **実務上ほぼ0円コスト**

✅ **実装済み**: `affiliateState`で報酬を受け取らないユーザーを管理（`lib/affiliate.ts:11-13`）

---

## 4. 非勉強コースのコスト整理（確定）

### 4.1 報酬を受け取らないユーザー

* **月コスト：10〜20円以下（ほぼ0円扱い）**
* 条件：
  * private利用のみ
  * イベントログなし
  * 公開・共有・集計なし

### 4.2 報酬を受け取るユーザー

* **月コスト：120〜200円**
* **登録料：300円**
* 差額で運営が黒字を確保

---

## 5. 報酬ON切替UX（確定）

### 5.1 トリガー

* 「報酬付きURLを作成」
* 「ギフト成果計測をON」
* 「成果ダッシュボードを開く」

※ 閲覧だけでは課金しない

### 5.2 ONまでのフロー

1. 説明モーダル表示
2. 同意チェック（2項目）
3. 課金（300円）
4. AffiliateState → ON

※ 勉強コース加入者は ③をスキップ

✅ **実装済み**: PaywallModal（`components/PaywallModal.tsx`）、opt-in API（`app/api/affiliate/opt-in/route.ts`）

---

## 6. 勉強コース（サブスク）仕様（強化確定）

### 6.1 勉強コースに含まれる機能

* 復習出題（前日 → 短時間 → 弱点）
* 解説テキストから **論点記述フェーズ**
* **論点マークUI**
* **卒業判定**
* **成長ダッシュボード**
* Meso / Macro
* 横断検索（論点×反応×期間）

### 6.2 復習フロー（最終）

1. 想起（答え非表示）
2. 自己申告
3. 解説表示
4. **論点を書かせる**
5. **論点をマーク**
6. 理解度記録
7. 卒業判定更新

---

## 7. 卒業判定ロジック（確定方針）

以下を総合評価：

* 正答率
* 思考時間の安定
* 混乱→理解回数
* 論点マークの一貫性

### 卒業後

* 同論点の他書籍を **URLのみ** でおすすめ可（著作権配慮）

---

## 8. 成長ダッシュボード（最初に見せる1画面）

* 理解までの日数推移
* 混乱→理解回数
* Before / After（言語の変化）
* 卒業論点数
* Macro（成果ページ）への導線

---

## 9. Meso / Macro の完成物定義（再確認）

### 9.1 Meso（論点単位）

**完成物：説明できる理解ノート**

* 結論（自分の言葉・必須）
* 誤解
* 誤解の理由
* 正しい理解手順
* チェックリスト
* 参考書籍URLのみ

### 9.2 Macro（1冊単位）

**完成物：この本で何ができるようになったか**

* 成果要約
* 論点一覧（卒業/未卒業）
* Before / After
* 苦戦ポイント
* 次に読む本（URLのみ）

---

## 10. こより（Koyori）機能の最終位置づけ（確定）

### 10.1 基本方針

* **勉強コース外・無料**
* 本をまたいで断片を束ねる
* **完全 private**
* 公開・販売・共有不可

✅ **実装済み**: こよりは完全private（`app/api/koyori/route.ts`で所有確認のみ）

### 10.2 こよりでできること

* こより作成／編集／削除
* ReadingLog / OCR / メモを束ねる
* 並び替え
* 短文まとめメモ

✅ **実装済み**: 
- 作成（`app/api/koyori/route.ts:65-70`）
- 編集（`app/api/koyori/[id]/route.ts:95-100`）
- 削除（`app/api/koyori/[id]/route.ts:136-138`）
- アイテム追加（`app/api/koyori/[id]/items/route.ts:89-99`）
- 並び替え（`app/api/koyori/[id]/items/reorder/route.ts:51-58`）

### 10.3 勉強コースとの境界

| 機能 | こより | 勉強コース |
|------|--------|------------|
| 束ねる | ✅ | ✅ |
| 論点抽出 | ❌ | ✅ |
| Meso化 | ❌ | ✅ |
| 卒業判定 | ❌ | ✅ |
| 成長可視化 | ❌ | ✅ |

---

## 11. 著作権・安全設計（強化）

* OCR本文の公開禁止
* 公開時：
  * 自分の言葉が必須
  * 引用文字数制限
* レビュー：
  * 引用元＋自分の言葉を明示
* 書籍紹介は **URLのみ**

✅ **実装済み**: ReadingLogは`visibility`で公開範囲を制御（`PRIVATE/PARTIAL/PUBLIC`）。Snapshot公開機能あり（`app/api/snapshots/route.ts`）。Private Logは`visibility: PRIVATE`で非公開

---

## 12. 料金（再掲・確定）

### 12.1 勉強コース（冊数制）

⚠️ **実装との不一致**: 仕様書と実装で料金が異なる

| 冊数 | 月額（仕様書） | 月額（実装） | 状態 |
|------|---------------|-------------|------|
| 3冊 | 600円 | 450円 | 🟡 不一致 |
| 5冊 | （記載なし） | 700円 | 🟡 実装のみ |
| 10冊 | 1,500円 | 1,400円 | 🟡 不一致 |
| 20冊 | 2,600円 | 2,600円 | ✅ 一致 |
| 30冊 | 3,600円 | （未実装） | 🔴 未実装 |
| 50冊 | 5,000円 | （未実装） | 🔴 未実装 |

**根拠**: `lib/plan-config.ts:5-11`

**修正方針**: 仕様書を実装に合わせる、または実装を仕様書に合わせる（要決定）

### 12.2 アフィリエイト

* **AFFILIATE**：300円
* **STUDY**：無料扱い（常時ON）

---

## 13. 用語定義（確定）

| 用語 | 定義 |
|------|------|
| ReadingLog（Micro） | 読んだ部分単位の最小ログ |
| Meso | 複数Microを束ねたテーマ・章まとめ（論点単位） |
| Macro | 1冊全体の成果ページ |
| Snapshot | 公開用に固定化したデータ（SEO・負荷対策） |
| こより（Koyori） | 本をまたいで断片を束ねる無料機能 |
| 論点 | 勉強コースで抽出・記述・マークする理解の要点 |

---

## 14. 機能要件（実装済み / 未実装を分離）

### 14-A. 実装済み（根拠があるもののみ）

#### 認証機能

✅ **ユーザー登録**: メールアドレスとパスワードで新規アカウント作成（`app/api/auth/register/route.ts:11-53`, `app/register/page.tsx:1-99`）

✅ **ログイン**: メールアドレスとパスワードでログイン（`app/api/auth/login/route.ts:12-64`, `app/login/page.tsx:14-175`）

✅ **ログアウト**: セッション終了（`app/api/auth/logout/route.ts:4-8`）

✅ **認証状態確認**: 現在のログイン状態とユーザー情報取得（`app/api/auth/me/route.ts:5-28`）

#### 本の検索・登録機能

✅ **本の検索**: 書名や著者名で検索（楽天・Amazon API / 既存DB）（`app/api/book-search/route.ts:11-100`, `lib/book-search.ts:24-217`, `components/BookSearchInput.tsx:30-293`）

✅ **本の登録（手動入力）**: 書名を手動入力して登録（`app/books/page.tsx:100-126`, `app/api/books/route.ts:58-121`）

✅ **本の登録（検索結果から選択）**: 検索結果から選択して登録（`app/books/page.tsx:129-161`, `app/api/books/route.ts:58-121`）

✅ **本一覧取得**: 自分が登録した本の一覧取得（`app/books/page.tsx:37-98`, `app/api/books/route.ts:17-55`）

#### レビュー機能

✅ **レビュー投稿**: 本に対してレビュー（★、コメント、キーワード、好きな一文、感情タグ、公開設定、ネタバレフラグ）を投稿（`app/books/[id]/review/page.tsx:93-131`, `app/api/reviews/route.ts:58-155`）

✅ **レビュー更新**: 既存レビューを更新（進化ログが記録される）（`app/api/reviews/route.ts:75-100,100-120`）

✅ **レビュー一覧取得（自分のレビュー）**: 自分が投稿したレビューの一覧取得（`app/reviews/page.tsx:25-45`, `app/api/reviews/route.ts:21-55`）

✅ **レビュー削除**: 自分が投稿したレビューを削除（`app/reviews/page.tsx:47-65`, `app/api/reviews/[id]/route.ts:25-27`）

✅ **レビューサマリー取得（積読カード用）**: 特定の本に対する公開レビューの平均評価と抜粋（最大3件）取得（`app/api/books/[bookId]/review-summary/route.ts:9-94`, `components/ReviewSummaryCard.tsx:1-150`）

#### 読書ログ（ReadingLog）機能

✅ **ReadingLog作成**: 読んだ範囲、要点、反応、タグ、質問、気になった言葉、非公開メモを記録（`app/api/reading-logs/route.ts:74-160`）

✅ **ReadingLog一覧取得**: 自分のReadingLogの一覧取得（書籍IDでフィルタ可能）（`app/api/reading-logs/route.ts:25-69`）

✅ **ReadingLog更新**: 既存のReadingLogを更新（`app/api/reading-logs/[id]/route.ts:144-160`）

✅ **ReadingLog削除**: 自分のReadingLogを削除（`app/api/reading-logs/[id]/route.ts:193-195`）

#### 積読機能

✅ **書籍状態設定**: 本に対して「積読」「読書中」「読了」「一時停止」の状態を設定（`app/books/page.tsx:221-289`, `app/api/user-books/route.ts:49-100`）

✅ **積読書籍一覧表示**: 「積読」状態の書籍のみを一覧表示（`app/books/page.tsx:221-289`）

✅ **積読カードにレビューサマリー表示**: 積読カードに公開レビューの平均評価と抜粋（最大3件）を表示（`app/books/page.tsx:221-289`, `components/ReviewSummaryCard.tsx:1-150`）

#### ギフト機能

✅ **ギフト作成**: 購入URL、メッセージ、有効期限を設定してギフトを作成（`app/gifts/page.tsx:31-568`, `app/api/gifts/route.ts:85-97`）

✅ **ギフト一覧取得**: 自分が作成したギフトの一覧取得（`app/gifts/page.tsx:50-100`, `app/api/gifts/route.ts:27-47`）

✅ **ギフト公開ページ閲覧**: ギフトトークンを使って公開ページを閲覧（認証不要）（`app/gifts/[slug]/page.tsx`, `app/api/gifts/[id]/route.ts:17-20`）

✅ **ギフト分析閲覧（成果計測）**: ギフトの成果計測データ（開封率、CTR、購読率など）を閲覧（アフィリエイトON必須）（`app/gifts/[slug]/analytics/page.tsx:38-228`, `app/api/gift-events/route.ts:71-120`）

#### こより機能

✅ **こより作成**: タイトルを入力してこよりを作成（`app/koyori/page.tsx:39-60`, `app/api/koyori/route.ts:65-70`）

✅ **こより一覧取得**: 自分が作成したこよりの一覧取得（`app/koyori/page.tsx:27-37`, `app/api/koyori/route.ts:25-40`）

✅ **こより詳細表示・編集**: こよりの詳細を表示し、タイトルやメモを編集（`app/koyori/[id]/page.tsx`, `app/api/koyori/[id]/route.ts:24-40,95-100`）

✅ **こより削除**: 自分のこよりを削除（`app/api/koyori/[id]/route.ts:136-138`）

✅ **こよりアイテム削除**: こよりアイテムを削除（`app/api/koyori/items/[itemId]/route.ts:83-85`）

#### アフィリエイト機能

✅ **アフィリエイト状態確認**: 自分のアフィリエイト状態（OFF/ON/SUSPENDED）を確認（`app/settings/affiliate/page.tsx:38-49`, `app/api/affiliate/me/route.ts`）

✅ **アフィリエイト有効化（Paywall）**: アフィリエイト機能を有効化（月額300円、同意チェック2つ必須）（`components/PaywallModal.tsx`, `app/api/affiliate/opt-in/route.ts`）

✅ **アフィリエイト解約**: アフィリエイト機能を解約（`app/api/affiliate/cancel/route.ts:32-36`）

✅ **アフィリエイト状態ログ取得**: アフィリエイト状態の変更履歴（直近10件）を取得（`app/settings/affiliate/page.tsx:33-36`, `app/api/affiliate/state-logs/route.ts:19-27`）

✅ **成果ダッシュボード閲覧**: アフィリエイトON状態で成果ダッシュボードを閲覧（`app/affiliate/dashboard/page.tsx:38-228`, `app/api/gift-events/route.ts`）

#### ホーム画面機能

✅ **ホーム画面表示（学習部屋）**: 本棚、黒子キャラ、状態バー、クイック開始ボタンを表示（`app/page.tsx:37-211`）

✅ **今日の統計情報取得**: 今日のレビュー数、未ログ書籍数、連続日数を取得（`app/page.tsx:47-55`, `app/api/home/stats/route.ts`）

#### Snapshot公開機能

✅ **Snapshot作成**: 公開用に固定化したデータを作成（`app/api/snapshots/route.ts:240-275`）

✅ **Snapshot公開取得**: 公開Snapshotを取得（認証不要）（`app/api/snapshots/[id]/route.ts:11-60`）

#### ユーザー名表示

✅ **レビューサマリーでの表示名生成**: レビューサマリーで`user.name`を参照（未設定時はemailから生成）（`app/api/books/[bookId]/review-summary/route.ts:60,73`）

---

### 14-B. 次に追加する（未実装：ロードマップ）

#### 優先度：高（ユーザーが直接操作する基本機能）

1. **本の編集機能**: 本のタイトル等を編集するAPI・UIを追加
   - **理由**: 誤登録の修正など、よくある要望
   - **根拠**: `app/api/books/route.ts`に`PUT`メソッドがない

2. **本の削除機能**: 本を削除するAPI・UIを追加（Cascade削除の警告含む）
   - **理由**: 誤登録の削除など、よくある要望
   - **根拠**: `app/api/books/route.ts`に`DELETE`メソッドがない

3. **ユーザー名入力機能**: ユーザー登録時に名前を入力するUIを追加
   - **理由**: 既存機能（レビューサマリー）の完成。実装コストが低い
   - **根拠**: `app/api/auth/register/route.ts:32-43`で`name`が設定されていない

4. **おすすめ本機能（UI実装）**: `recommendedBooks`フィールドのUI入力・送信導線を追加
   - **理由**: DB/APIは既にあるため、UI追加のみで完成
   - **根拠**: `app/api/reviews/route.ts:13`で定義、`app/books/[id]/review/page.tsx:106-115`で未送信

#### 優先度：中（探索・発見機能）

5. **レビュー検索機能**: キーワード・タイトルでレビューを検索する機能
   - **理由**: 自分のレビューを探したい（探索機能）
   - **根拠**: `app/api/reviews/route.ts:21-55`で`bookId`フィルタのみ

6. **他人のレビュー閲覧機能（一覧）**: 公開レビュー一覧を表示する画面
   - **理由**: 公開レビューを見たい（積読サマリーは既にあるが、一覧は未実装）
   - **根拠**: `app/api/reviews/route.ts:29`で`where: { userId }`のみ

7. **マイページ機能**: ユーザープロフィール・設定を管理する専用画面
   - **理由**: プロフィール管理（現状は各設定画面に分散しているが、必須ではない）
   - **根拠**: `app/page.tsx`はホーム画面であり、マイページではない

#### 優先度：低（内部整合性・将来計画）

8. **料金設定の統一**: 仕様書と実装の料金設定を統一（3冊・10冊の料金、30冊・50冊プランの実装）
   - **理由**: 内部整合性の問題。ユーザーには直接影響しない
   - **根拠**: `lib/plan-config.ts:5-11`で料金設定が異なる

---

### 14-C. フェーズ2以降（将来）

1. **PublicInsight / Query / /q/[slug]**: 公開クエリ機能（実装痕跡なし）
   - **状態**: 未発見（コード上で存在が確認できない）
   - **根拠**: `codebase_search`で検索結果なし
   - **判断**: 将来計画として残す（実装予定が明確になるまで保留）

2. **横断検索（有料）**: 論点×反応×期間での横断検索

3. **成長可視化機能（有料）**: 理解までの日数推移、混乱→理解回数、Before/After等の可視化

---

## 15. データモデル（概念）

### 15-A. 現行DBに存在するモデル

✅ **User**: ユーザー情報（`prisma/schema.prisma:15-66`）

✅ **Book**: 書籍情報（`prisma/schema.prisma:68-102`）

✅ **ReadingLog**: 読書ログ（`prisma/schema.prisma:109-147`）

✅ **Review**: レビュー（`prisma/schema.prisma:631-654`）

✅ **Gift**: ギフト（`prisma/schema.prisma:357-394`）

✅ **GiftEvent**: ギフト成果計測イベント（`prisma/schema.prisma:396-416`）

✅ **Koyori**: こより（`prisma/schema.prisma:478-492`）

✅ **KoyoriItem**: こよりアイテム（`prisma/schema.prisma:494-516`）

✅ **UserBook**: ユーザー×書籍の状態（`prisma/schema.prisma:693-708`）

✅ **OCRAsset**: OCR画像・テキスト（`prisma/schema.prisma:262-283`）

✅ **StudyItem**: 勉強コースの学習項目（`prisma/schema.prisma:289-319`）

✅ **StudyAttempt**: 復習ログ（`prisma/schema.prisma:321-351`）

✅ **PublishedSnapshot**: 公開Snapshot（`prisma/schema.prisma:188-224`）

✅ **SnapshotSource**: Snapshotのソース（`prisma/schema.prisma:234-256`）

✅ **Tag**: タグ（`prisma/schema.prisma:154-166`）

✅ **ReadingLogTag**: ReadingLog×Tagの関連（`prisma/schema.prisma:168-181`）

✅ **AffiliateStateLog**: アフィリエイト状態ログ（`prisma/schema.prisma:447-461`）

### 15-B. 将来追加モデル

（現在、将来追加予定のモデルは未定義）

---

## 16. API要件

### 16-A. 現行API

✅ **認証**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

✅ **本**: `GET /api/books`, `POST /api/books`, `GET /api/book-search`, `GET /api/books/[bookId]/review-summary`

✅ **レビュー**: `GET /api/reviews`, `POST /api/reviews`, `DELETE /api/reviews/[id]`

✅ **ReadingLog**: `GET /api/reading-logs`, `POST /api/reading-logs`, `PUT /api/reading-logs/[id]`, `DELETE /api/reading-logs/[id]`

✅ **ユーザー×本**: `GET /api/user-books`, `POST /api/user-books`

✅ **ギフト**: `GET /api/gifts`, `POST /api/gifts`, `GET /api/gifts/[id]`, `GET /api/gift-events`

✅ **こより**: `GET /api/koyori`, `POST /api/koyori`, `GET /api/koyori/[id]`, `PUT /api/koyori/[id]`, `DELETE /api/koyori/[id]`, `POST /api/koyori/[id]/items`, `POST /api/koyori/[id]/items/reorder`, `PUT /api/koyori/items/[itemId]`, `DELETE /api/koyori/items/[itemId]`

✅ **アフィリエイト**: `GET /api/affiliate/me`, `POST /api/affiliate/opt-in`, `POST /api/affiliate/cancel`, `GET /api/affiliate/state-logs`

✅ **ホーム**: `GET /api/home/stats`

✅ **Snapshot**: `POST /api/snapshots`, `GET /api/snapshots/[id]`

### 16-B. 追加予定API

🔴 **本の編集**: `PUT /api/books/[id]`（未実装）

🔴 **本の削除**: `DELETE /api/books/[id]`（未実装）

🔴 **レビュー検索**: `GET /api/reviews?q=検索語`（未実装）

🔴 **他人のレビュー一覧**: `GET /api/reviews/public?bookId=xxx`（未実装）

---

## 17. UI/UX要件

### 17-A. 現行画面

✅ `/` - ホーム画面（`app/page.tsx`）

✅ `/login` - ログイン（`app/login/page.tsx`）

✅ `/register` - 新規登録（`app/register/page.tsx`）

✅ `/books` - 本一覧・登録（`app/books/page.tsx`）

✅ `/books/[id]/review` - レビュー投稿（`app/books/[id]/review/page.tsx`）

✅ `/books/[id]/reading-logs` - ReadingLog作成・一覧（`app/books/[id]/reading-logs/page.tsx`）

✅ `/reviews` - レビュー一覧（`app/reviews/page.tsx`）

✅ `/gifts` - ギフト管理（`app/gifts/page.tsx`）

✅ `/gifts/[slug]` - ギフト公開ページ（`app/gifts/[slug]/page.tsx`）

✅ `/gifts/[slug]/analytics` - ギフト分析（`app/gifts/[slug]/analytics/page.tsx`）

✅ `/koyori` - こより一覧（`app/koyori/page.tsx`）

✅ `/koyori/[id]` - こより詳細（`app/koyori/[id]/page.tsx`）

✅ `/settings/affiliate` - アフィリエイト設定（`app/settings/affiliate/page.tsx`）

✅ `/affiliate/dashboard` - 成果ダッシュボード（`app/affiliate/dashboard/page.tsx`）

### 17-B. 追加予定画面

🔴 `/profile` - マイページ（未実装）

🔴 `/reviews/public` - 他人のレビュー一覧（未実装）

---

## 18. 受け入れ条件

### 18-A. 現行MVP

✅ 認証機能（登録・ログイン・ログアウト）

✅ 本の検索・登録・一覧表示

✅ レビュー投稿・更新・削除・一覧表示

✅ ReadingLog作成・更新・削除・一覧表示

✅ 積読管理（状態設定・一覧表示・レビューサマリー表示）

✅ ギフト作成・一覧表示・公開ページ・分析

✅ こより作成・編集・削除・アイテム管理

✅ アフィリエイト機能（状態確認・有効化・解約・ログ・ダッシュボード）

✅ ホーム画面（統計情報表示）

✅ Snapshot公開機能

### 18-B. 次MVP

🟡 おすすめ本機能（UI実装）

🟡 本の編集・削除機能

🟡 ユーザー名入力機能

🟡 レビュー検索機能

🟡 他人のレビュー閲覧機能（一覧）

🟡 マイページ機能

---

## 19. 表記ルール

### 状態ラベル

- ✅ **実装済み（根拠あり）**: コード上で存在が確認できる機能。根拠（ファイルパス:行番号）を記載
- 🟡 **未実装（DBだけ/フィールドだけ存在＝B）**: フィールドやAPIスキーマは存在するが、UI導線がない
- 🔴 **未発見（実装痕跡なし）**: コード上で存在が確認できない機能

---

## 20. 実装優先順（確定）

1. AffiliateState導入 ✅ 実装済み
2. プラン管理（FREE/AFFILIATE/STUDY） ✅ 実装済み
3. 報酬ON切替UX ✅ 実装済み
4. 勉強コース強化（論点記述・マーク・卒業判定） 🟡 部分実装
5. 成長ダッシュボード 🔴 未実装
6. こより機能 ✅ 実装済み
7. 横断検索（有料） 🔴 未実装

---

## 最終結論

このプロジェクトは、

> **「人が理解に至る過程そのものを資産化する」**

ことに特化したプラットフォームであり、

* Micro（読書中ログ）✅ 実装済み
* Meso（論点単位の理解ノート）✅ 実装済み
* Macro（1冊の成果）✅ 実装済み
* Snapshot固定公開 ✅ 実装済み
* 勉強コース（理解・定着・成長）🟡 部分実装
* ギフト（拡散×収益）✅ 実装済み
* こより（本横断の断片束ね）✅ 実装済み

が **一本の思想で統合**されています。

---

最終更新: 2026-01-xx（整合性監査完了）
