# E2E検証手順書

**作成日**: 2026-01-xx  
**対象**: 勉強コース実装（価格プラン・データ量制御・復習フロー）

---

## Phase 3：データ量制御のE2E検証

### 検証環境

- 勉強コースユーザー（`plan !== 'FREE'`）でログイン
- 1冊（`bookId`）を作成済み

### 検証手順

#### 3-1. 1,200枚超で警告が出ることを確認

```bash
# 1,201枚目のOCRアセットを登録
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "bookId": "YOUR_BOOK_ID",
    "imageUrl": "https://example.com/image.jpg",
    "extractedText": "テストテキスト",
    "type": "PROBLEM"
  }'
```

**期待結果**:
- ステータス: `201 Created`
- レスポンスに `warning` フィールドが含まれる
- `warning: "1冊あたりの画像枚数が1,200枚を超えています。整理を推奨します。"`

#### 3-2. 1,500枚到達で追加登録不可を確認

```bash
# 1,500枚目のOCRアセットを登録
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "bookId": "YOUR_BOOK_ID",
    "imageUrl": "https://example.com/image.jpg",
    "extractedText": "テストテキスト",
    "type": "PROBLEM"
  }'
```

**期待結果**:
- ステータス: `403 Forbidden`
- エラーコード: `VOLUME_IMAGE_LIMIT_EXCEEDED`
- エラーメッセージ: `"1冊あたりの画像枚数上限（1500枚）に達しています。別冊として登録してください。"`

#### 3-3. 種別別上限の確認

```bash
# 問題画像501枚目を登録
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "bookId": "YOUR_BOOK_ID",
    "imageUrl": "https://example.com/image.jpg",
    "extractedText": "テストテキスト",
    "type": "PROBLEM"
  }'
```

**期待結果**:
- ステータス: `403 Forbidden`
- エラーメッセージ: `"問題画像は1冊あたり最大500枚までです。別冊として登録してください。"`

---

## Phase 4：OCRアセット種別管理のE2E検証

### 検証手順

#### 4-1. 種別保存の確認

```bash
# PROBLEM種別でOCRアセット作成
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "bookId": "YOUR_BOOK_ID",
    "imageUrl": "https://example.com/problem.jpg",
    "extractedText": "問題文",
    "type": "PROBLEM"
  }'
```

**期待結果**:
- ステータス: `201 Created`
- レスポンスの `ocrAsset.tags` に `{"type":"PROBLEM"}` が含まれる

#### 4-2. 種別フィルタリングの確認

```bash
# PROBLEM種別のみ取得
curl -X GET "http://localhost:3000/api/ocr-assets?bookId=YOUR_BOOK_ID&type=PROBLEM" \
  -H "Cookie: token=YOUR_TOKEN"
```

**期待結果**:
- ステータス: `200 OK`
- レスポンスに `type=PROBLEM` のOCRアセットのみ含まれる

#### 4-3. 既存データ（tags未設定）の扱い確認

```bash
# tags未設定のOCRアセットがREFERENCEとして扱われることを確認
# （既存データがある場合）
```

**期待結果**:
- `tags` が未設定のOCRアセットは `REFERENCE` としてカウントされる

---

## Phase 5：復習フローのE2E検証

### 前提条件

- StudyItemを複数作成済み（解説付き）
- そのうち1つ以上に `explanationText` が設定されている

### 検証手順

#### 5-1. Stage 1: 登録済み解説一覧取得

```bash
# 登録済み解説一覧取得
curl -X GET "http://localhost:3000/api/study-items/explanations?bookId=YOUR_BOOK_ID" \
  -H "Cookie: token=YOUR_TOKEN"
```

**期待結果**:
- ステータス: `200 OK`
- レスポンスに `explanationText` が存在するStudyItemのみ含まれる
- そのユーザーが登録した解説のみ（他ユーザーの解説は含まれない）

#### 5-2. Stage 2: キーワード検索

```bash
# キーワード検索
curl -X GET "http://localhost:3000/api/study-items/explanations?bookId=YOUR_BOOK_ID&keyword=微分" \
  -H "Cookie: token=YOUR_TOKEN"
```

**期待結果**:
- ステータス: `200 OK`
- レスポンスに `explanationText` または `promptText` に「微分」を含む解説のみ含まれる

#### 5-3. 解説選択

```bash
# 解説選択
curl -X POST http://localhost:3000/api/study-items/YOUR_STUDY_ITEM_ID/select-explanation \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "explanationId": "SELECTED_EXPLANATION_ID",
    "reflection": "なぜこの解説を選んだのか（任意）"
  }'
```

**期待結果**:
- ステータス: `200 OK`
- レスポンスに `selectedExplanation` が含まれる（誤選択時のフォロー情報）
- `problemText`, `referencePage`, `book` 情報が含まれる

#### 5-4. 所有チェック確認（他ユーザーの解説を選択できない）

```bash
# 他ユーザーの解説IDを指定して選択を試行
curl -X POST http://localhost:3000/api/study-items/YOUR_STUDY_ITEM_ID/select-explanation \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "explanationId": "OTHER_USER_EXPLANATION_ID"
  }'
```

**期待結果**:
- ステータス: `404 Not Found`
- エラーメッセージ: `"解説が見つかりません"`

---

## Phase 2：価格プラン表示の確認

### 検証手順

#### 2-1. プラン一覧の確認

```bash
# プラン設定を確認（コード確認）
# lib/plan-config.ts を開く
```

**期待結果**:
- `plan_3`: 450円
- `plan_5`: 700円（新規追加）
- `plan_10`: 1,400円
- `plan_20`: 2,600円
- `plan_30`, `plan_50` が存在しない

#### 2-2. UI表示の確認（該当ページがある場合）

- 料金表示ページで上記プランが表示されること
- 30冊・50冊プランが表示されないこと

---

## 検証結果記録テンプレート

### Phase 3: データ量制御

- [ ] 1,200枚超で警告が出る
- [ ] 1,500枚到達で追加登録不可
- [ ] 種別別上限（問題500枚）が機能する

### Phase 4: OCRアセット種別管理

- [ ] 種別保存（PROBLEM/EXPLANATION/REFERENCE）が機能する
- [ ] 種別フィルタリングが機能する
- [ ] 既存データ（tags未設定）がREFERENCE扱いになる

### Phase 5: 復習フロー

- [ ] Stage 1: 登録済み解説一覧取得が機能する
- [ ] Stage 2: キーワード検索が機能する
- [ ] 解説選択が機能する
- [ ] 所有チェック（他ユーザーの解説を選択できない）が機能する

---

## 注意事項

1. **テストデータの準備**: 各検証前に必要なテストデータを作成する
2. **認証トークン**: 各リクエストに有効な認証トークンを含める
3. **bookId**: 実際のbookIdを使用する
4. **エラーケース**: 正常系だけでなく、エラーケースも検証する
