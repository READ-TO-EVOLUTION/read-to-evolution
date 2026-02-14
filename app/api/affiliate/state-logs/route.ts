import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * 状態ログ（監査）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId }

    const logs = await prisma.affiliateStateLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const hasMore = logs.length > limit
    const items = hasMore ? logs.slice(0, limit) : logs

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  } catch (error) {
    console.error('Get state logs error:', error)
    return NextResponse.json({ error: 'ログの取得に失敗しました' }, { status: 500 })
  }
}
