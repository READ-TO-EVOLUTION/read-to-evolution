# 実装状況と仕様書の差分分析

**作成日**: 2026-01-xx  
**対象仕様書**: `docs/INTEGRATED_SPEC.md`

---

## 1. 価格プランの不一致（重大）

### 仕様書の要求

| プラン | 価格 |
|--------|------|
| 3冊 | 450円 |
| 5冊 | 700円 |
| 10冊 | 1,400円 |
| 20冊 | 2,600円 |

### 現在の実装（`lib/plan-config.ts`）

```typescript
export const PLAN_CONFIG = {
  free: { maxMaterials: 0, name: '無料プラン' },
  plan_3: { maxMaterials: 3, name: '3冊プラン', price: 450 },
  plan_10: { maxMaterials: 10, name: '10冊プラン', price: 1000 },  // ❌ 1,400円であるべき
  plan_20: { maxMaterials: 20, name: '20冊プラン', price: 1800 },  // ❌ 2,600円であるべき
  plan_30: { maxMaterials: 30, name: '30冊プラン', price: 2500 },  // ❌ 仕様書には存在しない
  plan_50: { maxMaterials: 50, name: '50冊プラン', price: 3500 }, // ❌ 仕様書には存在しない
}
```

### 問題点

1. **5冊プランが未実装**
2. **10冊プランの価格が不一致**（1,000円 vs 1,400円）
3. **20冊プランの価格が不一致**（1,800円 vs 2,600円）
4. **30冊・50冊プランが仕様書に存在しない**

### 修正が必要なファイル

- `lib/plan-config.ts`
- Stripe Price ID設定（環境変数）

---

## 2. データ量制御（1冊あたり1,500枚上限）未実装（重大）

### 仕様書の要求

- **通常ライン**: 1,200枚/冊（警告なし）
- **拡張ライン**: 1,500枚/冊（絶対上限）
- **種別別上限**:
  - 問題画像: 300枚（通常）/ 500枚（最大）
  - 解説画像: 400枚（通常）/ 500枚（最大）
  - 基本書画像: 500枚（通常・最大）

### 現在の実装状況

❌ **未実装**

- `app/api/books/route.ts` には冊数制限のみ
- 画像枚数制限のバリデーションが見当たらない
- OCRアセット登録時の枚数チェックなし

### 必要な実装

1. **APIバリデーション関数**（`lib/study-volume-limit.ts` 新規作成）
   ```typescript
   export async function validateVolumeImageLimit(
     userId: string,
     bookId: string,
     imageType: 'PROBLEM' | 'EXPLANATION' | 'REFERENCE',
     currentCount: number
   ): Promise<{ allowed: boolean; reason?: string }>
   ```

2. **OCRアセット登録API**（`app/api/ocr-texts/route.ts`）に制限チェック追加

3. **フロントエンド進捗バー**（データ量表示）

---

## 3. OCRアセットの種別管理が不明確

### 仕様書の要求

- 問題画像（OCRテキスト含む）
- 解説画像（OCRテキスト含む）
- 基本書画像（OCRテキスト含む）

### 現在の実装（`prisma/schema.prisma`）

```prisma
model OCRAsset {
  id            String @id @default(cuid())
  userId        String @map("user_id")
  bookId        String @map("book_id")
  imageUrl      String @map("image_url")
  extractedText String @map("extracted_text")
  pageNo        Int? @map("page_no")
  tags          String? // JSON文字列: 端末側OCRのメタ情報など
  // ...
}
```

### 問題点

- **種別（問題/解説/基本書）を区別するフィールドがない**
- `tags` フィールドにJSONで保存している可能性はあるが、明確なスキーマがない

### 必要な修正

1. **スキーマ追加**（推奨）:
   ```prisma
   type String // PROBLEM, EXPLANATION, REFERENCE
   ```

2. または **既存のtagsフィールドを活用**して種別を保存

---

## 4. 復習フローの二段階解説選択が未実装

### 仕様書の要求

#### Stage 1：登録済み解説から選択
- そのユーザーが過去に登録した解説のみ表示
- 複数選択肢から「最も正しいと思う解説」を選ぶ

#### Stage 2：キーワードによる再探索
- 任意のワードを入力
- OCRテキスト内に該当ワードを含む解説のみ選択可能

### 現在の実装状況

❌ **未実装**

- `StudyItem` モデルには `explanationText` フィールドはあるが、解説選択UIが見当たらない
- 復習フロー（`app/api/study-records/[id]/review/route.ts` など）を確認する必要あり

### 必要な実装

1. **解説一覧取得API**（登録済み解説のみ）
2. **キーワード検索API**（OCRテキスト検索）
3. **復習UI**（二段階選択フロー）

---

## 5. 冊数制限の実装状況（部分実装）

### 仕様書の要求

- 冊数制限は勉強コースのみ
- 非勉強コース（感想・ギフト等）は無制限

### 現在の実装（`app/api/books/route.ts`）

```typescript
// 冊数上限チェック
const currentMaterialCount = user.books.reduce(
  (sum, book) => sum + book.materials.length,
  0
)

if (!canAddMaterial(user.plan, currentMaterialCount)) {
  return NextResponse.json(
    {
      error: `冊数上限に達しています。現在のプランでは最大${getMaxMaterials(user.plan)}冊まで登録できます。`,
    },
    { status: 403 }
  )
}
```

### 問題点

- **`materials` というLegacyモデルを参照している**
- 仕様書の「冊」の定義（問題群・解説群・基本書ページ群を含む論理単位）と一致しているか不明
- 非勉強コースとの切り分けが不明確

### 必要な確認

1. 「冊」の定義を `Book` モデルで管理しているか、別の `Volume` モデルが必要か
2. 非勉強コースの書籍登録時に冊数制限がかかっていないか確認

---

## 6. 勉強コースと非勉強コースの関係性（実装状況不明）

### 仕様書の要求

✅ **勉強コースに登録しても非勉強コースはすべて引き続き利用可能**

### 確認が必要な点

1. `User.plan` が `STUDY` の場合、非勉強コース機能（ギフト・レビュー等）が制限されていないか
2. プラン判定ロジック（`lib/plan-config.ts`）で非勉強コースが正しく動作するか

---

## 7. 実装優先度（仕様書より）

### 必須（MVP）

- ✅ 冊数制限（部分実装済み、要確認）
- ❌ 1冊1500枚上限（**未実装**）
- ❌ APIバリデーション（**未実装**）

### 次点

- ❌ データ量進捗バー（**未実装**）
- ❌ 注意文言（**未実装**）
- ❌ 復習2段階UI（**未実装**）

---

## 8. 修正が必要なファイル一覧

### 即座に修正

1. **`lib/plan-config.ts`**
   - 5冊プラン追加
   - 価格修正（10冊: 1,400円, 20冊: 2,600円）
   - 30冊・50冊プラン削除

2. **`lib/study-volume-limit.ts`**（新規作成）
   - 画像枚数制限バリデーション関数

3. **`app/api/ocr-texts/route.ts`**
   - 画像枚数制限チェック追加

### 次フェーズ

4. **`prisma/schema.prisma`**
   - `OCRAsset` に `type` フィールド追加（または `tags` のスキーマ明確化）

5. **復習フローAPI**（新規作成または既存修正）
   - 解説選択API
   - キーワード検索API

6. **フロントエンド**
   - データ量進捗バー
   - 復習2段階UI

---

## 9. 次のアクション

1. ✅ 統合仕様書を保存済み（`docs/INTEGRATED_SPEC.md`）
2. ⏳ 価格プラン修正（`lib/plan-config.ts`）
3. ⏳ データ量制御実装（新規）
4. ⏳ OCRアセット種別管理の明確化
5. ⏳ 復習フロー実装
