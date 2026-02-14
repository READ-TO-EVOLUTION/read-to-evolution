import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { isStudySubscriber, logAffiliateStateChange } from '@/lib/affiliate'
import { createAffiliateCheckoutSession, handleStripeEnvError } from '@/lib/stripe'

const optInSchema = z.object({
  intent: z.literal('ENABLE_AFFILIATE'),
  source: z.enum(['GIFT', 'DASHBOARD', 'BOOK_URL']).optional(),
})

/**
 * 報酬ONのリクエスト（課金フロー開始）
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const { intent, source } = optInSchema.parse(body)

    // ユーザー情報を1回で取得（select最小化）
    // このAPIで必要なUserフィールド（最小）:
    // - email（Checkout Session作成に必要、98行目で使用）
    // - affiliateState（状態判定に必要、47/56/80行目で使用）
    // - affiliatePlanType（状態判定に必要、50/86行目で使用）
    // - affiliateSuspendedReason（SUSPENDED時の理由、60行目で使用）
    // - stripeAffiliateCheckoutSessionId（既存Session確認用、99行目で使用）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        affiliateState: true,
        affiliatePlanType: true,
        affiliateSuspendedReason: true,
        stripeAffiliateCheckoutSessionId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 既にONの場合はそのまま返す
    if (user.affiliateState === 'ON') {
      return NextResponse.json({
        affiliateState: 'ON',
        affiliatePlanType: user.affiliatePlanType,
        message: '既に報酬ONです',
      })
    }

    // SUSPENDEDの場合はエラー
    if (user.affiliateState === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: 'AFFILIATE_SUSPENDED',
          reason: user.affiliateSuspendedReason || 'PAYMENT_FAILED',
        },
        { status: 403 }
      )
    }

    // STUDY_SUBの場合は課金不要で即ON
    if (isStudySubscriber(user)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          affiliateState: 'ON',
          affiliatePlanType: 'STUDY_SUB',
          affiliateEnabledAt: new Date(),
          stripeAffiliateCheckoutSessionId: null, // 不要な残骸を消す
        },
      })

      await logAffiliateStateChange({
        userId,
        fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
        toState: 'ON',
        reason: 'STUDY_SUBSCRIBED',
        actorType: 'SYSTEM',
      })

      return NextResponse.json({
        affiliateState: 'ON',
        affiliatePlanType: 'STUDY_SUB',
        message: '報酬ONにしました（勉強コース加入者のため課金不要）',
      })
    }

    // AFFILIATE_SUBまたはNONEの場合はStripe Checkoutへ誘導
    try {
      // Checkout Sessionを作成（sourceをmetadataに含める）
      const checkoutSession = await createAffiliateCheckoutSession(
        userId,
        user.email,
        user.stripeAffiliateCheckoutSessionId || undefined,
        {
          source: source || 'UNKNOWN', // 分析用：sourceをmetadataに含める
        }
      )

      // checkoutSession.urlがnullの場合はエラー
      if (!checkoutSession.url) {
        return NextResponse.json(
          { error: 'Checkout URLの取得に失敗しました' },
          { status: 500 }
        )
      }

      // Checkout Session IDを保存（Webhook照合用）
      // updateManyで「まだnullの時だけ」保存して競合耐性を確保
      const updateResult = await prisma.user.updateMany({
        where: {
          id: userId,
          stripeAffiliateCheckoutSessionId: null,
        },
        data: {
          stripeAffiliateCheckoutSessionId: checkoutSession.id,
        },
      })

      // updateManyのcountが0の場合は、別リクエストが先に保存した可能性がある
      if (updateResult.count === 0) {
        // 既存のSession IDを再取得して使用
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { stripeAffiliateCheckoutSessionId: true },
        })

        if (existingUser?.stripeAffiliateCheckoutSessionId) {
          // 既存のSessionを再利用（createAffiliateCheckoutSession内で処理される）
          // 既存SessionIDを渡すと、createAffiliateCheckoutSession内で再利用される
          try {
            const existingSession = await createAffiliateCheckoutSession(
              userId,
              user.email,
              existingUser.stripeAffiliateCheckoutSessionId,
              {
                source: source || 'UNKNOWN',
              }
            )
            if (existingSession.url) {
              return NextResponse.json({
                requiresCheckout: true,
                checkoutUrl: existingSession.url,
                message: 'Stripe Checkoutへ遷移してください',
              })
            }
          } catch (error) {
            // 既存Sessionが無効な場合は新規作成したSessionを使用
          }
        }
      }

      return NextResponse.json({
        requiresCheckout: true,
        checkoutUrl: checkoutSession.url,
        message: 'Stripe Checkoutへ遷移してください',
      })
    } catch (error) {
      console.error('Stripe Checkout Session creation error:', error)
      // Stripe環境変数エラーの場合は統一されたエラーレスポンスを返す
      const envError = handleStripeEnvError(error)
      if (envError) {
        return NextResponse.json(
          { error: envError.code, message: envError.message },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: '決済セッションの作成に失敗しました' },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Opt-in error:', error)
    return NextResponse.json({ error: '報酬ONの処理に失敗しました' }, { status: 500 })
  }
}
