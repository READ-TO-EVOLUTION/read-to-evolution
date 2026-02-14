import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createMacroSchema = z.object({
  bookId: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  readingLogIds: z.array(z.string()).optional(), // 含めるReadingLogのID配列
  mesoIds: z.array(z.string()).optional(), // 含めるMesoのID配列
})

const updateMacroSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  readingLogIds: z.array(z.string()).optional(),
  mesoIds: z.array(z.string()).optional(),
})

/**
 * Macro一覧取得
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

    const macros = await prisma.macro.findMany({
      where,
      include: {
        book: true,
        items: {
          include: {
            readingLog: true,
            meso: true,
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

    return NextResponse.json({ macros })
  } catch (error) {
    console.error('Get macros error:', error)
    return NextResponse.json({ error: 'Macro一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * Macro作成（1冊につき1つのみ）
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createMacroSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 既存のMacroをチェック（1冊につき1つのみ）
    const existingMacro = await prisma.macro.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: data.bookId,
        },
      },
    })

    if (existingMacro) {
      return NextResponse.json({ error: 'この書籍には既にMacroが存在します' }, { status: 400 })
    }

    // ReadingLogの所有確認
    if (data.readingLogIds && data.readingLogIds.length > 0) {
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
    }

    // Mesoの所有確認
    if (data.mesoIds && data.mesoIds.length > 0) {
      const mesos = await prisma.meso.findMany({
        where: {
          id: { in: data.mesoIds },
          userId,
          bookId: data.bookId,
        },
      })

      if (mesos.length !== data.mesoIds.length) {
        return NextResponse.json({ error: '一部のMesoが見つかりません' }, { status: 404 })
      }
    }

    // MacroItemの作成
    const items: any[] = []
    let order = 0

    if (data.readingLogIds) {
      data.readingLogIds.forEach((readingLogId) => {
        items.push({
          readingLogId,
          order: order++,
        })
      })
    }

    if (data.mesoIds) {
      data.mesoIds.forEach((mesoId) => {
        items.push({
          mesoId,
          order: order++,
        })
      })
    }

    // Macro作成
    const macro = await prisma.macro.create({
      data: {
        userId,
        bookId: data.bookId,
        title: data.title,
        content: data.content,
        items: {
          create: items,
        },
      },
      include: {
        book: true,
        items: {
          include: {
            readingLog: true,
            meso: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json({ macro }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create macro error:', error)
    return NextResponse.json({ error: 'Macroの作成に失敗しました' }, { status: 500 })
  }
}
