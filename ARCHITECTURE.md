# アーキテクチャ設計書

## システム概要

READ TO EVOLUTIONは、著作権に配慮した学習管理プラットフォームです。
ユーザーが自分で投稿した教材のみを利用し、復習エンジンによる効率的な学習管理を提供します。

## 技術アーキテクチャ

### フロントエンド

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect)
- **フォーム管理**: React Hook Form（将来実装）

### バックエンド

- **API**: Next.js API Routes
- **認証**: JWT (jsonwebtoken)
- **パスワードハッシュ**: bcryptjs
- **バリデーション**: Zod

### データベース

- **ORM**: Prisma
- **開発環境**: SQLite
- **本番環境**: PostgreSQL推奨

## データフロー

### 認証フロー

```
1. ユーザー登録/ログイン
   ↓
2. JWTトークン生成
   ↓
3. クッキーに保存（httpOnly）
   ↓
4. 以降のリクエストで自動認証
```

### 復習フロー

```
1. 学習記録作成（Step1開始）
   ↓
2. Step1-2完了（理解フェーズ）
   ↓
3. Step3開始（想起フェーズ）
   ↓
4. 復習実行
   - 想起確認（3色ボタン）
   - 答え/解説表示
   - 最終判定
   ↓
5. スケジュール更新
   - 成功: 次のStepへ（+4/6/10日）
   - 失敗: Step2へ（翌日）
   ↓
6. Step6連続成功 → MASTERED（卒業）
   ↓
7. 再確認スケジュール（30/90/180日周期）
```

## データモデル

### 主要エンティティ

#### User
- ユーザー基本情報
- プランタイプ（free, plan_3, plan_10, ...）

#### Book
- 書籍（教材）情報
- ユーザー所有

#### StudyRecord
- 復習ユニット
- Step（1-6）、State（active/mastered）
- 位置情報（location_type, location_value, location_note）

#### ReviewSchedule
- 復習スケジュール
- 通常復習（normal）と再確認（refresh）を分離

#### ReviewLog
- 復習実行ログ
- 想起自己評価、最終結果を記録

## API設計

### 認証API

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### 書籍API

- `GET /api/books` - 書籍一覧取得
- `POST /api/books` - 書籍登録（冊数上限チェック）

### 学習記録API

- `POST /api/study-records` - 学習記録作成
- `GET /api/study-records/today` - 今日の復習一覧
- `GET /api/study-records/[id]` - 学習記録詳細取得
- `POST /api/study-records/[id]/review` - 復習実行（Step3-6）
- `POST /api/study-records/[id]/step1-2` - Step1-2進行

### アセットAPI

- `POST /api/assets` - アセット（画像等）登録

### 位置情報API

- `GET /api/location/default` - デフォルト位置情報取得

## セキュリティ

### 認証・認可

- JWTトークンベースの認証
- クッキーは httpOnly で保存（XSS対策）
- すべてのAPIで認証チェック

### データ分離

- ユーザーは自分のデータのみアクセス可能
- 他ユーザーの投稿は一切閲覧不可
- 書籍・学習記録はユーザーIDでフィルタリング

### 著作権配慮

- 運営は教材を配信しない
- ユーザー投稿のみを利用
- 他ユーザー共有機能なし

## パフォーマンス

### データベース

- インデックス: User.email, StudyRecord.userId, ReviewSchedule.nextReviewAt
- クエリ最適化: 必要なリレーションのみ include

### 画像処理

- 現在: URL入力（外部ホスティング）
- 将来: アップロード → 圧縮・サムネ生成

## スケーラビリティ

### 現在の制限

- SQLite（開発環境）
- ファイルアップロード未実装

### 将来の改善

- PostgreSQL移行
- 画像ストレージ（S3等）
- CDN導入
- キャッシュ戦略

## エラーハンドリング

### APIエラー

- 適切なHTTPステータスコード
- エラーメッセージは日本語で返却
- ログ出力（本番環境では構造化ログ推奨）

### フロントエンドエラー

- try-catch でエラーハンドリング
- ユーザーフレンドリーなエラーメッセージ表示

## テスト戦略（将来実装）

### ユニットテスト

- 復習エンジンロジック
- プラン設定ロジック

### 統合テスト

- APIエンドポイント
- 認証フロー

### E2Eテスト

- 復習フロー全体
- 書籍登録 → 学習記録作成 → 復習実行

## デプロイメント

### 開発環境

- ローカル開発サーバー（npm run dev）
- SQLiteデータベース

### 本番環境

- Vercel推奨（Next.js最適化）
- PostgreSQLデータベース
- 環境変数管理

## 今後の拡張

1. **ファイルアップロード機能**
   - 画像アップロード
   - PDF/ZIP対応
   - OCR統合（クライアント側）

2. **読書レビュー機能**
   - レビュー投稿
   - 感情タグ
   - 棒人間UI

3. **通知機能**
   - 復習リマインダー
   - プッシュ通知

4. **プラン管理**
   - 決済統合
   - サブスクリプション管理

5. **分析機能**
   - 学習進捗ダッシュボード
   - 復習効率分析
