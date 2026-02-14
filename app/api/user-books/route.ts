import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const updateUserBookSchema = z.object({
  bookId: z.string(),
  status: z.enum(['TSUNDOKU', 'READING', 'FINISHED', 'PAUSED']),
})

/**
 * ユーザー×本の状態一覧取得
 * GET /api/user-books?status=TSUNDOKU
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const userBooks = await prisma.userBook.findMany({
      where,
      include: {
        book: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ userBooks })
  } catch (error) {
    console.error('Get user books error:', error)
    return NextResponse.json({ error: 'ユーザー書籍一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * ユーザー×本の状態更新（作成または更新）
 * POST /api/user-books
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = updateUserBookSchema.parse(body)

    // 既存レコードを確認
    const existing = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: data.bookId,
        },
      },
    })

    if (existing) {
      // 更新
      const userBook = await prisma.userBook.update({
        where: { id: existing.id },
        data: {
          status: data.status,
        },
        include: {
          book: true,
        },
      })
      return NextResponse.json({ userBook })
    } else {
      // 作成
      const userBook = await prisma.userBook.create({
        data: {
          userId,
          bookId: data.bookId,
          status: data.status,
        },
        include: {
          book: true,
        },
      })
      return NextResponse.json({ userBook }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create/update user book error:', error)
    return NextResponse.json({ error: '状態の更新に失敗しました' }, { status: 500 })
  }
}
