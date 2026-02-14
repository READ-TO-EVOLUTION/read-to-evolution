import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getUserForAffiliate, isAffiliateSubscriber, logAffiliateStateChange } from '@/lib/affiliate'

/**
 * 解約（OFFへ）
 * AFFILIATE_SUBのみ対象。STUDY_SUBは勉強コース側で扱う
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const user = await getUserForAffiliate(userId)
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // AFFILIATE_SUBのみ対象
    if (!isAffiliateSubscriber(user)) {
      return NextResponse.json(
        { error: 'AFFILIATE_SUBのみ解約可能です' },
        { status: 400 }
      )
    }

    // 原則：支払い期間終了でOFF（即時OFFは運用次第）
    // 現時点では即時OFFとする
    const effectiveAt = new Date()

    await prisma.user.update({
      where: { id: userId },
      data: {
        affiliateState: 'OFF',
        affiliatePlanType: 'NONE',
      },
    })

    await logAffiliateStateChange({
      userId,
      fromState: user.affiliateState as 'OFF' | 'ON' | 'SUSPENDED',
      toState: 'OFF',
      reason: 'USER_CANCEL',
      actorType: 'USER',
    })

    return NextResponse.json({
      affiliateState: 'OFF',
      affiliatePlanType: 'NONE',
      effectiveAt,
      message: '解約しました',
    })
  } catch (error) {
    console.error('Cancel affiliate error:', error)
    return NextResponse.json({ error: '解約処理に失敗しました' }, { status: 500 })
  }
}
