import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { isBetaClosed } from '@/lib/feature-flags'

/**
 * 収益還元一覧取得（自分の還元履歴のみ）
 * 報酬対象ユーザー（有料またはaffiliate opt-in） のみ対象
 */
export async function GET(request: NextRequest) {
  if (isBetaClosed()) {
    console.warn('[BETA_CLOSED_BLOCK]', request.nextUrl.pathname)
    return NextResponse.json(
      { error: 'Disabled in Beta Closed', code: 'BETA_CLOSED_DISABLED' },
      { status: 403 }
    )
  }

  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    // ユーザー情報取得（プラン確認）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, affiliateState: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 報酬対象かチェック
    // 条件: planが"FREE"以外、またはaffiliateStateが"ON"
    const isEligibleForRevenue = user.plan !== 'FREE' || user.affiliateState === 'ON'

    if (!isEligibleForRevenue) {
      return NextResponse.json(
        { error: '報酬対象（有料またはアフィリエイトON）のユーザーのみ利用可能です' },
        { status: 403 }
      )
    }

    // 収益還元一覧取得
    const revenueShares = await prisma.revenueShare.findMany({
      where: { userId },
      include: {
        review: {
          include: {
            book: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 合計還元額を計算
    const totalAmount = revenueShares
      .filter((rs) => rs.status === 'paid')
      .reduce((sum, rs) => sum + rs.amount, 0)

    const pendingAmount = revenueShares
      .filter((rs) => rs.status === 'pending')
      .reduce((sum, rs) => sum + rs.amount, 0)

    return NextResponse.json({
      revenueShares,
      totalAmount,
      pendingAmount,
    })
  } catch (error) {
    console.error('Get revenue shares error:', error)
    return NextResponse.json({ error: '収益還元一覧の取得に失敗しました' }, { status: 500 })
  }
}
