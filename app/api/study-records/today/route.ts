import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { startOfDay, endOfDay, subDays } from 'date-fns'

/**
 * 今日の復習一覧を取得
 * 通常復習（Step進行中）と再確認（卒業済み）を分けて返す
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    // 通常復習（active状態で、ReviewScheduleのnextReviewAtが今日、またはnextReviewAtが今日）
    const normalSchedules = await prisma.reviewSchedule.findMany({
      where: {
        studyRecord: {
          userId,
          state: 'active',
          step: {
            gte: 3, // Step3以上のみ
          },
        },
        reviewType: 'normal',
        nextReviewAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        studyRecord: {
          include: {
            book: true,
            problemAsset: true,
            answerAsset: true,
            explanationAsset: true,
          },
        },
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
    })

    // 出題順ルールに基づいてソート
    const normalReviews = await sortByPriority(
      normalSchedules.map((s) => s.studyRecord),
      userId
    )

    // 再確認（mastered状態で、ReviewScheduleのnextReviewAtが今日）
    const refreshSchedules = await prisma.reviewSchedule.findMany({
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
      include: {
        studyRecord: {
          include: {
            book: true,
            problemAsset: true,
            answerAsset: true,
            explanationAsset: true,
          },
        },
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
    })

    // 再確認も同様にソート
    const refreshReviews = await sortByPriority(
      refreshSchedules.map((s) => s.studyRecord),
      userId
    )

    return NextResponse.json({
      normalReviews,
      refreshReviews,
    })
  } catch (error) {
    console.error('Get today reviews error:', error)
    return NextResponse.json({ error: '復習一覧の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * 出題順ルールに基づいてソート
 * 優先順位（強い順）：
 * 1. 前日に復習した問題
 * 2. 答えを出すまでの時間が短い問題
 * 3. 直近で思い出せなかった問題
 * 4. 最終復習日が古い問題
 * 5. 未卒業問題
 * 6. 作成順
 */
async function sortByPriority(
  studyRecords: any[],
  userId: string
): Promise<any[]> {
  const today = new Date()
  const yesterdayStart = startOfDay(subDays(today, 1))
  const yesterdayEnd = endOfDay(subDays(today, 1))

  // 各学習記録の優先度スコアを計算
  const recordsWithPriority = await Promise.all(
    studyRecords.map(async (record) => {
      // 前日の復習ログを取得
      const yesterdayLogs = await prisma.reviewLog.findMany({
        where: {
          studyRecordId: record.id,
          at: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        orderBy: {
          at: 'desc',
        },
        take: 1,
      })

      // 最新の復習ログを取得（答えを出すまでの時間、思い出せなかったか）
      const latestLog = await prisma.reviewLog.findFirst({
        where: {
          studyRecordId: record.id,
        },
        orderBy: {
          at: 'desc',
        },
      })

      // 優先度スコアを計算
      let priority = 0

      // 1. 前日に復習した問題（最高優先度）
      if (yesterdayLogs.length > 0) {
        priority += 1000000
      }

      // 2. 答えを出すまでの時間が短い問題（時間が短いほど優先度が高い）
      // 平均時間を計算（秒単位、短いほど良い）
      const avgTimeLogs = await prisma.reviewLog.findMany({
        where: {
          studyRecordId: record.id,
          answerTimeSeconds: { not: null },
        },
        select: {
          answerTimeSeconds: true,
        },
        take: 5, // 最新5件の平均
      })
      if (avgTimeLogs.length > 0) {
        const avgTime =
          avgTimeLogs.reduce((sum, log) => sum + (log.answerTimeSeconds || 0), 0) /
          avgTimeLogs.length
        // 時間が短いほど優先度が高い（最大100000点）
        priority += Math.max(0, 100000 - avgTime)
      }

      // 3. 直近で思い出せなかった問題（finalResultがwrong）
      if (latestLog?.finalResult === 'wrong') {
        priority += 50000
      }

      // 4. 最終復習日が古い問題（古いほど優先度が高い）
      if (record.lastReviewAt) {
        const daysSinceLastReview = Math.floor(
          (today.getTime() - record.lastReviewAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        priority += Math.min(10000, daysSinceLastReview * 100)
      } else {
        // 復習したことがない場合は最高優先度
        priority += 10000
      }

      // 5. 未卒業問題（active状態）
      if (record.state === 'active') {
        priority += 1000
      }

      // 6. 作成順（新しいほど優先度が高い）
      const daysSinceCreation = Math.floor(
        (today.getTime() - record.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      priority += Math.max(0, 100 - daysSinceCreation)

      return {
        ...record,
        priority,
      }
    })
  )

  // 優先度の高い順にソート
  return recordsWithPriority.sort((a, b) => b.priority - a.priority)
}
