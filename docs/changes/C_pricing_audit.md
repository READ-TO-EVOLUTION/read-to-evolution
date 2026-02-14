# 料金・プラン情報の整合性監査

**作成日**: 2026-02-08  
**目的**: コード実装とREADME/docsの料金・プラン情報の不一致を特定  
**方針**: 事実ベースで比較。修正案は提示せず、不一致一覧までで止める

---

## 1. 勉強コースプラン（冊数制）

### 1.1 実装（`lib/plan-config.ts:5-11`）

| プランID | 冊数上限 | 月額料金 | プラン名 |
|---------|---------|---------|---------|
| `free` | 0冊 | 0円 | 無料プラン |
| `plan_3` | 3冊 | 450円 | 3冊プラン |
| `plan_5` | 5冊 | 700円 | 5冊プラン |
| `plan_10` | 10冊 | 1,400円 | 10冊プラン |
| `plan_20` | 20冊 | 2,600円 | 20冊プラン |

**根拠**: `lib/plan-config.ts:5-11`

### 1.2 README記載（`README.md:149-155`）

| 冊数上限 | 月額 | 想定コスト | 手残り | 利益率 |
|---------|------|-----------|--------|--------|
| 3冊 | 450円 | 約90円 | 約360円 | 約80% |
| 10冊 | 1,000円 | 約300円 | 約700円 | 約70% |
| 20冊 | 1,800円 | 約600円 | 約1,200円 | 約67% |
| 30冊 | 2,500円 | 約900円 | 約1,600円 | 約64% |
| 50冊 | 3,500円 | 約1,500円 | 約2,000円 | 約57% |

**根拠**: `README.md:149-155`

### 1.3 仕様書記載（`docs/SPEC_FINAL_CONSISTENT.md:278-285`）

| 冊数 | 月額（仕様書） | 月額（実装） | 状態 |
|------|---------------|-------------|------|
| 3冊 | 600円 | 450円 | 🟡 不一致 |
| 5冊 | （記載なし） | 700円 | 🟡 実装のみ |
| 10冊 | 1,500円 | 1,400円 | 🟡 不一致 |
| 20冊 | 2,600円 | 2,600円 | ✅ 一致 |
| 30冊 | 3,600円 | （未実装） | 🔴 未実装 |
| 50冊 | 5,000円 | （未実装） | 🔴 未実装 |

**根拠**: `docs/SPEC_FINAL_CONSISTENT.md:278-285`

### 1.4 差分一覧

#### ✅ 一致

- **20冊プラン**: 2,600円（実装・仕様書で一致）
  - 実装: `lib/plan-config.ts:10`
  - 仕様書: `docs/SPEC_FINAL_CONSISTENT.md:283`

#### 🟡 不一致

1. **3冊プラン**
   - 実装: 450円 (`lib/plan-config.ts:7`)
   - README: 450円 (`README.md:151`)
   - 仕様書: 600円 (`docs/SPEC_FINAL_CONSISTENT.md:280`)
   - **状態**: 実装とREADMEは一致、仕様書と不一致

2. **10冊プラン**
   - 実装: 1,400円 (`lib/plan-config.ts:9`)
   - README: 1,000円 (`README.md:152`)
   - 仕様書: 1,500円 (`docs/SPEC_FINAL_CONSISTENT.md:282`)
   - **状態**: 全て不一致

3. **20冊プラン**
   - 実装: 2,600円 (`lib/plan-config.ts:10`)
   - README: 1,800円 (`README.md:153`)
   - 仕様書: 2,600円 (`docs/SPEC_FINAL_CONSISTENT.md:283`)
   - **状態**: 実装と仕様書は一致、READMEと不一致

4. **5冊プラン**
   - 実装: 700円 (`lib/plan-config.ts:8`)
   - README: 記載なし
   - 仕様書: 記載なし
   - **状態**: 実装のみ存在

#### 🔴 未実装（仕様書・READMEに記載あり、実装なし）

1. **30冊プラン**
   - README: 2,500円 (`README.md:154`)
   - 仕様書: 3,600円 (`docs/SPEC_FINAL_CONSISTENT.md:284`)
   - 実装: 存在しない
   - **状態**: READMEと仕様書で料金も不一致

2. **50冊プラン**
   - README: 3,500円 (`README.md:155`)
   - 仕様書: 5,000円 (`docs/SPEC_FINAL_CONSISTENT.md:285`)
   - 実装: 存在しない
   - **状態**: READMEと仕様書で料金も不一致

---

## 2. アフィリエイトプラン

### 2.1 実装

- **月額料金**: 300円
- **根拠**: 
  - `docs/SPEC_FINAL_CONSISTENT.md:72`（プラン一覧）
  - `docs/SPEC_FINAL_CONSISTENT.md:293`（料金再掲）

### 2.2 README記載

- **記載**: なし
- **根拠**: `README.md`全体を検索したが、アフィリエイトプランの料金記載なし

### 2.3 仕様書記載

- **月額料金**: 300円
- **根拠**: `docs/SPEC_FINAL_CONSISTENT.md:72`, `docs/SPEC_FINAL_CONSISTENT.md:293`

### 2.4 差分一覧

#### ✅ 一致

- **アフィリエイトプラン料金**: 300円（実装・仕様書で一致）
  - 実装: `docs/SPEC_FINAL_CONSISTENT.md:72,293`（仕様書が実装の根拠）
  - 仕様書: `docs/SPEC_FINAL_CONSISTENT.md:72,293`

#### 🟡 不一致

- **README記載**: なし
  - **状態**: READMEにアフィリエイトプランの料金記載がない

---

## 3. プラン体系の記載

### 3.1 実装（`prisma/schema.prisma:20`）

- **`plan`フィールドの値**: `'FREE'`, `'AFFILIATE'`, `'STUDY'`
- **根拠**: `prisma/schema.prisma:20`（コメント: `// FREE, AFFILIATE, STUDY`）

### 3.2 README記載

- **記載**: なし
- **根拠**: `README.md`全体を検索したが、プラン体系の記載なし

### 3.3 仕様書記載（`docs/SPEC_FINAL_CONSISTENT.md:69-73`）

| プラン | 月額 | 主目的 |
|--------|------|--------|
| FREE | 0円 | 読書・整理・学習の入口 |
| AFFILIATE | 300円 | 本を紹介し報酬を受け取る |
| STUDY（勉強コース） | 冊数制 | 理解・定着・成長 |

**根拠**: `docs/SPEC_FINAL_CONSISTENT.md:69-73`

### 3.4 差分一覧

#### ✅ 一致

- **プラン体系**: FREE / AFFILIATE / STUDY（実装・仕様書で一致）
  - 実装: `prisma/schema.prisma:20`
  - 仕様書: `docs/SPEC_FINAL_CONSISTENT.md:69-73`

#### 🟡 不一致

- **README記載**: なし
  - **状態**: READMEにプラン体系の記載がない

---

## 4. アフィリエイト状態とプランの関係

### 4.1 実装（`lib/affiliate.ts:18-20,33-35`）

- **STUDY_SUB**: アフィリエイト自動ON（追加料金なし）
- **AFFILIATE_SUB**: アフィリエイトON（300円/月）
- **根拠**: 
  - `lib/affiliate.ts:18-20`（`isStudySubscriber`）
  - `lib/affiliate.ts:33-35`（`requiresAffiliatePaywall`）
  - `app/api/affiliate/opt-in/route.ts:49-72`（STUDY_SUB自動ON）

### 4.2 仕様書記載（`docs/SPEC_FINAL_CONSISTENT.md:77-81`）

| プラン | AffiliateState |
|--------|----------------|
| FREE | OFF |
| AFFILIATE | ON（300円） |
| STUDY | ON（自動・無料扱い） |

**根拠**: `docs/SPEC_FINAL_CONSISTENT.md:77-81`

### 4.3 差分一覧

#### ✅ 一致

- **アフィリエイト状態とプランの関係**: 実装・仕様書で一致
  - 実装: `lib/affiliate.ts:18-20,33-35`, `app/api/affiliate/opt-in/route.ts:49-72`
  - 仕様書: `docs/SPEC_FINAL_CONSISTENT.md:77-81`

---

## 5. Stripe設定

### 5.1 実装

- **`STRIPE_AFFILIATE_PRICE_ID`**: 存在（`lib/stripe.ts:20`）
- **勉強コースプラン用Price ID**: 存在しない
- **根拠**: `lib/stripe.ts:20`（アフィリエイト用のみ）

### 5.2 README記載

- **記載**: なし
- **根拠**: `README.md`全体を検索したが、Stripe設定の記載なし

### 5.3 仕様書記載

- **記載**: 不明（要確認）
- **根拠**: `docs/SPEC_FINAL_CONSISTENT.md`でStripe設定の記載を検索したが、明確な記載なし

### 5.4 差分一覧

#### 🟡 不一致

- **勉強コースプラン用Stripe Price ID**: 実装に存在しない
  - **状態**: アフィリエイト用のみ実装済み、勉強コース用は未実装

---

## 6. 不明な点

### 6.1 User.planとPLAN_CONFIGの対応関係

- **`User.plan`の値**: `'FREE'`, `'AFFILIATE'`, `'STUDY'`（`prisma/schema.prisma:20`）
- **`PLAN_CONFIG`のキー**: `'free'`, `'plan_3'`, `'plan_5'`, `'plan_10'`, `'plan_20'`（`lib/plan-config.ts:5-11`）
- **対応関係**: 不明
  - `User.plan === 'STUDY'`の場合、どの`plan_*`が適用されるか不明
  - コードベースで`User.plan`と`PLAN_CONFIG`の対応を確認する必要がある

### 6.2 Subscriptionモデルの使用状況

- **定義**: `prisma/schema.prisma:522-534`
- **状態**: Legacy relations（後で削除予定）として記載
- **使用箇所**: 不明
  - コードベースで`Subscription`モデルの使用箇所を検索する必要がある

---

## 7. まとめ

### 7.1 一致項目

1. **20冊プラン料金**: 2,600円（実装・仕様書）
2. **アフィリエイトプラン料金**: 300円（実装・仕様書）
3. **プラン体系**: FREE / AFFILIATE / STUDY（実装・仕様書）
4. **アフィリエイト状態とプランの関係**: 実装・仕様書で一致

### 7.2 不一致項目

1. **3冊プラン料金**: 実装・READMEは450円、仕様書は600円
2. **10冊プラン料金**: 実装1,400円、README1,000円、仕様書1,500円（全て不一致）
3. **20冊プラン料金**: 実装・仕様書は2,600円、READMEは1,800円
4. **5冊プラン**: 実装のみ存在（700円）、README・仕様書に記載なし
5. **30冊プラン**: README2,500円、仕様書3,600円、実装なし（料金も不一致）
6. **50冊プラン**: README3,500円、仕様書5,000円、実装なし（料金も不一致）
7. **READMEのアフィリエイトプラン記載**: なし
8. **READMEのプラン体系記載**: なし
9. **勉強コースプラン用Stripe Price ID**: 実装に存在しない

### 7.3 不明項目

1. **User.planとPLAN_CONFIGの対応関係**: 不明
2. **Subscriptionモデルの使用状況**: 不明

---

**最終更新**: 2026-02-08
