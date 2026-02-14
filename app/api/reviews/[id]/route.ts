import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * レビュー削除
 * DELETE /api/reviews/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'idが必要です' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    if (review.userId !== userId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json({ error: 'レビューの削除に失敗しました' }, { status: 500 })
  }
}

