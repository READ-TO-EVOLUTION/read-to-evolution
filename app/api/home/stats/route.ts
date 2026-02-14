import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { startOfDay, endOfDay, subDays } from 'date-fns'

/**
 * ホーム画面用の統計情報を取得
 * - 今日の復習数
 * - 未記入ログ数（今日作成すべきReadingLogがない本の数）
 * - 連続学習日数（streak）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    // 1. 今日の復習数（通常復習 + 再確認）
    const normalSchedules = await prisma.reviewSchedule.count({
      where: {
        studyRecord: {
          userId,
          state: 'active',
          step: {
            gte: 3,
          },
        },
        reviewType: 'normal',
        nextReviewAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    const refreshSchedules = await prisma.reviewSchedule.count({
      where: {
        studyRecord: {
          userId,
          state: 'mastered',
        },
        reviewType: 'refresh',
        nextReviewAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    const todayReviewCount = normalSchedules + refreshSchedules

    // 2. 未記入ログ数（登録されている本のうち、今日ReadingLogを作成していない本の数）
    const booksWithLogsToday = await prisma.readingLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        bookId: true,
      },
      distinct: ['bookId'],
    })

    const totalBooks = await prisma.book.count({
      where: {
        readingLogs: {
          some: {
            userId,
          },
        },
      },
    })

    const unloggedBooksCount = Math.max(0, totalBooks - booksWithLogsToday.length)

    // 3. 連続学習日数（streak）
    // 過去のReadingLogまたはReviewLogの作成日を確認
    let streak = 0
    let checkDate = todayStart

    while (true) {
      const dayStart = startOfDay(checkDate)
      const dayEnd = endOfDay(checkDate)

      // その日にReadingLogまたはReviewLogがあるか確認
      const readingLogExists = await prisma.readingLog.count({
        where: {
          userId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        take: 1,
      })

      const reviewLogExists = await prisma.reviewLog.count({
        where: {
          studyRecord: {
            userId,
          },
          at: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        take: 1,
      })

      if (readingLogExists > 0 || reviewLogExists > 0) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        // 今日はまだカウントしない（今日の活動はこれから）
        if (checkDate.getTime() === todayStart.getTime()) {
          break
        }
        // 昨日以前で途切れた場合は終了
        break
      }

      // 無限ループ防止（最大365日まで）
      if (streak >= 365) break
    }

    return NextResponse.json({
      todayReviewCount,
      unloggedBooksCount,
      streak,
    })
  } catch (error) {
    console.error('Get home stats error:', error)
    return NextResponse.json({ error: '統計情報の取得に失敗しました' }, { status: 500 })
  }
}
