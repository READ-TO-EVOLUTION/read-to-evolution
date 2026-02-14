import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * locationのデフォルト値を取得
 * 探索優先度：
 * 1) user_id + material_id の直近
 * 2) user_id + book_id の直近
 * 3) 空
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ location: null })
    }

    // 優先度1: material_id + user_id の直近
    if (materialId) {
      const recentByMaterial = await prisma.studyRecord.findFirst({
        where: {
          userId,
          materialId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          locationType: true,
          locationValue: true,
          locationNote: true,
        },
      })

      if (recentByMaterial) {
        return NextResponse.json({ location: recentByMaterial })
      }
    }

    // 優先度2: book_id + user_id の直近
    const recentByBook = await prisma.studyRecord.findFirst({
      where: {
        userId,
        bookId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        locationType: true,
        locationValue: true,
        locationNote: true,
      },
    })

    if (recentByBook) {
      return NextResponse.json({ location: recentByBook })
    }

    // 優先度3: 空
    return NextResponse.json({ location: null })
  } catch (error) {
    console.error('Get default location error:', error)
    return NextResponse.json({ error: 'デフォルト値の取得に失敗しました' }, { status: 500 })
  }
}
