# DB差分定義 v3 → v4（2026-01-26以降仕様反映）

## 更新完了内容

### 1. Userモデルの拡張

#### 追加フィールド
- `affiliateState` (String, default: "OFF") - OFF/ON/SUSPENDED
- `affiliatePlanType` (String, default: "NONE") - NONE/AFFILIATE_SUB/STUDY_SUB
- `affiliateEnabledAt` (DateTime?) - ONになった日時
- `affiliateSuspendedAt` (DateTime?) - SUSPENDEDになった日時
- `affiliateSuspendedReason` (String?) - 停止理由

#### インデックス追加
- `affiliateState`
- `affiliatePlanType`

### 2. AffiliateStateLogモデル（新規）

#### フィールド
- `id` (PK)
- `userId` (FK -> User)
- `fromState` (String) - OFF/ON/SUSPENDED
- `toState` (String) - OFF/ON/SUSPENDED
- `reason` (String) - USER_OPT_IN/PAYMENT_FAILED/ADMIN_SUSPEND/USER_CANCEL/STUDY_SUBSCRIBED
- `actorType` (String) - USER/SYSTEM/ADMIN
- `createdAt` (DateTime)

#### インデックス
- `(userId, createdAt desc)`
- `(toState, createdAt desc)`

### 3. Koyoriモデル（更新）

#### フィールド変更
- `memo` (String?) - 短文まとめメモ（summaryMemoから名称変更）
- `visibility` (String, default: "PRIVATE") - 将来拡張用

#### インデックス
- `(userId, updatedAt desc)`

### 4. KoyoriItemモデル（更新）

#### ポリモーフィック設計
- `type` (String) - READING_LOG/OCR_TEXT/NOTE
- `sourceId` (String) - 対象テーブルのID（ポリモーフィック）
- `note` (String?) - そのアイテムに対するメモ

#### リレーション（整合性保持用）
- `readingLogId` (String?) - type=READING_LOGの場合
- `ocrAssetId` (String?) - type=OCR_TEXTの場合

#### 制約
- `@@unique([koyoriId, type, sourceId])` - 同じ要素の二重追加防止

### 5. StudyItemモデル（更新）

#### 追加フィールド
- `pointText` (String?) - 論点を書かせた内容
- `pointMarked` (Boolean, default: false) - 論点をマークしたか
- `pointMarkedAt` (DateTime?) - マーク日時
- `graduatedAt` (DateTime?) - 卒業日時

#### インデックス追加
- `isGraduated`

### 6. StudyAttemptモデル（更新）

#### 追加フィールド
- `pointText` (String?) - この復習で書かせた論点
- `pointMarked` (Boolean, default: false)
- `confusionToUnderstanding` (Int?) - 混乱→理解回数

## 運用ルール（DB側で期待する整合）

### FREEユーザー
- `affiliateState` = OFF
- `affiliatePlanType` = NONE

### AFFILIATE課金中
- `affiliateState` = ON
- `affiliatePlanType` = AFFILIATE_SUB

### STUDY課金中
- `affiliateState` = ON
- `affiliatePlanType` = STUDY_SUB
- **重要**: STUDY加入者は「常時ON」をDBで表現

### 支払い失敗・不正疑い
- `affiliateState` = SUSPENDED
- `affiliatePlanType` = 維持（AFFILIATE_SUB or STUDY_SUB）

## API/画面側がDBに依存する"確定ルール"

1. **`affiliateState != ON`**
   - GiftEvent計測・成果ダッシュボード・報酬履歴は **禁止**

2. **`affiliatePlanType == STUDY_SUB`**
   - Affiliateを **常時ON**（課金モーダルを出さない）

3. **`affiliatePlanType == AFFILIATE_SUB`**
   - ONにするために **月300円課金が必要**

## データ移行（既存ユーザー）

既存Userに `affiliateState` を追加したら `default OFF` が入る。

既に「勉強コース加入状態」が判別できる場合、移行スクリプトで：
- `affiliatePlanType` = STUDY_SUB
- `affiliateState` = ON
- `affiliateEnabledAt` = now()（または加入日）

---

最終更新: 2026-01-26
