import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'
import { evaluateRevenueEligibility, logRevenueShareGateDecision } from '@/lib/revenue-share'

const createReviewSchema = z.object({
  bookId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(200).optional(),
  searchKeywords: z.string().optional(),
  favoritePhrase: z.string().max(100).optional(), // 短い引用のみ
  emotionTag: z.string().min(1), // 必須
  recommendedBooks: z.array(z.string()).max(3).optional(), // 最大3冊のbookId配列
  wrongCount: z.number().int().min(0).optional(), // 間違えた回数
  masteryDays: z.number().int().min(0).optional(), // 覚えるまでの期間（日数）
  isPublic: z.boolean().default(false), // 公開設定
  hasSpoiler: z.boolean().default(false), // ネタバレフラグ
  // 構造化フィールド（新規追加）
  buyReason: z.string().max(200).optional(), // 買う理由
  goodPoints: z.string().min(1).max(500), // 良かった点（必須）
  missingPoints: z.string().max(500).optional(), // 足りない点
  badPoints: z.string().max(500).optional(), // 悪かった点
  readDate: z.string().optional(), // 読んだ日（ISO文字列）
  pagesRead: z.number().int().min(0).optional(), // ページ数
  ocrQuote: z.string().max(500).optional(), // OCR一文（引用）
  // ReadingProgress/OCRAssetとの紐づけ（任意）
  readingProgressId: z.string().optional(), // ReadingProgressのID
  ocrAssetId: z.string().optional(), // OCRAssetのID
})

// レビュー一覧取得（自分のレビューのみ）
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const q = searchParams.get('q') // 検索クエリ

    const where: any = { userId }
    if (bookId) {
      where.bookId = bookId
    }

    // 検索クエリがある場合、searchKeywordsとcommentで部分一致検索
    if (q && q.trim().length > 0) {
      const searchQuery = q.trim()
      where.OR = [
        { searchKeywords: { contains: searchQuery } },
        { comment: { contains: searchQuery } },
      ]
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        book: true,
        evolutionLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // 最新10件の進化ログ
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'レビュー一覧の取得に失敗しました' }, { status: 500 })
  }
}

// レビュー投稿
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createReviewSchema.parse(body)

    // 書籍の所有確認（UserBookで所有確認）
    // 注意: Bookは共有マスタのため、UserBookで所有を確認する
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId: data.bookId },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 既存レビューチェック（1書籍1レビュー）
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        bookId: data.bookId,
      },
    })

    if (existingReview) {
      // 進化ログを作成（更新前の状態を記録）
      await prisma.reviewEvolutionLog.create({
        data: {
          reviewId: existingReview.id,
          rating: existingReview.rating,
          comment: existingReview.comment,
          searchKeywords: existingReview.searchKeywords,
          favoritePhrase: existingReview.favoritePhrase,
          recommendedBooks: existingReview.recommendedBooks,
          emotionTag: existingReview.emotionTag,
          wrongCount: data.wrongCount,
          masteryDays: data.masteryDays,
        },
      })

      // 既存レビューを更新
      const review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: data.rating,
          comment: data.comment || '',
          searchKeywords: data.searchKeywords,
          favoritePhrase: data.favoritePhrase,
          emotionTag: data.emotionTag,
          recommendedBooks: data.recommendedBooks ? JSON.stringify(data.recommendedBooks) : null,
          isPublic: data.isPublic,
          hasSpoiler: data.hasSpoiler,
          // 構造化フィールド
          buyReason: data.buyReason,
          goodPoints: data.goodPoints,
          missingPoints: data.missingPoints,
          badPoints: data.badPoints,
          readDate: data.readDate ? new Date(data.readDate) : null,
          pagesRead: data.pagesRead,
          ocrQuote: data.ocrQuote,
        },
        include: {
          book: true,
          evolutionLogs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // 最新10件の進化ログ
          },
        },
      })

      // 報酬ゲート判定ログ（公開レビューのみ）
      if (review.isPublic) {
        const eligibility = await evaluateRevenueEligibility(userId)
        await logRevenueShareGateDecision({
          userId,
          reviewId: review.id,
          source: 'REVIEW_UPDATED',
          eligible: eligibility.eligible,
          reason: eligibility.reason,
          metadata: {
            bookId: data.bookId,
            isPublic: review.isPublic,
            plan: eligibility.plan,
            affiliateState: eligibility.affiliateState,
          },
        }).catch(() => {})
      }

      return NextResponse.json({ review })
    }

    // 新規レビュー作成
    const review = await prisma.review.create({
      data: {
        userId,
        bookId: data.bookId,
        rating: data.rating,
        comment: data.comment || '',
        searchKeywords: data.searchKeywords,
        favoritePhrase: data.favoritePhrase,
        emotionTag: data.emotionTag,
        recommendedBooks: data.recommendedBooks ? JSON.stringify(data.recommendedBooks) : null,
        isPublic: data.isPublic,
        hasSpoiler: data.hasSpoiler,
        // 構造化フィールド
        buyReason: data.buyReason,
        goodPoints: data.goodPoints,
        missingPoints: data.missingPoints,
        badPoints: data.badPoints,
        readDate: data.readDate ? new Date(data.readDate) : null,
        pagesRead: data.pagesRead,
        ocrQuote: data.ocrQuote,
      },
      include: {
        book: true,
        evolutionLogs: true,
      },
    })

    // ReadingProgress/OCRAssetとの紐づけ（任意）
    if (data.readingProgressId) {
      await prisma.readingProgress.update({
        where: { id: data.readingProgressId },
        data: { reviewId: review.id },
      }).catch(() => {
        // エラーは無視（紐づけは任意のため）
      })
    }
    if (data.ocrAssetId) {
      await prisma.oCRAsset.update({
        where: { id: data.ocrAssetId },
        data: { reviewId: review.id },
      }).catch(() => {
        // エラーは無視（紐づけは任意のため）
      })
    }

    // 報酬ゲート判定ログ（公開レビューのみ）
    // 注意: 実際の報酬計上は購入発生時に createRevenueShare を呼ぶ
    if (review.isPublic) {
      const eligibility = await evaluateRevenueEligibility(userId)
      await logRevenueShareGateDecision({
        userId,
        reviewId: review.id,
        source: 'REVIEW_CREATED',
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        metadata: {
          bookId: data.bookId,
          isPublic: review.isPublic,
          plan: eligibility.plan,
          affiliateState: eligibility.affiliateState,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'レビューの投稿に失敗しました' }, { status: 500 })
  }
}
