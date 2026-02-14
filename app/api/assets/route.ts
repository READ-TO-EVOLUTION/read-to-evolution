import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createAssetSchema = z.object({
  bookId: z.string(),
  materialId: z.string().optional(),
  type: z.enum(['problem', 'answer', 'explanation', 'pdf', 'zip']),
  url: z.string().url(),
})

/**
 * アセット（画像/PDF等）の登録
 * 実際の実装では、ファイルアップロード処理が必要
 * ここではURLを受け取る形式
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createAssetSchema.parse(body)

    // 書籍の所有確認
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, userId },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // アセット作成
    const asset = await prisma.asset.create({
      data: {
        userId,
        bookId: data.bookId,
        materialId: data.materialId,
        type: data.type,
        url: data.url,
      },
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create asset error:', error)
    return NextResponse.json({ error: 'アセットの登録に失敗しました' }, { status: 500 })
  }
}
