# READ TO EVOLUTION

**本から育つ一輪の花** - 読書レビュー × 学習管理OS

> **注意**: このプロジェクトは `yoridori` とは別のプロジェクトです。  
> **仕様書**: [SPECIFICATION.md](./SPECIFICATION.md) が実装の最上位基準です。

## 概要

READ TO EVOLUTIONは、著作権に配慮した学習管理プラットフォームです。
- 運営は教材を配信しません
- ユーザーが自分で投稿した教材のみを利用します
- 他ユーザーの投稿内容は一切共有・閲覧しません
- 復習エンジンによる効率的な学習管理を提供します

## 主な機能

### MVP実装済み機能

1. **認証システム**
   - メールアドレス + パスワードでの登録/ログイン
   - JWT トークンベースの認証

2. **勉強コース（復習エンジン）**
   - 書籍（教材）の登録（冊数上限管理）
   - 学習記録の作成（問題/答え/解説画像、位置情報）
   - 今日の復習一覧（通常復習/再確認）
   - 出題画面（Step3-6：3色想起確認 → 答え/解説表示 → 最終判定）
   - 復習スケジュール自動管理
   - 卒業（MASTERED）機能

3. **復習エンジンの仕様**
   - Step1-2: 理解フェーズ
   - Step3-6: 想起フェーズ
     - Step3成功 → Step4（+4日）
     - Step4成功 → Step5（+6日）
     - Step5成功 → Step6（+10日）
     - Step6成功 → Step6継続（+10日）
     - 失敗 → Step2（翌日）
   - Step6連続成功 → MASTERED（卒業）
   - 卒業後再確認：30日 → 90日 → 180日 → 以後180日周期

### 実装済み機能（MVP後半）

4. **読書レビュー機能**
   - レビュー投稿（五段階評価/感想文/検索ワード/お気に入りワード）
   - 感情タグ選択（必須）
   - 棒人間UI（感情タグに応じてアニメーション）
   - レビュー一覧表示
   - レビュー編集・削除

### 今後実装予定

- 無料ユーザー：読書進捗入力 → 空背景変化
- ファイルアップロード機能（現在はURL入力）
- 通知機能
- プラン管理・決済機能

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite (開発) / PostgreSQL (本番推奨)
- **ORM**: Prisma
- **認証**: JWT (jsonwebtoken) + bcryptjs

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の内容を設定：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. データベースの初期化

```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── auth/           # 認証API
│   │   ├── books/          # 書籍API
│   │   ├── study-records/  # 学習記録API
│   │   ├── assets/        # アセットAPI
│   │   └── reviews/       # レビューAPI
│   ├── login/              # ログイン画面
│   ├── register/           # 登録画面
│   ├── books/              # 書籍管理画面
│   ├── reviews/            # レビュー一覧画面
│   └── study/              # 復習画面
│       ├── today/          # 今日の復習一覧
│       └── review/         # 出題画面
├── lib/                    # ユーティリティ
│   ├── prisma.ts          # Prisma クライアント
│   ├── auth.ts            # 認証関数
│   ├── review-engine.ts   # 復習エンジンロジック
│   ├── plan-config.ts     # プラン設定
│   ├── emotion-tags.ts    # 感情タグ定義
│   └── middleware.ts      # 認証ミドルウェア
├── components/             # 共通コンポーネント
│   └── StickFigure.tsx    # 棒人間UIコンポーネント
├── prisma/
│   └── schema.prisma      # データベーススキーマ
└── package.json
```

## データベーススキーマ

主要なエンティティ：

- **User**: ユーザー情報
- **Book**: 書籍（教材）
- **Material**: 教材単位
- **Asset**: ユーザー投稿物（画像/PDF等）
- **StudyRecord**: 復習ユニット
- **ReviewSchedule**: 復習スケジュール
- **ReviewLog**: 復習ログ
- **Review**: 読書レビュー
- **ReadingProgress**: 読書進捗

詳細は `prisma/schema.prisma` を参照してください。

## 料金プラン

| 冊数上限 | 月額 | 想定コスト | 手残り | 利益率 |
|---|---:|---:|---:|---:|
| 3冊 | 450円 | 約90円 | 約360円 | 約80% |
| 10冊 | 1,000円 | 約300円 | 約700円 | 約70% |
| 20冊 | 1,800円 | 約600円 | 約1,200円 | 約67% |
| 30冊 | 2,500円 | 約900円 | 約1,600円 | 約64% |
| 50冊 | 3,500円 | 約1,500円 | 約2,000円 | 約57% |

## 著作権配慮

本サービスは以下の方針を厳守します：

- ✅ **OK**: ユーザーが自分で投稿した問題画像、解説画像、根拠メモ
- ❌ **NG**: 運営による問題文・解説の配信、他ユーザー投稿の共有・閲覧

すべての教材内容は、投稿者本人のみが閲覧・利用できます。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Prisma Studio（DB管理UI）
npm run db:studio

# データベーススキーマ適用
npm run db:push
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
