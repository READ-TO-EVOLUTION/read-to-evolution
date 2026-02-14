import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createMesoSchema = z.object({
  bookId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  readingLogIds: z.array(z.string()).min(1), // 含めるReadingLogのID配列
})

const updateMesoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  readingLogIds: z.array(z.string()).optional(),
})

/**
 * Meso一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    const where: any = { userId }
    if (bookId) {
      where.bookId = bookId
    }

    const mesos = await prisma.meso.findMany({
      where,
      include: {
        book: true,
        items: {
          include: {
            readingLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ mesos })
  } catch (error) {
    console.error('Get mesos error:', error)
    return NextResponse.json({ error: 'Meso一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * Meso作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createMesoSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // ReadingLogの所有確認
    const readingLogs = await prisma.readingLog.findMany({
      where: {
        id: { in: data.readingLogIds },
        userId,
        bookId: data.bookId,
      },
    })

    if (readingLogs.length !== data.readingLogIds.length) {
      return NextResponse.json({ error: '一部のReadingLogが見つかりません' }, { status: 404 })
    }

    // Meso作成
    const meso = await prisma.meso.create({
      data: {
        userId,
        bookId: data.bookId,
        title: data.title,
        description: data.description,
        items: {
          create: data.readingLogIds.map((readingLogId, index) => ({
            readingLogId,
            order: index,
          })),
        },
      },
      include: {
        book: true,
        items: {
          include: {
            readingLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json({ meso }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create meso error:', error)
    return NextResponse.json({ error: 'Mesoの作成に失敗しました' }, { status: 500 })
  }
}
