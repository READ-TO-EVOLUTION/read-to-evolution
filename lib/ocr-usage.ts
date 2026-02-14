import { prisma } from './prisma'

/**
 * OCR従量課金のusage記録
 * 月次で集計（userId, year, monthでユニーク）
 */
export async function recordOcrUsage(
  userId: string,
  ocrChars: number,
  imagesCount: number = 1
): Promise<void> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12

  // upsertで月次集計を更新
  await prisma.ocrUsage.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    create: {
      userId,
      year,
      month,
      ocrChars,
      imagesCount,
    },
    update: {
      ocrChars: {
        increment: ocrChars,
      },
      imagesCount: {
        increment: imagesCount,
      },
    },
  })
}

/**
 * OCR usageを取得（月次）
 */
export async function getOcrUsage(
  userId: string,
  year: number,
  month: number
): Promise<{
  ocrChars: number
  imagesCount: number
} | null> {
  const usage = await prisma.ocrUsage.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
  })

  if (!usage) {
    return null
  }

  return {
    ocrChars: usage.ocrChars,
    imagesCount: usage.imagesCount,
  }
}
