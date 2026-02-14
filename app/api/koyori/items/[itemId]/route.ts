import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

const updateItemSchema = z.object({
  note: z.string().max(500).optional(),
})

/**
 * こよりアイテム更新（noteのみ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const itemId = params.itemId
    const body = await request.json()
    const { note } = updateItemSchema.parse(body)

    // アイテムの所有確認（こより経由）
    const item = await prisma.koyoriItem.findFirst({
      where: { id: itemId },
      include: {
        koyori: {
          select: { userId: true },
        },
      },
    })

    if (!item || item.koyori.userId !== userId) {
      return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 })
    }

    const updated = await prisma.koyoriItem.update({
      where: { id: itemId },
      data: {
        note: note !== undefined ? (note || null) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Update koyori item error:', error)
    return NextResponse.json({ error: 'アイテムの更新に失敗しました' }, { status: 500 })
  }
}

/**
 * こよりアイテム削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const itemId = params.itemId

    // アイテムの所有確認（こより経由）
    const item = await prisma.koyoriItem.findFirst({
      where: { id: itemId },
      include: {
        koyori: {
          select: { userId: true },
        },
      },
    })

    if (!item || item.koyori.userId !== userId) {
      return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 })
    }

    await prisma.koyoriItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'アイテムを削除しました' })
  } catch (error) {
    console.error('Delete koyori item error:', error)
    return NextResponse.json({ error: 'アイテムの削除に失敗しました' }, { status: 500 })
  }
}
