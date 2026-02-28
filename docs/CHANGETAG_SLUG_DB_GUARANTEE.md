# ChangeTag.slug のDB保証強化

## 目的

`ChangeTag.slug` を「URLの安定キー」として安全に運用するため、**DBレベルの保証**を点検・強化します。

本PRは **機能追加ではなく“事故防止”** が目的です。
（※現状でも `slug` は動作していますが、将来のデータ増加・運用変更で破綻しないように“DB側の保証”を固めます）

## 現状のDB制約

### 現在の `ChangeTag` モデル

```prisma
model ChangeTag {
  id          String   @id @default(cuid())
  label       String   @unique
  slug        String?  @unique // ✅ ユニーク制約あり
  description String?
  category    String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  changeLogs  ChangeLogTag[]
  
  @@index([isActive, order])
  @@index([slug]) // ✅ indexあり
  @@map("change_tags")
}
```

### 既存の制約・Index

- ✅ `slug String? @unique` - ユニーク制約（重複防止）
- ✅ `@@index([slug])` - slug検索用のindex

## 整合性チェック手順（必須）

### チェックスクリプト

```bash
npx tsx prisma/check-changetag-integrity.ts
```

### チェック項目

1. **slug が NULL のレコードがないか**
2. **slug が空文字のレコードがないか**
3. **slug の重複がないか**
4. **isActive=false のレコードのslug状態**

### チェック結果（最新実行）

```
✅ slug が NULL のレコード: 0件
✅ slug が空文字のレコード: 0件
✅ slug の重複: 0件
✅ 整合性チェック: 問題なし
```

### 統計情報

- 有効タグ (isActive=true): 3件
  - slug設定済み: 3件
  - slug未設定: 0件
- 無効タグ (isActive=false): 0件

### 既存データが壊れていた場合の修復方針

#### 1. slugがNULL/空の場合

**原因**: seedスクリプトが実行されていない、またはslug生成ロジックに問題がある

**修復手順**:
```bash
# seedスクリプトを再実行してslugを設定
npx tsx prisma/seed-change-tags.ts

# 整合性チェックを再実行して確認
npx tsx prisma/check-changetag-integrity.ts
```

**seedスクリプトの動作**:
- 既存レコードで `slug` が `null` の場合のみ更新
- 既に `slug` が設定されている場合はスキップ

#### 2. slugが重複している場合

**原因**: 手動でslugを設定した際の重複、またはseedスクリプトのバグ

**修復手順**:

1. **重複を確認**:
   ```bash
   npx tsx prisma/check-changetag-integrity.ts
   # 重複しているslugとレコードIDが表示される
   ```

2. **重複を解消**:
   - 方法A: seedスクリプトを修正して再実行（推奨）
   - 方法B: Prisma Studioで手動修正
   - 方法C: Prisma Clientで直接更新

   ```typescript
   // 例: 重複しているslugを修正
   await prisma.changeTag.update({
     where: { id: '重複レコードのID' },
     data: { slug: '新しいユニークなslug' },
   })
   ```

3. **確認**:
   ```bash
   npx tsx prisma/check-changetag-integrity.ts
   ```

#### 3. 修復後の確認

必ず以下を実行して問題が解消されたことを確認:

```bash
npx tsx prisma/check-changetag-integrity.ts
```

期待結果:
- slug が NULL のレコード: 0件
- slug が空文字のレコード: 0件
- slug の重複: 0件

## 追加検討事項

### 1. 複合Index `@@index([slug, isActive])` の必要性

**現状**: `@@index([slug])` のみ存在

**検討**: 将来的に `isActive` で絞り込みながら `slug` で検索するクエリが増える場合

**判断**: **現時点では不要**
- 理由:
  - 現在のクエリパターン: `slug` 単独での検索が主
  - `isActive` は `true` がほとんど（無効タグは稀）
  - 複合indexは更新コストが増える

**将来の追加条件**:
- `isActive=false` のタグが増える運用になった場合
- `WHERE slug = ? AND isActive = ?` のクエリが頻繁になった場合

### 2. `slug` の NOT NULL 化

**現状**: `slug String?` (nullable)

**検討**: 運用上必須にするなら NOT NULL に変更

**判断**: **現時点では nullable のまま維持**
- 理由:
  - 既存データに影響を与えない
  - 将来的に無効タグ（isActive=false）でslug不要なケースがある可能性
  - seedで必ずslugを設定する運用ルールで十分

**将来の変更条件**:
- 運用ルールとして「全タグにslug必須」を確定した場合
- 既存データの整合性を確認してから実施

### 3. slug正規化ルール

**現状**: seedスクリプトでローマ字変換マップを使用

**運用ルール**:
- 小文字のみ使用
- ハイフンは使用しない（現状）
- 日本語→ローマ字変換はマップベース

**DB側での強制**: 現時点では不要（アプリ側のseedで担保）

## 結論

### 追加変更なし

現状の `@unique` と `@@index([slug])` で十分です。

**理由**:
1. ユニーク制約により重複防止が保証されている
2. indexによりslug検索の性能が確保されている
3. 整合性チェックで問題なし
4. 現時点でのクエリパターンに最適化されている

### このPRの価値

- ✅ 現状のDB制約を点検・文書化
- ✅ 整合性チェックスクリプトを提供
- ✅ 運用ルールを明文化
- ✅ 将来の拡張方針を整理

## 運用ルール

### slug設定ルール

1. **新規タグ作成時**: 必ずslugを設定する
2. **既存タグ更新時**: slugがnullの場合は設定する（seedスクリプトで自動化）
3. **重複チェック**: 新規作成・更新時に重複がないことを確認

### 整合性チェック

マイグレーション前・定期的に以下を実行:

```bash
npx tsx prisma/check-changetag-integrity.ts
```

### ロールバック手順

もし問題が発生した場合:

1. **マイグレーションのロールバック**:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

2. **データの復旧**:
   - seedスクリプトを再実行してslugを設定
   - 整合性チェックを再実行して確認

## 動作確認

### ローカル

1. `npm run typecheck` - エラー0件
2. `npm run lint` - エラー0件
3. `npx tsx prisma/check-changetag-integrity.ts` - 問題なし
4. `npx prisma studio` - `change_tags.slug` の状態を確認
5. `/changes/kandou` 等が従来通り表示される（UI変更なし）

### 整合性チェック（必須）

```bash
npx tsx prisma/check-changetag-integrity.ts
```

期待結果:
- slug が NULL のレコード: 0件
- slug が空文字のレコード: 0件
- slug の重複: 0件

## 変更ファイル

- `prisma/schema.prisma` - 変更なし（現状の制約を確認・文書化）
- `prisma/check-changetag-integrity.ts` - 新規作成（整合性チェックスクリプト）
- `prisma/seed-change-tags.ts` - 変更なし（既存のslug設定ロジックを確認）
- `docs/CHANGETAG_SLUG_DB_GUARANTEE.md` - 新規作成（本ドキュメント）

## セキュリティ・契約制約

- ✅ 本PRは `slug` とタグ整合性のみ
- ✅ freeText / OCR / 本文引用データは **追加しない／出力しない**
- ✅ DBパス事故防止（prisma/dev.db のみ、誤DB混入禁止）の方針を維持

## パフォーマンス

- 現状の `@@index([slug])` により、slug検索の性能が確保されている
- 追加のindexは不要（現時点でのクエリパターンに最適化済み）
