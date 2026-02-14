import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { getUserForAffiliate, isAffiliateOn } from '@/lib/affiliate'

/**
 * Gift成果計測データ取得（自分のGiftのみ）
 * v4: affiliateState==ONの場合のみ利用可
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    // v4: affiliateState==ONの場合のみ利用可
    const user = await getUserForAffiliate(userId)
    if (!user || !isAffiliateOn(user)) {
      return NextResponse.json(
        {
          error: 'AFFILIATE_REQUIRED',
          requiresPaywall: true,
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const giftId = searchParams.get('giftId')

    const where: any = {}
    if (giftId) {
      where.giftId = giftId
      // Giftの所有確認
      const gift = await prisma.gift.findFirst({
        where: { id: giftId, senderUserId: userId },
      })
      if (!gift) {
        return NextResponse.json({ error: 'Giftが見つかりません' }, { status: 404 })
      }
    } else {
      // 自分のGiftのみ
      const myGifts = await prisma.gift.findMany({
        where: { senderUserId: userId },
        select: { id: true },
      })
      where.giftId = { in: myGifts.map((g) => g.id) }
    }

    const events = await prisma.giftEvent.findMany({
      where,
      include: {
        gift: {
          include: {
            book: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // KPI計算用のgiftIdリストを取得
    const targetGiftIds = giftId
      ? [giftId]
      : (await prisma.gift.findMany({
          where: { senderUserId: userId },
          select: { id: true },
        })).map((g) => g.id)

    const createdCount = await prisma.giftEvent.count({
      where: {
        giftId: { in: targetGiftIds },
        type: 'GIFT_CREATED',
      },
    })

    const openedCount = await prisma.giftEvent.count({
      where: {
        giftId: { in: targetGiftIds },
        type: 'GIFT_OPENED',
      },
    })

    const outboundClickedCount = await prisma.giftEvent.count({
      where: {
        giftId: { in: targetGiftIds },
        type: 'OUTBOUND_CLICKED',
      },
    })

    const registeredCount = await prisma.giftEvent.count({
      where: {
        giftId: { in: targetGiftIds },
        type: 'REGISTERED',
      },
    })

    const subscribedCount = await prisma.giftEvent.count({
      where: {
        giftId: { in: targetGiftIds },
        type: 'SUBSCRIBED',
      },
    })

    const openRate = createdCount > 0 ? (openedCount / createdCount) * 100 : 0
    const outboundCTR = openedCount > 0 ? (outboundClickedCount / openedCount) * 100 : 0
    const subscribeRate = openedCount > 0 ? (subscribedCount / openedCount) * 100 : 0

    return NextResponse.json({
      events,
      kpi: {
        created: createdCount,
        opened: openedCount,
        outboundClicked: outboundClickedCount,
        registered: registeredCount,
        subscribed: subscribedCount,
        openRate: Math.round(openRate * 100) / 100,
        outboundCTR: Math.round(outboundCTR * 100) / 100,
        subscribeRate: Math.round(subscribeRate * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Get gift events error:', error)
    return NextResponse.json({ error: 'Gift成果計測データの取得に失敗しました' }, { status: 500 })
  }
}
