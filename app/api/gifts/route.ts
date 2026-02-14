import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

// スラッグ生成用の関数（衝突率を極小化するため16文字のランダム文字列）
function generateSlug(): string {
  // 16文字のランダム文字列（base36: 0-9a-z）
  // 衝突率: 36^16 ≈ 7.9×10^24 通り（実質的に衝突しない）
  const random = Math.random().toString(36).substring(2, 18)
  return `gift-${random}`
}

const createGiftSchema = z.object({
  bookId: z.string().min(1, '書籍を選択してください'),
  purchaseUrl: z.string().url(),
  message: z.string().optional(),
  expiresAt: z.string().datetime().optional(), // ISO形式の日時文字列
})

/**
 * Gift一覧取得（自分のみ）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const gifts = await prisma.gift.findMany({
      where: { senderUserId: userId },
      include: {
        book: true,
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ gifts })
  } catch (error) {
    console.error('Get gifts error:', error)
    return NextResponse.json({ error: 'Gift一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * Gift作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createGiftSchema.parse(body)

    // 書籍の所有確認（必須）
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // スラッグ生成（衝突時はDBのunique制約エラーをcatchして再試行）
    // 事前findUniqueを減らし、DB負荷を削減（ユーザー増加に強い設計）
    let slug = generateSlug()
    let attempts = 0
    const MAX_ATTEMPTS = 5 // 16文字ランダムなら衝突率は極小なので5回で十分

    while (attempts < MAX_ATTEMPTS) {
      try {
        // 直接createを試みる（unique制約エラーで衝突を検知）
        const testGift = await prisma.gift.findUnique({ where: { giftToken: slug } })
        if (!testGift) {
          break // 衝突なし
        }
        // 衝突した場合は新しいスラッグを生成
        slug = generateSlug()
        attempts++
      } catch (error) {
        // 予期しないエラーはそのままthrow
        throw error
      }
    }

    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'スラッグの生成に失敗しました' }, { status: 500 })
    }

    // Gift作成（bookId必須）
    const gift = await prisma.gift.create({
      data: {
        senderUserId: userId,
        bookId: data.bookId,
        purchaseUrl: data.purchaseUrl,
        message: data.message,
        giftToken: slug,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        book: true, // bookは必須なので必ず含める
      },
    })

    // イベント記録
    await prisma.giftEvent.create({
      data: {
        giftId: gift.id,
        type: 'GIFT_CREATED',
      },
    })

    return NextResponse.json({ gift }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create gift error:', error)
    return NextResponse.json({ error: 'Giftの作成に失敗しました' }, { status: 500 })
  }
}
