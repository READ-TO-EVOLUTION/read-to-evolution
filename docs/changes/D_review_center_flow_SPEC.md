# レビュー中心導線・報酬ゲート・構造化フォーム - MVP仕様

**作成日**: 2026-02-08  
**目的**: 矛盾点を解消するための最小実装仕様

---

## B. 仕様の最小決定（MVP）

### B.1 新規「レビュー閲覧トップ」画面

**パス**: `/r` または `/reviews/public`  
**認証**: 不要（未ログインでも閲覧可能）  
**表示内容**: 公開レビュー一覧（全書籍横断）

**API**:
- `GET /api/reviews/public` を拡張
  - `bookId`を必須から任意に変更
  - `bookId`が指定されていない場合は全公開レビューを取得

**表示形式**: 構造化ブロック優先
- 買う理由
- 良かった点
- 足りない点
- 悪かった点
- 読んだ日
- ページ数
- 引用（OCR一文）
- 自由記述（補助）

### B.2 Reviewモデル拡張

**方針**: 既存の`Review`モデルを拡張（別テーブルは作らない）

**追加フィールド** (`prisma/schema.prisma`):
```prisma
model Review {
  // 既存フィールド...
  
  // 構造化フィールド（新規追加）
  buyReason      String? @map("buy_reason")        // 買う理由
  goodPoints     String? @map("good_points")       // 良かった点
  missingPoints  String? @map("missing_points")    // 足りない点
  badPoints      String? @map("bad_points")         // 悪かった点
  readDate       DateTime? @map("read_date")       // 読んだ日
  pagesRead      Int? @map("pages_read")          // ページ数
  ocrQuote       String? @map("ocr_quote")         // OCR一文（引用）
  
  // 既存のcommentは自由記述として残す（補助）
}
```

**必須/任意の定義**:
- 必須: `rating`, `emotionTag`
- 任意: その他すべて（構造化フィールドも任意）

### B.3 報酬ゲートの実装

**方針**: レビュー投稿は全員OK、報酬計上は有料（またはaffiliate opt-in）のみ

**実装箇所**: `app/api/reviews/route.ts` の `POST` メソッド内

**判定ロジック**:
1. レビュー作成/更新は全員OK（既存の`requireAuth`のみ）
2. レビュー作成後、報酬計上判定を実行
   - ユーザーの`plan`が`"FREE"`以外、または`affiliateState`が`"ON"`の場合のみ報酬計上
   - ただし、実際の購入が発生した時点で報酬計上するため、レビュー投稿時点では報酬計上しない（将来の購入時に報酬計上）

**修正が必要な箇所**:
- `lib/revenue-share.ts:26` - `planType`を`plan`に修正
- `lib/revenue-share.ts:34` - `user.planType !== 'free'`を`user.plan !== 'FREE'`に修正、または`affiliateState === 'ON'`も条件に追加

**報酬計上のタイミング**:
- レビュー投稿時: 報酬計上しない（将来の購入時に報酬計上）
- 購入発生時: `createRevenueShare`を呼び出し（実装箇所は別途検討）

### B.4 ReadingProgress/OCRAssetとの紐づけ

**方針**: `reviewId`フィールドを追加（最低限、reviewIdで参照できる形）

**追加フィールド**:
- `ReadingProgress.reviewId` (String?, optional)
- `OCRAsset.reviewId` (String?, optional)

**実装**: レビュー投稿時に、該当する`ReadingProgress`や`OCRAsset`に`reviewId`を設定する（任意）

---

## C. 実装（MVP）

### C.1 ルーティング・ページ

**新規ファイル**:
- `app/r/page.tsx` - レビュー閲覧トップ（未ログイン可）
  - または `app/reviews/public/page.tsx`

**変更ファイル**:
- `app/api/reviews/public/route.ts` - `bookId`を任意に変更

### C.2 Prisma変更

**変更ファイル**:
- `prisma/schema.prisma` - `Review`モデルに構造化フィールド追加
- `prisma/schema.prisma` - `ReadingProgress`モデルに`reviewId`追加（任意）
- `prisma/schema.prisma` - `OCRAsset`モデルに`reviewId`追加（任意）

**マイグレーション**: `npx prisma db push`

### C.3 API変更

**変更ファイル**:
- `app/api/reviews/route.ts` - スキーマ拡張、報酬ゲート判定追加
- `app/api/reviews/public/route.ts` - `bookId`を任意に変更

### C.4 UI変更

**新規ファイル**:
- `components/ReviewForm.tsx` - 構造化レビュー投稿フォーム
- `components/ReviewCard.tsx` - 構造化レビュー表示カード

**変更ファイル**:
- `app/reviews/page.tsx` - レビュー作成フォーム追加
- `app/r/page.tsx`（新規） - 公開レビュー一覧表示

### C.5 報酬ゲート修正

**変更ファイル**:
- `lib/revenue-share.ts:26,34` - `planType`を`plan`に修正、`affiliateState`判定追加

---

## D. ドキュメント更新

**変更ファイル**:
- `docs/CURRENT_APP_STATUS_AUDIT.md` - 矛盾が解消された状態に更新
- `docs/changes/D_review_center_flow_DELTA.md` - 変更点をまとめる

---

## 実装順序（推奨）

1. Prisma変更（Reviewモデル拡張、ReadingProgress/OCRAssetにreviewId追加）
2. API変更（スキーマ拡張、bookId任意化、報酬ゲート修正）
3. UI変更（レビュー作成フォーム、公開レビュー一覧画面）
4. ドキュメント更新
