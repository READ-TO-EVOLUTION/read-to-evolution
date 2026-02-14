import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { getUserForAffiliate, requiresAffiliatePaywall } from '@/lib/affiliate'

/**
 * 現在のAffiliateState取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const user = await getUserForAffiliate(userId)
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({
      affiliateState: user.affiliateState,
      affiliatePlanType: user.affiliatePlanType,
      enabledAt: user.affiliateEnabledAt,
      suspendedAt: user.affiliateSuspendedAt,
      suspendedReason: user.affiliateSuspendedReason,
      requiresPaywall: requiresAffiliatePaywall(user),
    })
  } catch (error) {
    console.error('Get affiliate state error:', error)
    return NextResponse.json({ error: '状態の取得に失敗しました' }, { status: 500 })
  }
}
