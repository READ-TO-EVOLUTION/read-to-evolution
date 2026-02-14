import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logRevenueShareGateDecision } from '@/lib/revenue-share'

/**
 * レビュー経由の購入リンククリック計測
 * POST /api/reviews/[id]/purchase-click
 * 未ログインでも利用可能（reviewIdのみで計測）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params

    // レビューの存在確認
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        bookId: true,
        isPublic: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    // 公開レビューのみ計測対象
    if (!review.isPublic) {
      return NextResponse.json({ error: '公開レビューのみ計測対象です' }, { status: 403 })
    }

    // クリックイベントを記録（将来の分析用）
    // 注意: 現時点ではRevenueShareGateLogのみ記録
    // 実際の購入完了検知は後回し（クリック計測のみ実装）

    // 報酬ゲート判定ログ（クリック時点で記録）
    // 注意: 実際の購入完了は検知できないため、クリック時点での判定のみ
    // 購入完了の検知は後回し（Amazon/楽天のAPI連携が必要）
    // 現時点ではRevenueShareGateLogのみ記録（revenueAmount=0のためRevenueShareは作成されない）
    await logRevenueShareGateDecision({
      userId: review.userId,
      reviewId: review.id,
      source: 'OUTBOUND_CLICK',
      eligible: false, // クリック時点では購入完了が検知できないためfalse
      reason: 'CLICK_RECORDED', // クリック記録済み
      metadata: {
        bookId: review.bookId,
        clickTime: new Date().toISOString(),
        message: 'レビュー経由の購入リンククリック（クリック記録）',
      },
    }).catch(() => {
      // エラーは無視（クリック計測は任意のため）
    })

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      message: 'クリックを記録しました',
    })
  } catch (error) {
    console.error('Purchase click tracking error:', error)
    return NextResponse.json(
      { error: 'クリックの記録に失敗しました' },
      { status: 500 }
    )
  }
}
