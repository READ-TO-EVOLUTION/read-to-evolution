import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

/**
 * 登録済み解説一覧取得（復習フロー Stage 1用）
 * そのユーザーが過去に登録した解説のみを返す
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const keyword = searchParams.get('keyword') // Stage 2: キーワード検索

    // そのユーザーが登録した解説（explanationTextが存在するStudyItem）
    const where: any = {
      userId,
      explanationText: {
        not: null,
      },
    }

    if (bookId) {
      where.bookId = bookId
    }

    let explanations = await prisma.studyItem.findMany({
      where,
      select: {
        id: true,
        explanationText: true,
        promptText: true, // 問題文（参照用）
        referencePage: true,
        book: {
          select: {
            id: true,
            title: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Stage 2: キーワード検索（OCRテキスト内に含まれる解説のみ）
    if (keyword && keyword.trim().length > 0) {
      const keywordLower = keyword.trim().toLowerCase()
      explanations = explanations.filter((item) => {
        // explanationText内にキーワードが含まれるか
        const explanationMatch = item.explanationText?.toLowerCase().includes(keywordLower)
        // promptText（問題文）内にキーワードが含まれるか
        const promptMatch = item.promptText?.toLowerCase().includes(keywordLower)
        return explanationMatch || promptMatch
      })
    }

    return NextResponse.json({
      explanations: explanations.map((item) => ({
        id: item.id,
        explanationText: item.explanationText,
        problemText: item.promptText, // 問題文（参照用）
        referencePage: item.referencePage,
        book: item.book,
        createdAt: item.createdAt,
      })),
      count: explanations.length,
    })
  } catch (error) {
    console.error('Get explanations error:', error)
    return NextResponse.json({ error: '解説一覧の取得に失敗しました' }, { status: 500 })
  }
}
