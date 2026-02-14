import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

const createKoyoriSchema = z.object({
  title: z.string().min(1).max(200),
  memo: z.string().max(500).optional(),
})

/**
 * こより一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId }

    const koyoris = await prisma.koyori.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      include: {
        items: {
          orderBy: { order: 'asc' },
          take: 1, // 最初の1件だけ取得（件数確認用）
        },
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const hasMore = koyoris.length > limit
    const items = hasMore ? koyoris.slice(0, limit) : koyoris

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  } catch (error) {
    console.error('Get koyoris error:', error)
    return NextResponse.json({ error: 'こより一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * こより作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const { title, memo } = createKoyoriSchema.parse(body)

    const koyori = await prisma.koyori.create({
      data: {
        userId,
        title,
        memo: memo || null,
        visibility: 'PRIVATE',
      },
    })

    return NextResponse.json(koyori, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create koyori error:', error)
    return NextResponse.json({ error: 'こよりの作成に失敗しました' }, { status: 500 })
  }
}
