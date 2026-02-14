import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 公開レビュー一覧取得
 * GET /api/reviews/public?bookId=...&limit=20&offset=0
 * 未ログインでも閲覧可能（公開情報のみのため）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // bookIdは任意（指定されていない場合は全公開レビューを取得）

    // ページングパラメータのパース（デフォルト値）
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // バリデーション
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'limitは1〜100の範囲で指定してください' }, { status: 400 })
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'offsetは0以上の整数で指定してください' }, { status: 400 })
    }

    // 公開レビューの取得条件
    const where: any = {
      isPublic: true,
    }
    if (bookId) {
      where.bookId = bookId
    }

    // 総件数を取得（ページング用）
    const total = await prisma.review.count({
      where,
    })

    // 公開レビュー一覧取得
    const reviews = await prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        comment: true,
        searchKeywords: true,
        favoritePhrase: true,
        emotionTag: true,
        recommendedBooks: true,
        hasSpoiler: true,
        // 構造化フィールド
        buyReason: true,
        goodPoints: true,
        missingPoints: true,
        badPoints: true,
        readDate: true,
        pagesRead: true,
        ocrQuote: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true, // userIdから匿名名を生成するため
            name: true,
            // emailは除外（PII保護）
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn13: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // 表示名の生成（匿名対応）
    // 注意: user.emailは取得していない（PII保護）
    const reviewsWithDisplayName = reviews.map((review) => {
      let displayName = '匿名ユーザー'
      if (review.user.name) {
        displayName = review.user.name
      } else {
        // userIdから匿名名を生成（例: clx123456 → ユーザー1234）
        const userIdShort = review.user.id.substring(0, 8)
        displayName = `ユーザー${userIdShort.substring(2, 6)}`
      }

      return {
        ...review,
        user: {
          name: displayName,
        },
      }
    })

    return NextResponse.json({
      reviews: reviewsWithDisplayName,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get public reviews error:', error)
    return NextResponse.json({ error: '公開レビュー一覧の取得に失敗しました' }, { status: 500 })
  }
}
