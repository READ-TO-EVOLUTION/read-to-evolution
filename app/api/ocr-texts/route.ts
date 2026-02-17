import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'
import { isBetaClosed } from '@/lib/feature-flags'

const createOcrTextSchema = z.object({
  bookId: z.string(),
  assetId: z.string().optional(),
  text: z.string().min(1),
})

const updateOcrTextSchema = z.object({
  text: z.string().min(1),
})

/**
 * OCRテキスト一覧取得（本ごと、検索対応）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const search = searchParams.get('search') // 検索キーワード

    if (!bookId) {
      return NextResponse.json({ error: 'bookIdが必要です' }, { status: 400 })
    }

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // OCRテキスト一覧取得
    const where: any = { bookId }
    if (search) {
      where.text = {
        contains: search,
      }
    }

    const ocrTexts = await prisma.ocrText.findMany({
      where,
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ ocrTexts })
  } catch (error) {
    console.error('Get OCR texts error:', error)
    return NextResponse.json({ error: 'OCRテキスト一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * OCRテキスト作成
 */
export async function POST(request: NextRequest) {
  if (isBetaClosed()) {
    console.warn('[BETA_CLOSED_BLOCK]', request.nextUrl.pathname)
    return NextResponse.json(
      { error: 'Disabled in Beta Closed', code: 'BETA_CLOSED_DISABLED' },
      { status: 403 }
    )
  }

  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createOcrTextSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // Assetの所有確認（指定されている場合）
    if (data.assetId) {
      const asset = await prisma.asset.findFirst({
        where: { id: data.assetId, userId, bookId: data.bookId },
      })

      if (!asset) {
        return NextResponse.json({ error: 'アセットが見つかりません' }, { status: 404 })
      }
    }

    // OCRテキスト作成
    const ocrText = await prisma.ocrText.create({
      data: {
        bookId: data.bookId,
        assetId: data.assetId,
        text: data.text,
      },
      include: {
        asset: true,
      },
    })

    return NextResponse.json({ ocrText }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create OCR text error:', error)
    return NextResponse.json({ error: 'OCRテキストの作成に失敗しました' }, { status: 500 })
  }
}
