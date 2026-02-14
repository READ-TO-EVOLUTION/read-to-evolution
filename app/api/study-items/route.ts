import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createStudyItemSchema = z.object({
  bookId: z.string(),
  promptText: z.string().min(1), // 問題文（OCRテキストまたは手入力）
  answerText: z.string().min(1), // 答え
  explanationText: z.string().optional(), // 解説（初期は空でも可）
  referencePage: z.string().optional(), // 基本書のページ参照
})

/**
 * StudyItem一覧取得（自分のみ）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const isGraduated = searchParams.get('isGraduated')

    const where: any = { userId }
    if (bookId) {
      where.bookId = bookId
    }
    if (isGraduated !== null) {
      where.isGraduated = isGraduated === 'true'
    }

    const studyItems = await prisma.studyItem.findMany({
      where,
      include: {
        book: true,
        attempts: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ studyItems })
  } catch (error) {
    console.error('Get study items error:', error)
    return NextResponse.json({ error: 'StudyItem一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * StudyItem作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createStudyItemSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // StudyItem作成
    const studyItem = await prisma.studyItem.create({
      data: {
        userId,
        bookId: data.bookId,
        promptText: data.promptText,
        answerText: data.answerText,
        explanationText: data.explanationText,
        referencePage: data.referencePage,
      },
      include: {
        book: true,
      },
    })

    return NextResponse.json({ studyItem }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create study item error:', error)
    return NextResponse.json({ error: 'StudyItemの作成に失敗しました' }, { status: 500 })
  }
}
