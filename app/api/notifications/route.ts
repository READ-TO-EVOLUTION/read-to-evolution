import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { markAllNotificationsAsRead } from '@/lib/notification-service'

// 通知一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        studyRecord: {
          include: {
            book: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 未読数も返す
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: '通知一覧の取得に失敗しました' }, { status: 500 })
  }
}

// すべての通知を既読にする
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    await markAllNotificationsAsRead(userId)

    return NextResponse.json({ message: 'すべての通知を既読にしました' })
  } catch (error) {
    console.error('Mark all as read error:', error)
    return NextResponse.json({ error: '既読処理に失敗しました' }, { status: 500 })
  }
}
