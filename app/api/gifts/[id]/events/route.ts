import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEventSchema = z.object({
  type: z.enum([
    'GIFT_OPENED',
    'OUTBOUND_CLICKED',
    'BOOK_ADDED',
    'REGISTERED',
    'REVIEW_VIEWED',
    'REVIEW_CREATED',
    'STUDY_VIEWED',
    'SUBSCRIBED',
  ]),
})

/**
 * Giftイベント記録（公開ページ用、認証不要）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const giftToken = params.id // [id]パラメータは実際にはgiftToken

    // Giftの存在確認
    const gift = await prisma.gift.findUnique({
      where: { giftToken },
      select: { id: true },
    })

    if (!gift) {
      return NextResponse.json({ error: 'ギフトが見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const data = createEventSchema.parse(body)

    // イベント記録
    await prisma.giftEvent.create({
      data: {
        giftId: gift.id,
        type: data.type,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create gift event error:', error)
    return NextResponse.json({ error: 'イベントの記録に失敗しました' }, { status: 500 })
  }
}
