import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createReadingLogSchema = z.object({
  bookId: z.string(),
  rangeType: z.enum(['PAGE', 'CHAPTER', 'FREE']),
  rangeText: z.string().min(1),
  pointText: z.string().min(30).max(80),
  reaction: z.string().min(1),
  nounTags: z.array(z.string()).max(3).optional(),
  verbTags: z.array(z.string()).max(2).optional(),
  questionText: z.string().optional(),
  privateMemo: z.string().optional(),
  highlightText: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PARTIAL', 'PUBLIC']).default('PRIVATE'),
})

const updateReadingLogSchema = createReadingLogSchema.partial()

/**
 * ReadingLog一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId }
    if (bookId) {
      where.bookId = bookId
    }

    const readingLogs = await prisma.readingLog.findMany({
      where,
      include: {
        book: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.readingLog.count({ where })

    return NextResponse.json({
      readingLogs,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get reading logs error:', error)
    return NextResponse.json({ error: 'ReadingLog一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * ReadingLog作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createReadingLogSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // Tagの作成または取得（正規化）
    const tagIds: string[] = []
    
    if (data.nounTags && data.nounTags.length > 0) {
      for (const tagLabel of data.nounTags) {
        let tag = await prisma.tag.findFirst({
          where: { type: 'NOUN', label: tagLabel },
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { type: 'NOUN', label: tagLabel },
          })
        }
        tagIds.push(tag.id)
      }
    }
    
    if (data.verbTags && data.verbTags.length > 0) {
      for (const tagLabel of data.verbTags) {
        let tag = await prisma.tag.findFirst({
          where: { type: 'VERB', label: tagLabel },
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { type: 'VERB', label: tagLabel },
          })
        }
        tagIds.push(tag.id)
      }
    }

    // ReadingLog作成
    const readingLog = await prisma.readingLog.create({
      data: {
        userId,
        bookId: data.bookId,
        rangeType: data.rangeType,
        rangeText: data.rangeText,
        pointText: data.pointText,
        reaction: data.reaction,
        questionText: data.questionText,
        privateMemo: data.privateMemo,
        highlightText: data.highlightText,
        visibility: data.visibility,
        tags: {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        book: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ readingLog }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create reading log error:', error)
    return NextResponse.json({ error: 'ReadingLogの作成に失敗しました' }, { status: 500 })
  }
}
