import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createStudyRecordSchema = z.object({
  bookId: z.string(),
  materialId: z.string().optional(),
  problemAssetId: z.string(),
  answerAssetId: z.string().optional(),
  explanationAssetId: z.string().optional(),
  memoText: z.string().optional(),
  locationType: z.enum(['page', 'chapter', 'section', 'problem', 'free']),
  locationValue: z.string().min(1),
  locationNote: z.string().optional(),
})

// 学習記録作成
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createStudyRecordSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 学習記録作成（Step1から開始）
    const studyRecord = await prisma.studyRecord.create({
      data: {
        userId,
        bookId: data.bookId,
        materialId: data.materialId,
        problemAssetId: data.problemAssetId,
        answerAssetId: data.answerAssetId,
        explanationAssetId: data.explanationAssetId,
        memoText: data.memoText,
        locationType: data.locationType,
        locationValue: data.locationValue,
        locationNote: data.locationNote,
        step: 1,
        state: 'active',
        nextReviewAt: new Date(), // Step1は即座に復習可能
      },
      include: {
        book: true,
        problemAsset: true,
      },
    })

    // 初期復習スケジュール作成
    await prisma.reviewSchedule.create({
      data: {
        studyRecordId: studyRecord.id,
        reviewType: 'normal',
        nextReviewAt: new Date(),
      },
    })

    return NextResponse.json({ studyRecord }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create study record error:', error)
    return NextResponse.json({ error: '学習記録の作成に失敗しました' }, { status: 500 })
  }
}
