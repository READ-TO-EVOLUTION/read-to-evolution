import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createProgressSchema = z.object({
  bookId: z.string().min(1),
  pagesRead: z.number().int().positive().optional().nullable(),
  percentRead: z.number().min(0).max(100).optional().nullable(),
}).refine(
  (data) => data.pagesRead !== null || data.percentRead !== null,
  { message: 'ページ数または読了率のどちらか（または両方）を入力してください' }
)

// 進捗取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ error: 'bookIdが必要です' }, { status: 400 })
    }

    // 書籍の所有確認（UserBookで所有確認）
    // 注意: Bookは共有マスタのため、Book.userIdでは所有確認できない
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 進捗取得
    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Get reading progress error:', error)
    return NextResponse.json({ error: '進捗の取得に失敗しました' }, { status: 500 })
  }
}

// 進捗登録・更新
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createProgressSchema.parse(body)

    // 書籍の所有確認（UserBookで所有確認）
    // 注意: Bookは共有マスタのため、Book.userIdでは所有確認できない
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId: data.bookId },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 既存進捗の確認
    const existingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: data.bookId,
        },
      },
    })

    if (existingProgress) {
      // 既存進捗を更新
      const progress = await prisma.readingProgress.update({
        where: { id: existingProgress.id },
        data: {
          pagesRead: data.pagesRead ?? null,
          percentRead: data.percentRead ?? null,
        },
      })

      return NextResponse.json({ progress })
    }

    // 新規進捗作成
    const progress = await prisma.readingProgress.create({
      data: {
        userId,
        bookId: data.bookId,
        pagesRead: data.pagesRead ?? null,
        percentRead: data.percentRead ?? null,
      },
    })

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create reading progress error:', error)
    return NextResponse.json({ error: '進捗の登録に失敗しました' }, { status: 500 })
  }
}
