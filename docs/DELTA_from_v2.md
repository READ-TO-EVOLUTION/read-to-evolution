# DELTA from SNAPSHOT_v2（レビュー中心導線／報酬ゲート／構造化フォーム）

**更新日**: 2026-02-11  
**目的**: `docs/CURRENT_APP_STATUS_AUDIT.md`（2026-02-08）を前提に、今週議論した「レビュー中心の導線／報酬ゲート／構造化フォーム」と矛盾しない状態へ更新する。  
**推測禁止**: 根拠はすべて `ファイルパス:行` で提示する。  

---

## 変更サマリ（結論）

- **未ログインでも他人レビュー起点の入口**: `/`（未ログイン）に `/r` へのCTAを設置済み
  - 根拠: `app/page.tsx:102-136`（未ログイン時UI、`href="/r"`）
- **未ログイン閲覧可能な公開レビュー一覧**: `/r` と `GET /api/reviews/public` で公開レビューをフィード表示
  - 根拠: `app/r/page.tsx:47-66`（`/api/reviews/public` をfetch）
  - 根拠: `app/api/reviews/public/route.ts:4-9,30-37`（未ログイン可、`where: { isPublic: true }`）
- **構造化フォーム（定型テンプレ付き）**: `goodPoints`を必須化し、テンプレ（選択式）を追加。`readingProgressId` / `ocrAssetId` を任意でpayloadに含め、レビューと紐づけ可能にした
  - 根拠: `components/ReviewForm.tsx:86-110`（payload）
  - 根拠: `components/ReviewForm.tsx:214-238`（`goodPoints`必須UI）
  - 根拠: `app/api/reviews/route.ts:7-30`（`goodPoints`必須）
  - 根拠: `app/api/reviews/route.ts:203-219`（`readingProgressId`/`ocrAssetId` で `reviewId` を更新）
- **報酬ゲート（投稿は全員OK、報酬計上は有料 or affiliate ONのみ）**: 判定ロジックを `lib/revenue-share.ts` に集約し、判定ログをDBに残すようにした
  - 根拠: `lib/revenue-share.ts:21-38`（`plan !== 'FREE' || affiliateState === 'ON'`）
  - 根拠: `prisma/schema.prisma:765-788`（`RevenueShareGateLog`）
  - 根拠: `app/api/reviews/route.ts:154-170,221-238`（公開レビュー投稿時にログ記録）
- **レビュー削除APIの欠落を解消**: `DELETE /api/reviews/[id]` を実装
  - 根拠: `app/api/reviews/[id]/route.ts:1-46`

---

## 実装差分（ファイル単位）

### 追加（新規ファイル）

- `app/api/reviews/[id]/route.ts`
  - 目的: `DELETE /api/reviews/[id]` を提供（レビュー削除）
  - 根拠: `app/api/reviews/[id]/route.ts:1-46`

### 変更（既存ファイル）

- `components/ReviewForm.tsx`
  - 変更: 構造化ブロックを主入力にし、テンプレ（選択式）を追加
  - 変更: `goodPoints`必須 + `readingProgressId`/`ocrAssetId` を任意でpayloadに含める
  - 根拠: `components/ReviewForm.tsx:86-110,188-367,214-238`

- `app/api/reviews/route.ts`
  - 変更: `goodPoints`必須化（Zod）
  - 変更: 公開レビュー投稿時に報酬ゲート判定ログをDBへ記録
  - 根拠: `app/api/reviews/route.ts:7-30,154-170,221-238`

- `lib/revenue-share.ts`
  - 変更: 報酬対象判定（有料 or affiliate ON）を `evaluateRevenueEligibility` に集約
  - 変更: `RevenueShareGateLog` へ判定ログを保存
  - 根拠: `lib/revenue-share.ts:21-58,69-122`

- `prisma/schema.prisma`
  - 変更: `RevenueShareGateLog` モデル追加（監査用）
  - 根拠: `prisma/schema.prisma:765-788`

- `app/api/revenue-shares/route.ts`
  - 変更: `planType`参照の不整合を解消し、報酬対象（有料 or affiliate ON）のみ閲覧可能に修正
  - 根拠: `app/api/revenue-shares/route.ts:14-33`

- `app/api/reading-progress/route.ts`
  - 変更: 所有確認を `Book.userId` から `UserBook` に変更（共有マスタのため）
  - 根拠: `app/api/reading-progress/route.ts:28-35,63-71`
  - 参考: `app/api/books/route.ts:85-96`（`Book.userId: null`）

- `app/api/ocr-assets/route.ts`
  - 変更: 所有確認を `Book.userId` から `UserBook` に変更（共有マスタのため）
  - 根拠: `app/api/ocr-assets/route.ts:32-39,93-100`
  - 参考: `app/api/books/route.ts:85-96`（`Book.userId: null`）

- `docs/CURRENT_APP_STATUS_AUDIT.md`
  - 変更: 矛盾解消の追記（更新日、構造化フォーム必須/任意、報酬ゲートのログ根拠、RevenueShare API根拠の更新）
  - 根拠: `docs/CURRENT_APP_STATUS_AUDIT.md:1-（全行）`

