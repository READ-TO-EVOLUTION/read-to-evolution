import { prisma } from './prisma'

/**
 * 通知生成サービス
 * 復習スケジュール更新時に通知を作成
 */

export type NotificationType = 'review_normal' | 'review_refresh'

/**
 * 通知を生成
 * @param userId ユーザーID
 * @param studyRecordId 学習記録ID
 * @param reviewType 復習タイプ（normal/refresh）
 * @param nextReviewAt 次回復習日時（重複抑制キーに利用）
 */
export async function createReviewNotification(
  userId: string,
  studyRecordId: string,
  reviewType: 'normal' | 'refresh',
  nextReviewAt: Date
): Promise<void> {
  // 学習記録を取得（書籍名と位置情報を含む）
  const studyRecord = await prisma.studyRecord.findUnique({
    where: { id: studyRecordId },
    include: {
      book: true,
    },
  })

  if (!studyRecord) {
    console.error(`StudyRecord not found: ${studyRecordId}`)
    return
  }

  // タイトル仕様: 「【復習】{bookTitle}｜{location_value}」
  // ※ location_value が空のときだけフォールバック
  const locationValue = (studyRecord.locationValue || '').trim()
  const locationDisplay = locationValue.length > 0 ? locationValue : '（位置未設定）'

  const title = `【復習】${studyRecord.book.title}｜${locationDisplay}`

  // 通知タイプ
  const notificationType: NotificationType =
    reviewType === 'refresh' ? 'review_refresh' : 'review_normal'

  // 重複抑制: 同一 userId で (studyRecordId + type + nextReviewAt) が同じ通知は作らない
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      studyRecordId,
      type: notificationType,
      nextReviewAt,
    },
    select: { id: true },
  })

  if (existing) return

  await prisma.notification.create({
    data: {
      userId,
      studyRecordId,
      type: notificationType,
      title,
      nextReviewAt,
      isRead: false,
    },
  })
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // セキュリティ: 自分の通知のみ更新可能
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
}
