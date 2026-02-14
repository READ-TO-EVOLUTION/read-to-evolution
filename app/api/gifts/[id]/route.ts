import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Gift公開取得（giftTokenで検索、認証不要）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const giftToken = params.id // [id]パラメータは実際にはgiftToken

    const gift = await prisma.gift.findUnique({
      where: { giftToken },
      include: {
        book: true, // bookId必須なのでbookも必須
      },
    })

    if (!gift) {
      return NextResponse.json({ error: 'ギフトが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ gift })
  } catch (error) {
    console.error('Get gift error:', error)
    return NextResponse.json({ error: 'ギフトの取得に失敗しました' }, { status: 500 })
  }
}
