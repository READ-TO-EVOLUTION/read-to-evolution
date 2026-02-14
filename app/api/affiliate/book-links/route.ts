import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getUserForAffiliate, isAffiliateOn, isStudySubscriber } from '@/lib/affiliate'

const createBookLinkSchema = z.object({
  bookId: z.string().optional(),
  externalUrl: z.string().url(),
  context: z.enum(['GRADUATION', 'MACRO', 'GIFT', 'OTHER']).optional(),
})

/**
 * 購入URL（報酬付き）生成
 * affiliateState==ON 必須（または STUDY_SUB）
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const { bookId, externalUrl, context } = createBookLinkSchema.parse(body)

    // ガード：affiliateState==ON 必須（または STUDY_SUB）
    const user = await getUserForAffiliate(userId)
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    if (!isAffiliateOn(user) && !isStudySubscriber(user)) {
      return NextResponse.json(
        {
          error: 'AFFILIATE_REQUIRED',
          requiresPaywall: true,
        },
        { status: 403 }
      )
    }

    // TODO: 実際のアフィリエイトURL生成ロジック
    // 現時点では仮のtrackedUrlを返す
    const trackedUrl = externalUrl // TODO: アフィリエイトパラメータ付与

    // オプション：リンク生成ログを保存（将来の分析用）
    // await prisma.affiliateLink.create({ ... })

    return NextResponse.json({
      trackedUrl,
      originalUrl: externalUrl,
      bookId: bookId || null,
      context: context || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Create book link error:', error)
    return NextResponse.json({ error: 'リンクの生成に失敗しました' }, { status: 500 })
  }
}
