# 非勉強コース機能一覧（実装事実のみ・根拠付き）

**作成日**: 2026-01-xx  
**目的**: コード上で存在が確認できる機能のみを列挙（推測禁止）

---

## 出力形式

各機能について以下を記載：
- **機能名**（ユーザー視点の言葉）
- **何ができるか**（1行）
- **対象コース**：非勉強コース（固定）
- **根拠**：ファイルパス:行番号-行番号（必ず）
- **入口**：画面（URL/ルート） or API（エンドポイント）
- **テスト観点**：正常系1つ＋異常系1つ

---

## ① 認証機能

### 1. ユーザー登録

**何ができるか**: メールアドレスとパスワードで新規アカウントを作成できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/register/page.tsx:1-99`
- API: `app/api/auth/register/route.ts:11-53`

**入口**: 
- 画面: `/register`
- API: `POST /api/auth/register`

**テスト観点**:
- 正常系: メールアドレスとパスワード（6文字以上）を入力して登録成功
- 異常系: 既存メールアドレスで登録しようとしてエラー

---

### 2. ログイン

**何ができるか**: メールアドレスとパスワードでログインできる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/login/page.tsx:14-175`
- API: `app/api/auth/login/route.ts:12-64`

**入口**: 
- 画面: `/login`
- API: `POST /api/auth/login`

**テスト観点**:
- 正常系: 正しいメールアドレスとパスワードでログイン成功
- 異常系: 間違ったパスワードでログイン失敗

---

### 3. ログアウト

**何ができるか**: セッションを終了してログアウトできる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/auth/logout/route.ts:4-8`

**入口**: 
- API: `POST /api/auth/logout`

**テスト観点**:
- 正常系: ログアウトAPIを呼び出してクッキーが削除される
- 異常系: 未ログイン状態でログアウトAPIを呼び出してもエラーにならない（想定）

---

### 4. 認証状態確認

**何ができるか**: 現在のログイン状態とユーザー情報を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/auth/me/route.ts:5-28`

**入口**: 
- API: `GET /api/auth/me`

**テスト観点**:
- 正常系: ログイン済みユーザーが自分の情報を取得できる
- 異常系: 未ログイン状態で`null`が返る

---

## ② 本の検索・登録機能

### 5. 本の検索（外部API・既存DB）

**何ができるか**: 書名や著者名で検索し、楽天・Amazon APIまたは既存DBから候補を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/book-search/route.ts:11-100`
- 外部API呼び出し: `lib/book-search.ts:24-217`
- UI: `components/BookSearchInput.tsx:30-293`

**入口**: 
- API: `GET /api/book-search?q=検索語&providers=RAKUTEN,AMAZON&includeExisting=true`

**テスト観点**:
- 正常系: 検索語を入力して候補が表示される
- 異常系: 検索語が2文字未満で候補が表示されない

---

### 6. 本の登録（手動入力）

**何ができるか**: 書名を手動入力して本を登録できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:100-126`
- API: `app/api/books/route.ts:58-121`

**入口**: 
- 画面: `/books`（手動入力モード）
- API: `POST /api/books`

**テスト観点**:
- 正常系: 書名を入力して本を登録成功
- 異常系: 書名が空で登録失敗

---

### 7. 本の登録（検索結果から選択）

**何ができるか**: 検索結果から本を選択して登録できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:129-161`
- API: `app/api/books/route.ts:58-121`

**入口**: 
- 画面: `/books`（検索モード）
- API: `POST /api/books`

**テスト観点**:
- 正常系: 検索結果から本を選択して登録成功
- 異常系: 検索結果が空の状態で選択しようとしてエラー

---

### 8. 本一覧取得

**何ができるか**: 自分が登録した本の一覧を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:37-98`
- API: `app/api/books/route.ts:17-55`

**入口**: 
- 画面: `/books`
- API: `GET /api/books`

**テスト観点**:
- 正常系: 登録済みの本が一覧表示される
- 異常系: 未ログイン状態で401エラー

---

## ③ レビュー機能

### 9. レビュー投稿

**何ができるか**: 本に対してレビュー（★、コメント、キーワード、好きな一文、感情タグ、公開設定、ネタバレフラグ）を投稿できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/[id]/review/page.tsx:93-131`
- API: `app/api/reviews/route.ts:58-155`

**入口**: 
- 画面: `/books/[id]/review`
- API: `POST /api/reviews`

**テスト観点**:
- 正常系: レビューを入力して投稿成功
- 異常系: 感情タグが未選択で投稿失敗

---

### 10. レビュー更新

**何ができるか**: 既存のレビューを更新できる（進化ログが記録される）

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/[id]/review/page.tsx:69-91`（既存レビュー取得）
- API: `app/api/reviews/route.ts:75-100`（進化ログ作成）、`app/api/reviews/route.ts:100-120`（レビュー更新）

**入口**: 
- 画面: `/books/[id]/review`（既存レビューがある場合）
- API: `POST /api/reviews`（既存レビューがある場合）

**テスト観点**:
- 正常系: 既存レビューを更新して進化ログが作成される
- 異常系: 他人のレビューを更新しようとしてエラー

---

### 11. レビュー一覧取得（自分のレビュー）

**何ができるか**: 自分が投稿したレビューの一覧を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/reviews/page.tsx:25-45`
- API: `app/api/reviews/route.ts:21-55`

**入口**: 
- 画面: `/reviews`
- API: `GET /api/reviews`

**テスト観点**:
- 正常系: 自分のレビューが一覧表示される
- 異常系: 未ログイン状態で401エラー

---

### 12. レビュー削除

**何ができるか**: 自分が投稿したレビューを削除できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/reviews/page.tsx:47-65`
- API: `app/api/reviews/[id]/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/reviews`
- API: `DELETE /api/reviews/[id]`

**テスト観点**:
- 正常系: レビューを削除成功
- 異常系: 他人のレビューを削除しようとしてエラー

---

### 13. レビューサマリー取得（積読カード用）

**何ができるか**: 特定の本に対する公開レビューの平均評価と抜粋（最大3件）を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/books/[bookId]/review-summary/route.ts:9-94`
- UI: `components/ReviewSummaryCard.tsx:1-150`（想定）

**入口**: 
- API: `GET /api/books/[bookId]/review-summary?includeSpoilers=0|1`

**テスト観点**:
- 正常系: 公開レビューの平均評価と抜粋が取得できる
- 異常系: ネタバレレビューがデフォルトで除外される（`includeSpoilers=0`）

---

## ④ 読書ログ（ReadingLog）機能

### 14. ReadingLog作成

**何ができるか**: 読んだ範囲（ページ/章/自由形式）、要点（30-80字）、反応、タグ、質問、気になった言葉、非公開メモを記録できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/reading-logs/route.ts:74-160`
- 画面: `app/books/[id]/reading-logs/page.tsx`（想定、ファイル未確認）

**入口**: 
- 画面: `/books/[id]/reading-logs`
- API: `POST /api/reading-logs`

**テスト観点**:
- 正常系: ReadingLogを作成成功
- 異常系: 要点が30文字未満で作成失敗

---

### 15. ReadingLog一覧取得

**何ができるか**: 自分のReadingLogの一覧を取得できる（書籍IDでフィルタ可能）

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/reading-logs/route.ts:25-69`

**入口**: 
- API: `GET /api/reading-logs?bookId=xxx&limit=50&offset=0`

**テスト観点**:
- 正常系: ReadingLog一覧が取得できる
- 異常系: 他人のReadingLogが含まれない

---

### 16. ReadingLog更新

**何ができるか**: 既存のReadingLogを更新できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/reading-logs/[id]/route.ts`（想定、ファイル未確認）

**入口**: 
- API: `PUT /api/reading-logs/[id]`

**テスト観点**:
- 正常系: ReadingLogを更新成功
- 異常系: 他人のReadingLogを更新しようとしてエラー

---

### 17. ReadingLog削除

**何ができるか**: 自分のReadingLogを削除できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- API: `app/api/reading-logs/[id]/route.ts`（想定、ファイル未確認）

**入口**: 
- API: `DELETE /api/reading-logs/[id]`

**テスト観点**:
- 正常系: ReadingLogを削除成功
- 異常系: 他人のReadingLogを削除しようとしてエラー

---

## ⑤ 積読機能

### 18. 書籍状態設定（積読・読書中・読了・一時停止）

**何ができるか**: 本に対して「積読」「読書中」「読了」「一時停止」の状態を設定できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:221-289`（状態選択UI）
- API: `app/api/user-books/route.ts:49-100`

**入口**: 
- 画面: `/books`（各書籍カードの状態選択）
- API: `POST /api/user-books`

**テスト観点**:
- 正常系: 書籍の状態を「積読」に設定成功
- 異常系: 無効な状態値を送信してエラー

---

### 19. 積読書籍一覧表示

**何ができるか**: 「積読」状態の書籍のみを一覧表示できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:221-289`（タブ切り替え）

**入口**: 
- 画面: `/books`（「積読」タブ）

**テスト観点**:
- 正常系: 積読タブで積読書籍のみ表示される
- 異常系: 積読書籍が0件の場合に空状態が表示される

---

### 20. 積読カードにレビューサマリー表示

**何ができるか**: 積読カードに公開レビューの平均評価と抜粋（最大3件）を表示できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/books/page.tsx:221-289`（`ReviewSummaryCard`コンポーネント使用）
- コンポーネント: `components/ReviewSummaryCard.tsx:1-150`（想定）

**入口**: 
- 画面: `/books`（「積読」タブ）

**テスト観点**:
- 正常系: 積読カードにレビューサマリーが表示される
- 異常系: 公開レビューが0件の場合に空状態が表示される

---

## ⑥ ギフト機能

### 21. ギフト作成

**何ができるか**: 購入URL、メッセージ、有効期限を設定してギフトを作成できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/gifts/page.tsx:31-568`
- API: `app/api/gifts/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/gifts`
- API: `POST /api/gifts`

**テスト観点**:
- 正常系: 購入URLを入力してギフト作成成功
- 異常系: 無効なURL形式で作成失敗

---

### 22. ギフト一覧取得

**何ができるか**: 自分が作成したギフトの一覧を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/gifts/page.tsx:50-100`（`fetchGifts`関数）
- API: `app/api/gifts/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/gifts`
- API: `GET /api/gifts`

**テスト観点**:
- 正常系: 自分が作成したギフトが一覧表示される
- 異常系: 未ログイン状態で401エラー

---

### 23. ギフト公開ページ閲覧

**何ができるか**: ギフトトークンを使って公開ページを閲覧できる（認証不要）

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/gifts/[slug]/page.tsx`（想定、ファイル未確認）
- API: `app/api/gifts/[id]/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/gifts/[slug]`
- API: `GET /api/gifts/[slug]`

**テスト観点**:
- 正常系: ギフトトークンで公開ページを閲覧できる
- 異常系: 無効なトークンで404エラー

---

### 24. ギフト分析閲覧（成果計測）

**何ができるか**: ギフトの成果計測データ（開封率、CTR、購読率など）を閲覧できる（アフィリエイトON必須）

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/gifts/[slug]/analytics/page.tsx:38-228`（想定）
- API: `app/api/gift-events/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/gifts/[id]/analytics`
- API: `GET /api/gift-events`

**テスト観点**:
- 正常系: アフィリエイトON状態で分析データを閲覧できる
- 異常系: アフィリエイトOFF状態でPaywallが表示される

---

## ⑦ こより機能

### 25. こより作成

**何ができるか**: タイトルを入力してこより（断片を束ねる機能）を作成できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/koyori/page.tsx:39-60`
- API: `app/api/koyori/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/koyori`
- API: `POST /api/koyori`

**テスト観点**:
- 正常系: タイトルを入力してこより作成成功
- 異常系: タイトルが空で作成失敗

---

### 26. こより一覧取得

**何ができるか**: 自分が作成したこよりの一覧を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/koyori/page.tsx:27-37`
- API: `app/api/koyori/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/koyori`
- API: `GET /api/koyori`

**テスト観点**:
- 正常系: こより一覧が表示される
- 異常系: 未ログイン状態で401エラー

---

### 27. こより詳細表示・編集

**何ができるか**: こよりの詳細を表示し、タイトルやメモを編集できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/koyori/[id]/page.tsx`（想定、ファイル未確認）
- API: `app/api/koyori/[id]/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/koyori/[id]`
- API: `GET /api/koyori/[id]`, `PUT /api/koyori/[id]`

**テスト観点**:
- 正常系: こよりの詳細を表示・編集成功
- 異常系: 他人のこよりを編集しようとしてエラー

---

## ⑧ アフィリエイト機能

### 28. アフィリエイト状態確認

**何ができるか**: 自分のアフィリエイト状態（OFF/ON/SUSPENDED）を確認できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/settings/affiliate/page.tsx:38-49`
- API: `app/api/affiliate/me/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/settings/affiliate`
- API: `GET /api/affiliate/me`

**テスト観点**:
- 正常系: アフィリエイト状態が表示される
- 異常系: 未ログイン状態で401エラー

---

### 29. アフィリエイト有効化（Paywall）

**何ができるか**: アフィリエイト機能を有効化できる（月額300円、同意チェック2つ必須）

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/settings/affiliate/page.tsx`（PaywallModal使用）
- コンポーネント: `components/PaywallModal.tsx`（想定、ファイル未確認）
- API: `app/api/affiliate/opt-in/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/settings/affiliate`（「有効にする」ボタン）
- API: `POST /api/affiliate/opt-in`

**テスト観点**:
- 正常系: 同意チェック2つを入れて有効化成功
- 異常系: 同意チェックが1つだけでは有効化ボタンが無効

---

### 30. アフィリエイト解約

**何ができるか**: アフィリエイト機能を解約できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/settings/affiliate/page.tsx`（想定、ファイル未確認）
- API: `app/api/affiliate/cancel/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/settings/affiliate`
- API: `POST /api/affiliate/cancel`

**テスト観点**:
- 正常系: アフィリエイトを解約成功
- 異常系: アフィリエイトOFF状態で解約しようとしてエラー

---

### 31. アフィリエイト状態ログ取得

**何ができるか**: アフィリエイト状態の変更履歴（直近10件）を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/settings/affiliate/page.tsx:33-36`（`fetchLogs`関数）
- API: `app/api/affiliate/state-logs/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/settings/affiliate`
- API: `GET /api/affiliate/state-logs`

**テスト観点**:
- 正常系: 状態ログが表示される
- 異常系: ログが0件の場合に空状態が表示される

---

### 32. 成果ダッシュボード閲覧

**何ができるか**: アフィリエイトON状態で成果ダッシュボードを閲覧できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/affiliate/dashboard/page.tsx:38-228`
- API: `app/api/gift-events/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/affiliate/dashboard`
- API: `GET /api/gift-events`

**テスト観点**:
- 正常系: アフィリエイトON状態でダッシュボードを閲覧できる
- 異常系: アフィリエイトOFF状態でPaywallが表示される

---

## ⑨ ホーム画面機能

### 33. ホーム画面表示（学習部屋）

**何ができるか**: 本棚、黒子キャラ、状態バー、クイック開始ボタンを表示できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/page.tsx:37-211`

**入口**: 
- 画面: `/`

**テスト観点**:
- 正常系: ホーム画面が表示される
- 異常系: 未ログイン状態でログイン画面へ誘導される

---

### 34. 今日の統計情報取得

**何ができるか**: 今日のレビュー数、未ログ書籍数、連続日数を取得できる

**対象コース**: 非勉強コース（固定）

**根拠**: 
- 画面: `app/page.tsx:47-55`（`fetchHomeData`関数）
- API: `app/api/home/stats/route.ts`（想定、ファイル未確認）

**入口**: 
- 画面: `/`（自動取得）
- API: `GET /api/home/stats`

**テスト観点**:
- 正常系: 統計情報が表示される
- 異常系: 未ログイン状態で401エラー

---

## ⑩ 未発見の機能領域

### 推測ではなく「未発見」として列挙

以下の機能は、コード上で存在が確認できませんでした：

1. **おすすめ本機能（最大3冊選択）**
   - `app/api/reviews/route.ts:13`に`recommendedBooks`フィールドは存在するが、UIで送信されていない
   - 根拠: `app/books/[id]/review/page.tsx:100-131`で`recommendedBooks`が送信されていない

2. **レビュー検索機能（キーワード・タイトル検索）**
   - レビュー一覧取得APIに検索パラメータが存在しない
   - 根拠: `app/api/reviews/route.ts:21-55`で`bookId`フィルタのみ

3. **他人のレビュー閲覧機能（公開レビュー一覧）**
   - 自分のレビュー一覧のみ実装されている
   - 根拠: `app/api/reviews/route.ts:29`で`where: { userId }`のみ

4. **本の削除機能**
   - 本の削除APIが存在しない
   - 根拠: `app/api/books/route.ts`に`DELETE`メソッドがない

5. **本の編集機能**
   - 本の更新APIが存在しない
   - 根拠: `app/api/books/route.ts`に`PUT`メソッドがない

6. **マイページ機能**
   - マイページ専用の画面が存在しない
   - 根拠: `app/page.tsx`はホーム画面であり、マイページではない

---

## ⑪ 画面ルート一覧（Next.js App Router）

### 画面URLとファイルパスの対応

| URL | ファイルパス | 機能 |
|-----|------------|------|
| `/` | `app/page.tsx` | ホーム画面 |
| `/login` | `app/login/page.tsx` | ログイン |
| `/register` | `app/register/page.tsx` | 新規登録 |
| `/books` | `app/books/page.tsx` | 本一覧・登録 |
| `/books/[id]/review` | `app/books/[id]/review/page.tsx` | レビュー投稿 |
| `/books/[id]/reading-logs` | `app/books/[id]/reading-logs/page.tsx` | ReadingLog作成・一覧 |
| `/reviews` | `app/reviews/page.tsx` | レビュー一覧 |
| `/gifts` | `app/gifts/page.tsx` | ギフト管理 |
| `/gifts/[slug]` | `app/gifts/[slug]/page.tsx` | ギフト公開ページ |
| `/gifts/[slug]/analytics` | `app/gifts/[slug]/analytics/page.tsx` | ギフト分析 |
| `/koyori` | `app/koyori/page.tsx` | こより一覧 |
| `/koyori/[id]` | `app/koyori/[id]/page.tsx` | こより詳細 |
| `/settings/affiliate` | `app/settings/affiliate/page.tsx` | アフィリエイト設定 |
| `/affiliate/dashboard` | `app/affiliate/dashboard/page.tsx` | 成果ダッシュボード |

---

## ⑫ APIエンドポイント一覧

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 認証状態確認

### 本
- `GET /api/books` - 本一覧取得
- `POST /api/books` - 本登録
- `GET /api/book-search` - 本検索
- `GET /api/book-search/config` - 検索設定取得
- `GET /api/books/[bookId]/review-summary` - レビューサマリー取得

### レビュー
- `GET /api/reviews` - レビュー一覧取得
- `POST /api/reviews` - レビュー投稿・更新
- `DELETE /api/reviews/[id]` - レビュー削除（想定）

### ReadingLog
- `GET /api/reading-logs` - ReadingLog一覧取得
- `POST /api/reading-logs` - ReadingLog作成
- `PUT /api/reading-logs/[id]` - ReadingLog更新（想定）
- `DELETE /api/reading-logs/[id]` - ReadingLog削除（想定）

### ユーザー×本
- `GET /api/user-books` - 書籍状態一覧取得
- `POST /api/user-books` - 書籍状態更新

### ギフト
- `GET /api/gifts` - ギフト一覧取得
- `POST /api/gifts` - ギフト作成
- `GET /api/gifts/[slug]` - ギフト公開取得
- `GET /api/gift-events` - ギフト成果計測取得

### こより
- `GET /api/koyori` - こより一覧取得
- `POST /api/koyori` - こより作成
- `GET /api/koyori/[id]` - こより取得（想定）
- `PUT /api/koyori/[id]` - こより更新（想定）
- `DELETE /api/koyori/[id]` - こより削除（想定）

### アフィリエイト
- `GET /api/affiliate/me` - アフィリエイト状態取得
- `POST /api/affiliate/opt-in` - アフィリエイト有効化
- `POST /api/affiliate/cancel` - アフィリエイト解約
- `GET /api/affiliate/state-logs` - 状態ログ取得

### ホーム
- `GET /api/home/stats` - 統計情報取得

---

## まとめ

### 実装済み機能数: 34機能

### 対象コース: 非勉強コース（固定）

### 根拠の原則
- すべての機能について、ファイルパスと行番号を明記
- 推測は禁止
- 「想定」と記載したものは、ファイル未確認のため要検証

### 未発見機能: 6領域
1. おすすめ本機能（UI未実装）
2. レビュー検索機能
3. 他人のレビュー閲覧機能
4. 本の削除機能
5. 本の編集機能
6. マイページ機能
