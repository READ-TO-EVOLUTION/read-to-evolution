# OCRアセット種別管理仕様

## 概要

勉強コースでは、OCRアセットを以下の3種別に分類して管理します：

- **PROBLEM**: 問題画像
- **EXPLANATION**: 解説画像
- **REFERENCE**: 基本書画像

## 実装方式

### スキーマ

`OCRAsset` モデルの `tags` フィールド（JSON文字列）を使用：

```json
{
  "type": "PROBLEM" | "EXPLANATION" | "REFERENCE"
}
```

### 理由

- 既存スキーマを変更せずに実装可能
- 将来的に他のメタ情報も追加可能
- 後方互換性を保てる（tags未設定の場合はREFERENCEとして扱う）

## 使用方法

### OCRアセット作成時

```typescript
// app/api/ocr-assets/route.ts
const tags = JSON.stringify({
  type: 'PROBLEM' // または 'EXPLANATION', 'REFERENCE'
})
```

### 種別判定

```typescript
// lib/study-volume-limit.ts
const tags = JSON.parse(asset.tags) as { type?: string }
const type = tags.type as ImageType | undefined
```

### デフォルト値

- `tags` が未設定の場合 → `REFERENCE` として扱う
- JSON解析失敗時 → `REFERENCE` として扱う

## データ量制御との連携

`lib/study-volume-limit.ts` の `getVolumeImageCounts()` 関数が、`tags` フィールドから種別を判定して枚数を集計します。
