# 仕様書と監査レポートの矛盾一覧表

**作成日**: 2026-01-xx  
**目的**: SPECIFICATION.md と監査レポート（DATA_AUDIT_DB_LINEAGE_AND_USAGE.md / IMPLEMENTED_FEATURES_AUDIT.md）の不整合を特定

---

## 矛盾一覧表

| 仕様書の記載（引用20語以内） | 監査レポート/実装済み監査の記載（根拠） | 判定 | 修正方針 | 修正文案（仕様書に入れる文章・短文） |
|---------------------------|----------------------------------|------|---------|----------------------------------|
| （記載なし） | User.name: B（未実装：UI/導線不足）。参照: `app/api/books/[bookId]/review-summary/route.ts:60,73`。未設定: `app/api/auth/register/route.ts:32-43` | 矛盾 | 仕様書を直す | ✅ 実装済み: レビューサマリーで`user.name`を参照（未設定時はemailから生成）。🟡 未実装: ユーザー登録時に`name`を設定するUI導線がない |
| （記載なし） | Review.recommendedBooks: B（未実装：UI/導線不足）。API定義: `app/api/reviews/route.ts:13`。UI未送信: `app/books/[id]/review/page.tsx:106-115` | 矛盾 | 仕様書を直す | 🟡 未実装: `recommendedBooks`フィールドはDB/APIに存在するが、UIで入力・送信する導線がない |
| （記載なし） | レビュー検索機能: 未発見。`app/api/reviews/route.ts:21-55`で`bookId`フィルタのみ | 未確定 | 仕様書を直す | 🔴 未発見: レビュー検索機能（キーワード・タイトル検索）は実装されていない |
| （記載なし） | 他人のレビュー閲覧機能: 自分のレビュー一覧のみ実装。`app/api/reviews/route.ts:29`で`where: { userId }`のみ | 未確定 | 仕様書を直す | ✅ 実装済み: レビューサマリー取得（`GET /api/books/[bookId]/review-summary`）。🔴 未発見: 他人のレビュー一覧表示画面 |
| （記載なし） | 本の削除機能: `app/api/books/route.ts`に`DELETE`メソッドがない | 未確定 | 仕様書を直す | 🔴 未発見: 本の削除APIは実装されていない |
| （記載なし） | 本の編集機能: `app/api/books/route.ts`に`PUT`メソッドがない | 未確定 | 仕様書を直す | 🔴 未発見: 本の編集APIは実装されていない |
| （記載なし） | マイページ機能: `app/page.tsx`はホーム画面であり、マイページではない | 未確定 | 仕様書を直す | 🔴 未発見: マイページ専用画面は実装されていない |
| （記載なし） | PublicInsight / Query / /q/[slug]: コード上で存在が確認できない | 未確定 | 仕様書を直す | 🔴 未発見: PublicInsight / Query / /q/[slug] は実装されていない（将来計画に移動） |
| 「生ログ（Private Log）は絶対に公開されない」 | ReadingLogの`visibility`フィールド: `PRIVATE/PARTIAL/PUBLIC`。Snapshot公開機能は実装済み（`app/api/snapshots/route.ts`） | 表現のズレ | 仕様書を直す | ✅ 実装済み: ReadingLogは`visibility`で公開範囲を制御。Snapshot公開機能あり（`app/api/snapshots/route.ts`）。Private Logは`visibility: PRIVATE`で非公開 |
| 「報酬を受け取らないユーザー: 月コスト10〜20円以下」 | アフィリエイトOFFユーザーは実装済み。`lib/affiliate.ts:11-13`で判定 | OK | 仕様書を直す | ✅ 実装済み: `affiliateState: OFF`で報酬を受け取らないユーザーを管理（`lib/affiliate.ts:11-13`） |
| 「勉強コース加入者は追加料金なしでアフィリエイト常時ON」 | `lib/affiliate.ts:18-20`で`affiliatePlanType === 'STUDY_SUB'`判定。`app/api/stripe/webhook/route.ts`で自動設定 | OK | 仕様書を直す | ✅ 実装済み: `affiliatePlanType === 'STUDY_SUB'`で自動的にアフィリエイトON（`lib/affiliate.ts:18-20`） |
| 「こより機能: 完全 private、公開・販売・共有不可」 | `Koyori`モデルに公開フィールドなし。`app/api/koyori/route.ts`で所有確認のみ | OK | 仕様書を直す | ✅ 実装済み: こよりは完全private（`app/api/koyori/route.ts`で所有確認のみ） |
| 「Snapshot公開機能」 | `app/api/snapshots/route.ts`で実装済み。`app/api/snapshots/[id]/route.ts`で公開取得 | OK | 仕様書を直す | ✅ 実装済み: Snapshot公開機能（`app/api/snapshots/route.ts`, `app/api/snapshots/[id]/route.ts`） |
| 「ギフト公開ページ閲覧（認証不要）」 | `app/gifts/[slug]/page.tsx`で実装済み。`app/api/gifts/[id]/route.ts`で公開取得 | OK | 仕様書を直す | ✅ 実装済み: ギフト公開ページ（`app/gifts/[slug]/page.tsx`, `app/api/gifts/[id]/route.ts`） |
| 「積読カードにレビューサマリー表示」 | `app/books/page.tsx:221-289`で`ReviewSummaryCard`使用。`app/api/books/[bookId]/review-summary/route.ts`で取得 | OK | 仕様書を直す | ✅ 実装済み: 積読カードにレビューサマリー表示（`app/books/page.tsx:221-289`, `app/api/books/[bookId]/review-summary/route.ts`） |
| 「勉強コース（冊数制）」 | `lib/plan-config.ts:15-23`で冊数上限管理。`app/api/books/route.ts:91-97`でチェック | OK | 仕様書を直す | ✅ 実装済み: 勉強コース冊数制限（`lib/plan-config.ts:15-23`, `app/api/books/route.ts:91-97`） |
| 「料金: 3冊600円、10冊1,500円、20冊2,600円、30冊3,600円、50冊5,000円」 | `lib/plan-config.ts`で料金設定。実装確認が必要 | 未確定 | 監査を修正する | `lib/plan-config.ts`の料金設定を確認し、仕様書と一致させる |

---

## 判定の説明

- **矛盾**: 仕様書と実装が明確に不一致
- **未確定**: 仕様書に記載がないが、実装状況が不明確
- **表現のズレ**: 仕様書の表現が実装と微妙に異なる
- **OK**: 仕様書と実装が一致

---

## 修正優先度

### 高優先度（矛盾・未確定）
1. User.name / Review.recommendedBooks の未実装明記
2. レビュー検索 / 他人レビュー閲覧 / 本の編集削除 / マイページ の未実装明記
3. PublicInsight / Query / /q/[slug] の未実装明記（将来計画へ移動）

### 中優先度（表現のズレ）
4. 生ログ（Private Log）の公開禁止表現の明確化
5. 料金設定の実装確認

### 低優先度（OK）
6. 実装済み機能の根拠追加

---

最終更新: 2026-01-xx
