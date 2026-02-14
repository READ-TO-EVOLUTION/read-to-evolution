import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * 積読カード用レビューサマリー取得
 * GET /api/books/[bookId]/review-summary?includeSpoilers=0|1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const bookId = params.bookId
    const { searchParams } = new URL(request.url)
    const includeSpoilers = searchParams.get('includeSpoilers') === '1'

    // 公開レビューの取得条件
    const where: any = {
      bookId,
      isPublic: true,
    }

    // ネタバレ除外（デフォルト）
    if (!includeSpoilers) {
      where.hasSpoiler = false
    }

    // 公開レビュー一覧取得（平均・件数計算用）
    const allPublicReviews = await prisma.review.findMany({
      where: {
        bookId,
        isPublic: true,
      },
      select: {
        rating: true,
      },
    })

    // 平均評価計算
    const avgRating =
      allPublicReviews.length > 0
        ? allPublicReviews.reduce((sum, r) => sum + r.rating, 0) / allPublicReviews.length
        : 0

    // 抜粋用レビュー取得（最大3件）
    const snippets = await prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        hasSpoiler: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true, // 匿名表示用（後でマスク）
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    })

    // 表示名の生成（匿名対応）
    const snippetsWithDisplayName = snippets.map((snippet) => {
      const displayName = snippet.user.name || snippet.user.email?.split('@')[0] || '匿名'
      return {
        reviewId: snippet.id,
        displayName,
        rating: snippet.rating,
        comment: snippet.comment || '',
        hasSpoiler: snippet.hasSpoiler,
        createdAt: snippet.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      bookId,
      avgRating: Math.round(avgRating * 10) / 10, // 小数点第1位まで
      publicReviewCount: allPublicReviews.length,
      snippets: snippetsWithDisplayName,
    })
  } catch (error) {
    console.error('Get review summary error:', error)
    return NextResponse.json({ error: 'レビューサマリーの取得に失敗しました' }, { status: 500 })
  }
}
