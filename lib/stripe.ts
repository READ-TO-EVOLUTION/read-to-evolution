import Stripe from 'stripe'
import { checkStripeKeySafety } from './safety-check'

// Safety check: Prevent live Stripe key in Beta Closed
checkStripeKeySafety()

let cachedStripe: Stripe | null = null

/**
 * Stripe関連の環境変数エラーを判定（純粋関数）
 * lib/* は Next.js ランタイムに依存しない設計を維持
 * @param error エラーオブジェクト
 * @returns エラー情報（Stripe環境変数エラーの場合）またはnull（それ以外）
 */
export function handleStripeEnvError(
  error: unknown
): { code: 'STRIPE_NOT_CONFIGURED'; message: string } | null {
  if (error instanceof Error) {
    const message = error.message
    // エラー判定ロジック：STRIPE_で始まり、環境変数未設定を示すメッセージを検出
    // 将来の文言変更（'not set' / 'is not set' / 'is required' など）にも対応
    if (
      message.includes('STRIPE_') &&
      (message.includes('not set') ||
        message.includes('is not set') ||
        message.includes('is required'))
    ) {
      return {
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripeの設定が完了していません',
      }
    }
  }
  return null
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(key, { apiVersion: '2024-06-20' as any })
  }
  return cachedStripe
}

/**
 * STUDY_SUB（冊数Tier）用のPrice IDを取得
 * 環境変数: STRIPE_STUDY_PRICE_ID_3, _5, _10, _20, _30, _50
 */
export function getStudyPriceId(bookCount: number): string | null {
  if (bookCount <= 3) {
    return process.env.STRIPE_STUDY_PRICE_ID_3 || null
  } else if (bookCount <= 5) {
    return process.env.STRIPE_STUDY_PRICE_ID_5 || null
  } else if (bookCount <= 10) {
    return process.env.STRIPE_STUDY_PRICE_ID_10 || null
  } else if (bookCount <= 20) {
    return process.env.STRIPE_STUDY_PRICE_ID_20 || null
  } else if (bookCount <= 30) {
    return process.env.STRIPE_STUDY_PRICE_ID_30 || null
  } else {
    return process.env.STRIPE_STUDY_PRICE_ID_50 || null
  }
}

/**
 * アフィリエイト用Checkout Sessionを作成
 * @param userId ユーザーID
 * @param userEmail ユーザーEmail
 * @param checkoutSessionId 既存のCheckout Session ID（再利用用）
 * @param metadata 追加のmetadata（sourceなど分析用）
 */
export async function createAffiliateCheckoutSession(
  userId: string,
  userEmail: string,
  checkoutSessionId?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const priceId = process.env.STRIPE_AFFILIATE_PRICE_ID
  if (!priceId) {
    throw new Error('STRIPE_AFFILIATE_PRICE_ID is not set')
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  // 既存のSessionがある場合は確認して再利用
  if (checkoutSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(checkoutSessionId)
      if (existingSession.status === 'open') {
        // 既存のSessionが有効な場合、作成日時をチェック（24時間以内なら再利用）
        const sessionCreated = new Date(existingSession.created * 1000) // StripeのcreatedはUnix timestamp（秒）
        const now = new Date()
        const hoursSinceCreation = (now.getTime() - sessionCreated.getTime()) / (1000 * 60 * 60)
        const SESSION_REUSE_HOURS = 24 // 24時間以内なら再利用

        if (hoursSinceCreation < SESSION_REUSE_HOURS) {
          // 既存のSessionが有効で期限内の場合はそのまま返す
          return existingSession
        }
        // 期限を超えていたら新規作成（下記の処理に続く）
      }
    } catch (error) {
      // Sessionが見つからない場合は新規作成
    }
  }

  // 新規Session作成
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId,
      purpose: 'AFFILIATE_SUB', // 固定：Webhook側でpurposeチェックに使用
      type: 'AFFILIATE_SUBSCRIPTION', // 後方互換性のため残す
      ...metadata, // 追加のmetadata（sourceなど）
    },
    success_url: `${appUrl}/gifts?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/gifts?canceled=true`,
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

/**
 * STUDY_SUB（冊数Tier）用Checkout Sessionを作成
 * @param userId ユーザーID
 * @param userEmail ユーザーEmail
 * @param bookCount 冊数（3, 5, 10, 20, 30, 50のいずれか）
 * @param metadata 追加のmetadata（sourceなど分析用）
 */
export async function createStudyCheckoutSession(
  userId: string,
  userEmail: string,
  bookCount: number,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const priceId = getStudyPriceId(bookCount)
  if (!priceId) {
    throw new Error(`STRIPE_STUDY_PRICE_ID for bookCount=${bookCount} is not set`)
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  // 新規Session作成
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId,
      purpose: 'STUDY_SUB', // Webhook側でpurposeチェックに使用
      bookCount: bookCount.toString(),
      ...metadata, // 追加のmetadata（sourceなど）
    },
    success_url: `${appUrl}/study/today?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/study/today?canceled=true`,
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

/**
 * Webhookイベントを検証
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe()

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
