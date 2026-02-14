import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { validateVolumeImageLimit, ImageType } from '@/lib/study-volume-limit'
import { recordOcrUsage } from '@/lib/ocr-usage'
import { z } from 'zod'

const createOcrAssetSchema = z.object({
  bookId: z.string(),
  imageUrl: z.string().url(),
  extractedText: z.string(),
  pageNo: z.number().int().optional(),
  type: z.enum(['PROBLEM', 'EXPLANATION', 'REFERENCE']).optional(), // 種別（勉強コース用）
  tags: z.string().optional(), // JSON文字列（メタ情報）
})

/**
 * OCRアセット一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const type = searchParams.get('type') as ImageType | null

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

    // OCRアセット一覧取得
    const where: any = {
      userId,
      bookId,
    }

    // 種別でフィルタ（tagsフィールドから判定）
    if (type) {
      // tagsフィールドに { type: 'PROBLEM' | 'EXPLANATION' | 'REFERENCE' } が含まれるものを検索
      // SQLiteではJSON検索が難しいため、全件取得後にフィルタリング
    }

    const ocrAssets = await prisma.oCRAsset.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 種別でフィルタリング（tagsから判定）
    let filteredAssets = ocrAssets
    if (type) {
      filteredAssets = ocrAssets.filter((asset) => {
        if (!asset.tags) return type === 'REFERENCE' // デフォルトはREFERENCE
        try {
          const tags = JSON.parse(asset.tags) as { type?: string }
          return tags.type === type
        } catch {
          return type === 'REFERENCE'
        }
      })
    }

    return NextResponse.json({ ocrAssets: filteredAssets })
  } catch (error) {
    console.error('Get OCR assets error:', error)
    return NextResponse.json({ error: 'OCRアセット一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * OCRアセット作成（画像＋OCRテキスト）
 * データ量制御を実装
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createOcrAssetSchema.parse(body)

    // 書籍の所有確認（UserBookで所有確認）
    // 注意: Bookは共有マスタのため、Book.userIdでは所有確認できない
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId: data.bookId },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // ユーザーのプラン確認（勉強コースかどうか）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    // 勉強コースの場合のみデータ量制御
    const isStudyCourse = user?.plan && user.plan !== 'FREE'
    const imageType: ImageType = data.type || 'REFERENCE'

    if (isStudyCourse) {
      // データ量制御チェック
      const validation = await validateVolumeImageLimit(userId, data.bookId, imageType)

      if (!validation.allowed) {
        return NextResponse.json(
          {
            error: validation.reason || '画像枚数上限に達しています',
            code: 'VOLUME_IMAGE_LIMIT_EXCEEDED',
          },
          { status: 403 }
        )
      }

      // 警告がある場合は後でレスポンスに含める
    }

    // tagsフィールドに種別を保存（JSON形式）
    const tags = data.tags
      ? data.tags
      : JSON.stringify({
          type: imageType,
        })

    // OCRアセット作成
    const ocrAsset = await prisma.oCRAsset.create({
      data: {
        userId,
        bookId: data.bookId,
        imageUrl: data.imageUrl,
        extractedText: data.extractedText,
        pageNo: data.pageNo,
        tags,
      },
    })

    // OCR従量課金の記録（文字数と画像枚数）
    // 注意: extractedTextは外部公開しない（PII保護）
    await recordOcrUsage(
      userId,
      data.extractedText.length,
      1 // 画像1枚
    ).catch((error) => {
      // 記録失敗は無視（課金記録は任意のため）
      console.error('Failed to record OCR usage:', error)
    })

    return NextResponse.json(
      {
        ocrAsset,
        warning: isStudyCourse && (await validateVolumeImageLimit(userId, data.bookId, imageType)).warning
          ? '1冊あたりの画像枚数が1,200枚を超えています。整理を推奨します。'
          : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create OCR asset error:', error)
    return NextResponse.json({ error: 'OCRアセットの作成に失敗しました' }, { status: 500 })
  }
}
