import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'
import { evaluateRevenueEligibility, logRevenueShareGateDecision } from '@/lib/revenue-share'

/**
 * スラッグ生成（bookId短縮 + cuid短縮）
 * 例: bookId="clx123456" → "b123-cx5678"
 */
function generateSlug(bookId: string): string {
  const bookIdShort = bookId.substring(0, 4) // cuidの先頭4文字
  const random = Math.random().toString(36).substring(2, 10) // 8文字ランダム
  return `s-${bookIdShort}-${random}`
}

/**
 * 引用文のバリデーション（句読点3つまで or 150字上限）
 */
function validateEvidenceQuote(quote: string): { valid: boolean; error?: string } {
  if (quote.length > 150) {
    return { valid: false, error: '引用は150字以内で入力してください' }
  }
  
  // 句読点（。、）の数をカウント
  const punctuationCount = (quote.match(/[。、]/g) || []).length
  if (punctuationCount > 3) {
    return { valid: false, error: '引用は句読点（。、）が3つまでです' }
  }
  
  return { valid: true }
}

const createSnapshotSchema = z.object({
  bookId: z.string().min(1),
  // 必須フィールド
  questionTitle: z.string().min(1).max(100), // 疑問見出し
  mainPoint: z.string().min(1).max(200), // 主点 1-2行
  myAnswer: z.string().min(1).max(2000), // 自分の答え
  // 任意フィールド
  rating: z.number().int().min(1).max(5).optional(),
  evidenceQuote: z.string().max(150).optional(), // 短い引用（バリデーションは後で）
  citation: z.object({
    bookTitle: z.string(),
    edition: z.string().optional(),
    page: z.string().optional(),
  }).optional(),
  affiliate: z.object({
    provider: z.string(), // AMAZON, RAKUTEN
    url: z.string().url(),
  }).optional(),
  permitted: z.object({
    showComment: z.boolean().default(false),
    showReadDate: z.boolean().default(false),
    showStudyHistory: z.boolean().default(false),
  }).optional(),
  // 公開設定
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  visibility: z.enum(['PRIVATE', 'PARTIAL', 'PUBLIC']).default('PARTIAL'),
})

/**
 * Snapshot一覧取得（自分のみ）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const bookId = searchParams.get('bookId')
    const status = searchParams.get('status')

    const where: any = { ownerUserId: userId }
    if (type) {
      where.type = type
    }
    if (bookId) {
      where.bookId = bookId
    }
    if (status) {
      where.status = status
    }

    const snapshots = await prisma.publishedSnapshot.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn13: true,
          },
        },
        sources: {
          include: {
            readingLog: {
              select: {
                id: true,
                pointText: true,
              },
            },
            studyItem: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Get snapshots error:', error)
    return NextResponse.json({ error: 'Snapshot一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * Snapshot作成・更新（upsert）
 * 新フォーマット対応: publicFieldsに必須フィールドを格納
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const data = createSnapshotSchema.parse(body)

    // 書籍の所有確認（UserBookで所有確認）
    const userBook = await prisma.userBook.findFirst({
      where: { userId, bookId: data.bookId },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 書籍情報を取得（citation用）
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
      select: {
        id: true,
        title: true,
        author: true,
        isbn13: true,
      },
    })

    if (!book) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // evidenceQuoteのバリデーション
    if (data.evidenceQuote) {
      const validation = validateEvidenceQuote(data.evidenceQuote)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // publicFieldsの構築（新フォーマット）
    const publicFieldsData = {
      rating: data.rating || 5,
      questionTitle: data.questionTitle,
      mainPoint: data.mainPoint,
      myAnswer: data.myAnswer,
      evidenceQuote: data.evidenceQuote || null,
      citation: data.citation || {
        bookTitle: book.title,
        edition: null,
        page: null,
      },
      affiliate: data.affiliate || null,
      permitted: data.permitted || {
        showComment: false,
        showReadDate: false,
        showStudyHistory: false,
      },
    }

    // publicTitleとpublicTextの生成（SEO用）
    const publicTitle = `${data.questionTitle} - ${book.title}`
    const publicText = `${data.mainPoint} ${data.myAnswer.substring(0, 100)}...`.substring(0, 180)

    // 既存Snapshotの確認（bookId + ownerUserIdで1件のみ）
    const existingSnapshot = await prisma.publishedSnapshot.findFirst({
      where: {
        ownerUserId: userId,
        bookId: data.bookId,
        type: 'MICRO', // 新フォーマットはMICROとして扱う
      },
    })

    // スラッグ生成（既存Snapshotがある場合は再利用、ない場合は新規生成）
    let slug: string
    if (existingSnapshot) {
      slug = existingSnapshot.slug
    } else {
      // スラッグ生成（衝突チェック）
      let attempts = 0
      const MAX_ATTEMPTS = 5
      let generatedSlug: string | null = null
      while (attempts < MAX_ATTEMPTS) {
        generatedSlug = generateSlug(data.bookId)
        const existing = await prisma.publishedSnapshot.findUnique({
          where: { slug: generatedSlug },
        })
        if (!existing) {
          slug = generatedSlug
          break
        }
        attempts++
      }
      if (attempts >= MAX_ATTEMPTS || !generatedSlug) {
        return NextResponse.json({ error: 'スラッグの生成に失敗しました' }, { status: 500 })
      }
      slug = generatedSlug
    }

    // Snapshot作成・更新（upsert）
    const snapshot = await prisma.publishedSnapshot.upsert({
      where: existingSnapshot ? { id: existingSnapshot.id } : { slug: slug! },
      create: {
        ownerUserId: userId,
        bookId: data.bookId,
        type: 'MICRO', // 新フォーマットはMICROとして扱う
        status: data.status,
        publicTitle,
        publicText,
        publicFields: JSON.stringify(publicFieldsData),
        visibility: data.visibility,
        slug: slug!,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
      update: {
        status: data.status,
        publicTitle,
        publicText,
        publicFields: JSON.stringify(publicFieldsData),
        visibility: data.visibility,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn13: true,
          },
        },
      },
    })

    // 報酬ゲート判定ログ（PUBLISHEDのみ）
    if (snapshot.status === 'PUBLISHED') {
      const eligibility = await evaluateRevenueEligibility(userId)
      await logRevenueShareGateDecision({
        userId,
        snapshotId: snapshot.id,
        source: 'SNAPSHOT_CLICK',
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        metadata: {
          bookId: data.bookId,
          status: snapshot.status,
          plan: eligibility.plan,
          affiliateState: eligibility.affiliateState,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ snapshot }, { status: existingSnapshot ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません', details: error.errors }, { status: 400 })
    }
    console.error('Create/Update snapshot error:', error)
    return NextResponse.json({ error: 'Snapshotの作成・更新に失敗しました' }, { status: 500 })
  }
}
