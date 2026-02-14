/**
 * 書籍検索ライブラリ
 * 楽天・Amazon両方に対応
 */

import { SignatureV4 } from '@aws-sdk/signature-v4'
import { HttpRequest } from '@aws-sdk/protocol-http'

export type BookSearchResult = {
  title: string
  author?: string
  isbn13?: string
  coverImageUrl?: string
  publisher?: string
  publishedDate?: string
  provider: 'RAKUTEN' | 'AMAZON'
  externalId: string // 楽天: itemCode, Amazon: ASIN
  purchaseUrl: string
}

/**
 * 楽天書籍検索API
 */
export async function searchRakutenBooks(query: string): Promise<BookSearchResult[]> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID
  if (!applicationId) {
    throw new Error('RAKUTEN_APPLICATION_ID is not set')
  }

  const url = new URL('https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404')
  url.searchParams.set('applicationId', applicationId)
  url.searchParams.set('format', 'json')
  url.searchParams.set('title', query)
  url.searchParams.set('hits', '20')
  url.searchParams.set('sort', 'sales')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Rakuten API error: ${response.status}`)
  }

  const data = await response.json()
  const items = data.Items || []

  return items.map((item: any) => {
    const book = item.Item
    return {
      title: book.title,
      author: book.author,
      isbn13: book.isbn,
      coverImageUrl: book.largeImageUrl || book.mediumImageUrl || book.smallImageUrl,
      publisher: book.publisherName,
      publishedDate: book.salesDate,
      provider: 'RAKUTEN' as const,
      externalId: book.itemCode,
      purchaseUrl: book.itemUrl,
    }
  })
}

/**
 * Amazon Product Advertising API (PA-API 5.0)
 * 
 * 注意: Amazon PA-APIは署名付きリクエストが必要です。
 * 
 * 必要な設定:
 * 1. Amazonアソシエイトプログラムへの参加
 * 2. PA-API 5.0のAPIキー取得（AWS IAM経由）
 * 
 * 環境変数:
 * - AMAZON_PAAPI_ACCESS_KEY (Access Key ID)
 * - AMAZON_PAAPI_SECRET_KEY (Secret Access Key)
 * - AMAZON_PAAPI_PARTNER_TAG (アソシエイトタグ)
 * - AMAZON_PAAPI_REGION (デフォルト: us-east-1)
 */
export async function searchAmazonBooks(query: string): Promise<BookSearchResult[]> {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG
  // Amazon PA-API 5.0の推奨リージョン（日本マーケットプレイス用）
  const region = process.env.AMAZON_PAAPI_REGION || 'us-west-2'

  if (!accessKey || !secretKey || !partnerTag) {
    throw new Error('Amazon PA-API credentials are not set')
  }

  // Signature V4 の設定
  // Note: sha256は型定義上必要だが、実際にはデフォルトで提供される
  const signer = new SignatureV4({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    region,
    service: 'ProductAdvertisingAPI',
  } as any)

  // リクエストペイロード
  const requestPayload = {
    PartnerType: 'Associates',
    PartnerTag: partnerTag,
    Marketplace: 'www.amazon.co.jp',
    Operation: 'SearchItems',
    SearchIndex: 'Books',
    Keywords: query,
    ItemCount: 20,
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.ExternalIds',
      'ItemInfo.ContentInfo',
      'Images.Primary.Large',
      'Images.Primary.Medium',
      'Offers.Listings.Price',
    ],
  }

  // HTTPリクエストの構築
  const httpRequest = new HttpRequest({
    method: 'POST',
    protocol: 'https',
    hostname: 'webservices.amazon.co.jp',
    path: '/paapi5/searchitems',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    },
    body: JSON.stringify(requestPayload),
  })

  // 署名付きリクエストの作成
  const signedRequest = await signer.sign(httpRequest)

  // リクエスト送信
  const response = await fetch(
    `https://${signedRequest.hostname}${signedRequest.path}`,
    {
      method: signedRequest.method,
      headers: signedRequest.headers as HeadersInit,
      body: signedRequest.body,
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Amazon PA-API error:', response.status, errorText)
    throw new Error(`Amazon PA-API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // エラーレスポンスのチェック
  if (data.Errors && data.Errors.length > 0) {
    const errorMessages = data.Errors.map((e: any) => e.Message).join(', ')
    throw new Error(`Amazon PA-API error: ${errorMessages}`)
  }

  // 検索結果が空の場合
  if (!data.SearchResult || !data.SearchResult.Items || data.SearchResult.Items.length === 0) {
    return []
  }

  // 結果をマッピング
  return data.SearchResult.Items.map((item: any) => {
    const asin = item.ASIN
    const title = item.ItemInfo?.Title?.DisplayValue || 'タイトル不明'
    const authors = item.ItemInfo?.ByLineInfo?.Authors || []
    const author = authors.length > 0 ? authors[0].DisplayValue : undefined
    const isbns = item.ItemInfo?.ExternalIds?.ISBNs || []
    const isbn13 = isbns.length > 0 ? isbns[0].DisplayValue : undefined
    const publicationDate = item.ItemInfo?.ContentInfo?.PublicationDate?.DisplayValue
    const publisher = item.ItemInfo?.ContentInfo?.Publisher?.DisplayValue
    const coverImageUrl =
      item.Images?.Primary?.Large?.URL ||
      item.Images?.Primary?.Medium?.URL ||
      undefined

    return {
      title,
      author,
      isbn13,
      coverImageUrl,
      publisher,
      publishedDate: publicationDate,
      provider: 'AMAZON' as const,
      externalId: asin,
      purchaseUrl: `https://www.amazon.co.jp/dp/${asin}?tag=${partnerTag}`,
    }
  })
}

/**
 * 書籍検索（楽天優先、Amazonはオプション）
 */
export async function searchBooks(
  query: string,
  providers: ('RAKUTEN' | 'AMAZON')[] = ['RAKUTEN']
): Promise<BookSearchResult[]> {
  const results: BookSearchResult[] = []

  for (const provider of providers) {
    try {
      if (provider === 'RAKUTEN') {
        const rakutenResults = await searchRakutenBooks(query)
        results.push(...rakutenResults)
      } else if (provider === 'AMAZON') {
        // Amazon実装
        const amazonResults = await searchAmazonBooks(query)
        results.push(...amazonResults)
      }
    } catch (error) {
      console.error(`Failed to search ${provider}:`, error)
      // エラーが発生しても他のプロバイダーの結果は返す
    }
  }

  return results
}
