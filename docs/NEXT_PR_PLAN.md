# Step2: ChangeTag.slug のDB保証強化（実装計画）

## 目的

`ChangeTag.slug` のDBレベルの保証を点検・強化します。現状の制約を確認し、整合性チェック手順と運用ルールを整備します。

## 現状確認（実装前）

### 現在の `ChangeTag` モデル（prisma/schema.prisma）

```prisma
model ChangeTag {
  id          String   @id @default(cuid())
  label       String   @unique // タグ名（例: "感動", "発見", "実践"）
  slug        String?  @unique // ✅ URL用スラッグ（既にユニーク制約あり）
  description String?
  category    String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  changeLogs  ChangeLogTag[]
  
  @@index([isActive, order])
  @@index([slug]) // ✅ slug検索用index（既に存在）
  @@map("change_tags")
}
```

### 既存のDB制約・Index

- ✅ `slug String? @unique` - **既に存在**（重複防止）
- ✅ `@@index([slug])` - **既に存在**（検索性能確保）

### 結論

**追加変更なし（点検＋整合性チェック＋運用ルール明文化）**

現状の `@unique` と `@@index([slug])` で十分です。このPRでは以下を実施：
1. 現状のDB制約を点検・文書化
2. 整合性チェックスクリプトの提供
3. 運用ルールの明文化
4. 将来の拡張方針の整理

## 実施内容

### 1. 既存制約の確認（完了）

- ✅ `slug String? @unique` - 既に存在
- ✅ `@@index([slug])` - 既に存在

### 2. 追加検討事項（検討結果）

#### 2-1. 複合Index `@@index([slug, isActive])`

**検討**: 将来的に `isActive` で絞り込みながら `slug` で検索するクエリが増える場合

**判断**: **現時点では不要**
- 理由:
  - 現在のクエリパターン: `slug` 単独での検索が主
  - `isActive` は `true` がほとんど（無効タグは稀）
  - 複合indexは更新コストが増える

**将来の追加条件**:
- `isActive=false` のタグが増える運用になった場合
- `WHERE slug = ? AND isActive = ?` のクエリが頻繁になった場合

#### 2-2. `slug` の NOT NULL 化

**検討**: 運用上必須にするなら NOT NULL に変更

**判断**: **現時点では nullable のまま維持**
- 理由:
  - 既存データに影響を与えない
  - 将来的に無効タグ（isActive=false）でslug不要なケースがある可能性
  - seedで必ずslugを設定する運用ルールで十分

**将来の変更条件**:
- 運用ルールとして「全タグにslug必須」を確定した場合
- 既存データの整合性を確認してから実施

#### 2-3. `@@index([label])`

**検討**: label検索のfallbackがあるため

**判断**: **不要**
- 理由: `label String @unique` により、Prismaが自動的にindexを生成する

### 3. 既存データ整合性チェック（必須）

**チェックスクリプト**: `prisma/check-changetag-integrity.ts`

**実行方法**:
```bash
npx tsx prisma/check-changetag-integrity.ts
```

**チェック項目**:
1. slug が NULL のレコードがないか
2. slug が空文字のレコードがないか
3. slug の重複がないか
4. isActive=false のレコードのslug状態

**チェック結果（最新実行）**:
```
✅ slug が NULL のレコード: 0件
✅ slug が空文字のレコード: 0件
✅ slug の重複: 0件
✅ 整合性チェック: 問題なし
```

**既存データが壊れていた場合の修復方針**:

1. **slugがNULL/空の場合**:
   ```bash
   # seedスクリプトを再実行してslugを設定
   npx tsx prisma/seed-change-tags.ts
   ```

2. **slugが重複している場合**:
   - 重複しているレコードを特定
   - 手動でslugを修正（またはseedスクリプトを修正して再実行）
   - 整合性チェックを再実行

3. **修復後の確認**:
   ```bash
   npx tsx prisma/check-changetag-integrity.ts
   ```

### 4. マイグレーション

**結論**: **マイグレーションは作成しない**

理由:
- 現状の `@unique` と `@@index([slug])` で十分
- schema変更なし
- 点検結果と運用ルールの文書化のみ

### 5. テスト

- ✅ `npm run typecheck` - エラー0件
- ✅ `npm run lint` - エラー0件
- ✅ `npx tsx prisma/check-changetag-integrity.ts` - 問題なし
- ✅ `/changes/[tag]` が引き続き動作すること

## 変更ファイル

- `prisma/check-changetag-integrity.ts` - 新規作成（整合性チェックスクリプト）
- `docs/CHANGETAG_SLUG_DB_GUARANTEE.md` - 新規作成（DB保証の詳細ドキュメント）
- `docs/PR_DESCRIPTION_STEP2.md` - 新規作成（PR説明）

**注意**: `prisma/schema.prisma` は変更なし（現状の制約を確認・文書化のみ）

## ブランチ作成コマンド

```bash
git checkout main
git pull
git checkout -b chore/changetag-slug-constraints
```

## 注意事項

- SQLiteはNULLを含むuniqueの扱いがDBにより差が出ることがある
- 現状seedで必ずslugを入れているので、運用としてslug未設定を残さない方針で良い
- 既に `@unique` と `@@index([slug])` が存在するため、追加の制約は不要
- このPRの価値は「点検結果と運用ルールの文書化」
