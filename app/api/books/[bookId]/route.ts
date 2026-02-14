import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

// Book（共有マスタ）のフィールドは、このAPIでは編集禁止
const forbiddenBookFields = [
  'title',
  'author',
  'isbn13',
  'publisher',
  'publishedDate',
  'coverImageUrl',
] as const

// UserBook更新用スキーマ（編集可能：statusのみ）
const updateUserBookSchema = z.object({
  status: z.enum(['TSUNDOKU', 'READING', 'FINISHED', 'PAUSED']).optional(),
})

/**
 * ユーザー本棚（UserBook）更新
 * PUT /api/books/[bookId] は bookId を受け取り、更新対象は UserBook
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const bookId = params.bookId
    const body = await request.json().catch(() => ({}))

    // Bookのフィールドが送られていないかチェック（事故防止）
    const hasForbiddenField = forbiddenBookFields.some((field) => field in body)
    if (hasForbiddenField) {
      return NextResponse.json(
        { error: 'この項目（Bookマスタ情報）は編集できません' },
        { status: 400 }
      )
    }

    // UserBook更新用スキーマでバリデーション
    const data = updateUserBookSchema.parse(body)

    // 所有確認（UserBook）
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId,
      },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // 更新データ（undefinedは無視）
    const updateData: {
      status?: 'TSUNDOKU' | 'READING' | 'FINISHED' | 'PAUSED'
    } = {}
    if (data.status !== undefined) {
      updateData.status = data.status
    }

    // Bodyが空の場合は、現在のUserBookをそのまま返す
    if (Object.keys(updateData).length === 0) {
      const current = await prisma.userBook.findUnique({
        where: { id: userBook.id },
        include: { book: true },
      })
      return NextResponse.json({ userBook: current })
    }

    // UserBook更新
    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBook.id },
      data: updateData,
      include: { book: true },
    })

    return NextResponse.json({ userBook: updatedUserBook })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }

    console.error('Update user book error:', error)
    return NextResponse.json({ error: '本棚の更新に失敗しました' }, { status: 500 })
  }
}

/**
 * ユーザー本棚（UserBook）削除
 * DELETE /api/books/[bookId] は bookId を受け取り、UserBook と関連データを削除
 * Bookマスタは削除しない（共有マスタのため）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const bookId = params.bookId

    // 所有確認（UserBook）
    const userBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId,
      },
    })

    if (!userBook) {
      return NextResponse.json({ error: '書籍が見つかりません' }, { status: 404 })
    }

    // Transactionで関連データを削除（子→親の順）
    const result = await prisma.$transaction(async (tx) => {
      const deletedCounts: Record<string, number> = {}

      // 1. ReadingLog（KoyoriItem/MesoItem/MacroItem/SnapshotSource/ReadingLogTagが参照）
      const readingLogResult = await tx.readingLog.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.readingLog = readingLogResult.count

      // 2. OCRAsset（KoyoriItemが参照）
      const ocrAssetResult = await tx.oCRAsset.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.ocrAsset = ocrAssetResult.count

      // 3. StudyItem（StudyAttempt/SnapshotSourceが参照）
      const studyItemResult = await tx.studyItem.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.studyItem = studyItemResult.count

      // 4. PublishedSnapshot（ownerUserId + bookId、SnapshotSourceが参照）
      const snapshotResult = await tx.publishedSnapshot.deleteMany({
        where: { ownerUserId: userId, bookId },
      })
      deletedCounts.publishedSnapshot = snapshotResult.count

      // 5. Review（ReviewEvolutionLog/RevenueShareが参照）
      const reviewResult = await tx.review.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.review = reviewResult.count

      // 6. ReadingProgress
      const readingProgressResult = await tx.readingProgress.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.readingProgress = readingProgressResult.count

      // 7. Material（Asset/StudyRecordが参照）
      const materialResult = await tx.material.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.material = materialResult.count

      // 8. Asset（OcrText/StudyRecordが参照）
      // ※ OcrTextはuserIdなしだが、Asset削除でCASCADEされるので明示削除しない
      const assetResult = await tx.asset.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.asset = assetResult.count

      // 9. StudyRecord（ReviewSchedule/ReviewLog/Notificationが参照）
      const studyRecordResult = await tx.studyRecord.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.studyRecord = studyRecordResult.count

      // 10. Meso（MesoItem/MacroItemが参照）
      const mesoResult = await tx.meso.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.meso = mesoResult.count

      // 11. Macro（MacroItemが参照）
      const macroResult = await tx.macro.deleteMany({
        where: { userId, bookId },
      })
      deletedCounts.macro = macroResult.count

      // 12. Gift（senderUserId + bookId、GiftEventが参照）
      // 注意: 受取側データは消さない（senderUserIdスコープのみ）
      const giftResult = await tx.gift.deleteMany({
        where: { senderUserId: userId, bookId },
      })
      deletedCounts.gift = giftResult.count

      // 13. UserBook（最後）
      const deletedUserBook = await tx.userBook.delete({
        where: { id: userBook.id },
        include: { book: true },
      })

      return {
        userBook: deletedUserBook,
        counts: deletedCounts,
      }
    })

    return NextResponse.json({ ok: true, deleted: result })
  } catch (error) {
    console.error('Delete user book error:', error)
    return NextResponse.json({ error: '本棚からの削除に失敗しました' }, { status: 500 })
  }
}
