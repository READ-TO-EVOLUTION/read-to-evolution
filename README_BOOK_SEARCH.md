# 書籍検索機能の実装ガイド

楽天・Amazonの両方から書籍を検索して登録できる機能です。

## 機能概要

- **楽天書籍検索API**: 楽天ブックスから書籍を検索
- **Amazon PA-API 5.0**: Amazonから書籍を検索
- **検索UI**: debounce付きのリアルタイム検索、キーボード操作対応
- **自動登録**: 検索結果から選択すると、詳細情報（著者、ISBN、表紙画像など）も自動登録

## 環境変数の設定

### 楽天書籍検索API（必須）

1. **楽天ウェブサービスに登録**
   - https://webservice.rakuten.co.jp/ にアクセス
   - アカウント作成後、アプリケーションIDを取得

2. **`.env`に追加**
   ```env
   RAKUTEN_APPLICATION_ID=your_rakuten_app_id
   ```

### Amazon PA-API 5.0（オプション）

1. **Amazonアソシエイトプログラムへの参加**
   - https://affiliate.amazon.co.jp/ にアクセス
   - アソシエイトアカウントを作成
   - **重要**: PA-API利用には過去1ヶ月以内に売上が発生している必要があります

2. **PA-API 5.0の認証情報取得**
   - https://affiliate.amazon.co.jp/assoc_credentials/home にアクセス
   - 以下を取得:
     - Access Key ID
     - Secret Access Key
     - Partner Tag (アソシエイトID)

3. **`.env`に追加**
   ```env
   AMAZON_PAAPI_ACCESS_KEY=your_access_key_id
   AMAZON_PAAPI_SECRET_KEY=your_secret_access_key
   AMAZON_PAAPI_PARTNER_TAG=your_associate_tag
   AMAZON_PAAPI_REGION=us-west-2  # デフォルト値（変更不要）
   ```

## 使用方法

1. `/books`ページを開く
2. 「+ 書籍を登録」ボタンをクリック
3. 「検索モード」を選択
4. 書籍名を入力（2文字以上で自動検索）
5. 候補から選択して登録

## 実装ファイル

- `lib/book-search.ts`: 楽天・Amazon検索の実装
- `app/api/book-search/route.ts`: 検索APIエンドポイント
- `components/BookSearchInput.tsx`: 検索UIコンポーネント
- `app/books/page.tsx`: 書籍登録画面への統合

## 動作確認

### 楽天検索のみの場合
- `RAKUTEN_APPLICATION_ID`のみ設定
- 楽天の結果のみ表示されます

### 両方設定している場合
- 楽天とAmazonの両方から検索
- 結果が統合されて表示されます
- 環境変数が設定されていないプロバイダーは自動的にスキップされます

## トラブルシューティング

### Amazon検索が動作しない場合

1. **認証情報の確認**
   - 環境変数が正しく設定されているか確認
   - Access Key IDとSecret Access Keyが正しいか確認

2. **アソシエイトプログラムの確認**
   - 過去1ヶ月以内に売上が発生しているか確認
   - Partner Tagが正しいか確認

3. **エラーログの確認**
   - サーバーログに`Amazon PA-API error:`が表示されていないか確認
   - エラーメッセージから原因を特定

### 楽天検索が動作しない場合

1. **アプリケーションIDの確認**
   - `RAKUTEN_APPLICATION_ID`が正しく設定されているか確認
   - 楽天ウェブサービスのダッシュボードでAPI利用状況を確認

2. **レート制限**
   - 楽天APIには1秒あたりのリクエスト数制限があります
   - エラーが発生する場合は、しばらく待ってから再試行

## 注意事項

- Amazon PA-APIは署名付きリクエストが必要なため、AWS SDKを使用しています
- 楽天APIは無料で利用できますが、利用規約を遵守してください
- 検索結果は最大20件まで表示されます
- 検索は500msのdebounceが設定されています（入力後0.5秒待ってから検索）
