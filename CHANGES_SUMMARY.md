# 通知機能改善 - 変更ファイル一覧

## 実装完了日
2024年

## 変更内容サマリー

### 1. 通知タイトル仕様準拠
- **変更**: location_value以外の接頭辞（「ページ」等）を削除
- **形式**: 「【復習】{書籍名}｜{location_value}」
- **fallback**: location_valueが空の場合は「（位置未設定）」

### 2. 重複抑制
- **実装**: 同一ユーザーで (studyRecordId + type + nextReviewAt) が同じ通知は作成しない
- **方法**: DBのunique制約 + アプリケーションレベルチェック

### 3. 次回復習日時の表示
- **追加**: 通知一覧に「次回復習: {日時}」を表示

### 4. 全画面共通ヘッダー＋未読数バッジ
- **実装**: すべてのページにヘッダーを表示
- **機能**: 未読通知数がバッジで表示、即時更新

---

## 変更ファイル一覧

### データベース
1. **`prisma/schema.prisma`**
   - `Notification` モデルに `nextReviewAt` フィールド追加
   - unique制約追加: `@@unique([userId, studyRecordId, type, nextReviewAt])`

### バックエンド
2. **`lib/notification-service.ts`**
   - 通知タイトル生成ロジック修正（接頭辞削除）
   - `nextReviewAt` パラメータを必須化
   - 重複チェック機能追加

3. **`app/api/study-records/[id]/review/route.ts`**
   - 通知生成時に `nextReviewAt` を渡すように修正

4. **`app/api/study-records/[id]/step1-2/route.ts`**
   - 通知生成時に `nextReviewAt` を渡すように修正

### フロントエンド
5. **`app/notifications/page.tsx`**
   - `nextReviewAt` を表示するように修正
   - 既読操作後にヘッダーの未読数を更新

6. **`components/AppHeader.tsx`**（既存ファイルを更新）
   - 未読数バッジ表示
   - ページ遷移時に未読数を更新
   - 10秒ごとにポーリングで未読数を更新
   - グローバル関数 `updateUnreadCount` を公開

7. **`app/layout.tsx`**
   - 全画面に `AppHeader` を組み込み（既に実装済み）

8. **`app/study/review/[id]/page.tsx`**
   - 復習完了後にヘッダーの未読数を更新

9. **`app/books/[id]/materials/page.tsx`**
   - 学習記録作成後にヘッダーの未読数を更新

### ドキュメント
10. **`NOTIFICATION_SETUP.md`**
    - 動作確認手順を更新

11. **`NOTIFICATION_CHANGES.md`**（新規作成）
    - 変更内容の詳細ドキュメント

12. **`CHANGES_SUMMARY.md`**（本ファイル）
    - 変更ファイル一覧とサマリー

---

## 動作確認手順（簡易版）

### 1. データベース更新
```bash
npx prisma generate
npx prisma db push
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. 確認項目

#### ✅ 通知タイトル
- 「【復習】{書籍名}｜p.45」形式（「ページ」が付いていない）

#### ✅ 重複抑制
- 同じ復習を実行しても通知が重複しない

#### ✅ 次回復習日時
- 通知一覧に「次回復習: {日時}」が表示される

#### ✅ ヘッダー未読数バッジ
- すべてのページでヘッダーに未読数バッジが表示される
- 通知操作後、ページ遷移時に即座に更新される
- 10秒ごとに自動更新（ポーリング）

---

## 技術的な詳細

### 重複抑制の仕組み

**DB制約:**
```prisma
@@unique([userId, studyRecordId, type, nextReviewAt])
```

**アプリケーションレベル:**
```typescript
const existing = await prisma.notification.findFirst({
  where: {
    userId,
    studyRecordId,
    type: notificationType,
    nextReviewAt,
  },
})

if (existing) {
  return // スキップ
}
```

### 未読数更新のタイミング

1. **ページ遷移時**: `useEffect` の依存配列に `user` を追加
2. **ポーリング**: 10秒ごとに自動更新
3. **通知操作後**: `window.updateUnreadCount()` を呼び出し
4. **復習完了後**: 通知生成の可能性があるため更新

---

## 注意事項

### データベース移行
- 既存の通知データがある場合、unique制約違反が発生する可能性があります
- 開発環境ではデータベースをリセットすることを推奨

### パフォーマンス
- ポーリング間隔は10秒に設定（必要に応じて調整可能）
- 将来的にはWebSocketやServer-Sent Eventsへの移行を検討

---

詳細な動作確認手順は `NOTIFICATION_CHANGES.md` を参照してください。
