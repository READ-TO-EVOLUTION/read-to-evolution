export const runtime = 'nodejs' // 重要：edgeだと挙動差・依存で事故りやすい

import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, handleStripeEnvError } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logAffiliateStateChange } from '@/lib/affiliate'
import Stripe from 'stripe'

import { isBetaClosed } from '@/lib/feature-flags'

/**
 * Stripe Webhook Handler
 * 認証不要（Stripeからの直接呼び出し）
 */
export async function POST(req: NextRequest) {
  if (isBetaClosed()) {
    console.warn('[BETA_CLOSED_BLOCK]', req.nextUrl.pathname, '- Returning 204 to prevent Stripe retries')
    // Return 204 No Content to prevent Stripe from retrying
    return new NextResponse(null, { status: 204 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err)
    // Stripe環境変数エラーの場合の処理方針：
    // 【現在の仕様】500を返す（Stripe側がリトライするため、ログが荒れる可能性あり）
    // 【代替案】200 { received: true } を返して処理をスキップ（環境依存で未設定時のみ）
    // → 運用方針に応じて選択。本番環境では必ず設定すべき。
    const envError = handleStripeEnvError(err)
    if (envError) {
      return NextResponse.json(
        { error: envError.code, message: envError.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Webhook signature verification failed', message: err?.message },
      { status: 400 }
    )
  }

  try {
    // 二重処理防止：同じevent.idが既に処理済みかチェック
    const exists = await prisma.webhookEventLog.findUnique({
      where: { id: event.id },
    })
    if (exists) {
      console.log(`Webhook event already processed: ${event.id}`)
      return NextResponse.json({ received: true })
    }

    // イベント処理（成功後にWebhookEventLogに記録）
    let processed = false

    console.log(`Processing webhook event: ${event.type}, id: ${event.id}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // purposeで分岐（AFFILIATE_SUB or STUDY_SUB）
        const purpose = session.metadata?.purpose
        const type = session.metadata?.type // 後方互換性

        // session.metadata.userId でユーザー特定（最重要・最も確実）
        const userId = session.metadata?.userId
        const source = session.metadata?.source || 'UNKNOWN'
        console.log(`Processing checkout.session.completed for userId: ${userId ? userId.substring(0, 8) + '...' : 'MISSING'}, purpose: ${purpose}, source: ${source}`)
        if (!userId) {
          console.error('Missing userId in checkout session metadata')
          return NextResponse.json({ received: true })
        }

        // ユーザーを取得
        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          console.error(`User not found: ${userId.substring(0, 8)}...`)
          return NextResponse.json({ received: true })
        }

        // サブスクリプション情報を取得
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id

        // STUDY_SUBの処理
        if (purpose === 'STUDY_SUB') {
          const bookCount = parseInt(session.metadata?.bookCount || '0', 10)

          // plan=STUDY, affiliatePlanType=STUDY_SUB, affiliateState=ONに更新
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'STUDY',
              affiliatePlanType: 'STUDY_SUB',
              affiliateState: 'ON', // STUDY_SUBは自動でアフィリエイトON
              affiliateEnabledAt: new Date(),
              stripeCustomerId: customerId || null,
              stripeSubscriptionId: subscriptionId || null,
            },
          })

          // 状態遷移ログを記録（actorType=STRIPE）
          await logAffiliateStateChange({
            userId,
            fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
            toState: 'ON',
            reason: 'STUDY_SUBSCRIBED',
            actorType: 'STRIPE',
            metadata: {
              source,
              stripeCheckoutSessionId: session.id,
              bookCount: bookCount.toString(),
            },
          })

          processed = true
          console.log(`Study subscription enabled for user: ${userId.substring(0, 8)}..., bookCount: ${bookCount}`)
          break
        }

        // AFFILIATE_SUBの処理（既存ロジック）
        if (purpose === 'AFFILIATE_SUB' || type === 'AFFILIATE_SUBSCRIPTION') {
          // affiliateState=ONに更新
          await prisma.user.update({
            where: { id: userId },
            data: {
              affiliateState: 'ON',
              affiliatePlanType: 'AFFILIATE_SUB',
              affiliateEnabledAt: new Date(),
              stripeCustomerId: customerId || null,
              stripeSubscriptionId: subscriptionId || null,
              stripeAffiliateCheckoutSessionId: null, // 完了したのでクリア
            },
          })

          // 状態遷移ログを記録（actorType=STRIPE）
          // sourceをmetadataに含めて保存（分析用）
          await logAffiliateStateChange({
            userId,
            fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
            toState: 'ON',
            reason: 'CHECKOUT_COMPLETED',
            actorType: 'STRIPE',
            metadata: {
              source,
              stripeCheckoutSessionId: session.id,
            },
          })

          processed = true
          console.log(`Affiliate enabled for user: ${userId.substring(0, 8)}...`)
          break
        }

        // その他のpurposeは無視
        console.log(`Ignoring checkout.session.completed: purpose=${purpose}, type=${type}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // サブスクリプションIDからユーザーを特定
        // Stripe.Invoice型ではsubscriptionはstring | Stripe.Subscription | null
        const subscriptionId =
          typeof (invoice as any).subscription === 'string'
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id

        if (!subscriptionId) {
          return NextResponse.json({ received: true })
        }

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        })

        if (!user) {
          console.error(`User not found for subscription: ${subscriptionId}`)
          return NextResponse.json({ received: true })
        }

        // affiliateState=SUSPENDEDに更新
        await prisma.user.update({
          where: { id: user.id },
          data: {
            affiliateState: 'SUSPENDED',
            affiliateSuspendedAt: new Date(),
            affiliateSuspendedReason: 'PAYMENT_FAILED',
          },
        })

        // 状態遷移ログを記録（actorType=STRIPE）
        await logAffiliateStateChange({
          userId: user.id,
          fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
          toState: 'SUSPENDED',
          reason: 'PAYMENT_FAILED',
          actorType: 'STRIPE',
        })

        processed = true
        console.log(`Affiliate suspended for user: ${user.id.substring(0, 8)}... (payment failed)`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (!user) {
          console.error(`User not found for subscription: ${subscription.id}`)
          return NextResponse.json({ received: true })
        }

        // affiliateState=OFFに更新
        await prisma.user.update({
          where: { id: user.id },
          data: {
            affiliateState: 'OFF',
            affiliatePlanType: 'NONE',
            affiliateEnabledAt: null,
            affiliateSuspendedReason: null,
            stripeSubscriptionId: null,
          },
        })

        // 状態遷移ログを記録（actorType=STRIPE）
        await logAffiliateStateChange({
          userId: user.id,
          fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
          toState: 'OFF',
          reason: 'SUB_DELETED',
          actorType: 'STRIPE',
        })

        processed = true
        console.log(`Affiliate disabled for user: ${user.id.substring(0, 8)}... (subscription deleted)`)
        break
      }

      default:
        // その他のイベントは無視
        console.log(`Unhandled event type: ${event.type}`)
    }

    // イベント処理が成功したらWebhookEventLogに記録（二重処理防止）
    // 並行実行でP2002（ユニーク制約）が起き得るので、try/catchで握りつぶす
    if (processed) {
      try {
        await prisma.webhookEventLog.create({
          data: { id: event.id },
        })
      } catch (e: any) {
        // Prismaのユニーク衝突（既に別プロセスがcreate済み）
        if (e?.code !== 'P2002') throw e
        console.log(`WebhookEventLog already exists (race condition): ${event.id}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
