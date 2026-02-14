'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Notification = {
  id: string
  type: string
  title: string
  isRead: boolean
  nextReviewAt: string
  createdAt: string
  studyRecord?: {
    id: string
    book: {
      title: string
    }
  } | null
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } else {
        if (res.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })

      if (res.ok) {
        // ローカル状態を更新
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        
        // ヘッダーの未読数も更新
        if (typeof window !== 'undefined' && (window as any).updateUnreadCount) {
          ;(window as any).updateUnreadCount()
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
      })

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
        
        // ヘッダーの未読数も更新
        if (typeof window !== 'undefined' && (window as any).updateUnreadCount) {
          ;(window as any).updateUnreadCount()
        }
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setMarkingAll(false)
    }
  }

  const getTypeLabel = (type: string) => {
    if (type === 'review_refresh') {
      return '再確認'
    }
    return '通常復習'
  }

  const getTypeColor = (type: string) => {
    if (type === 'review_refresh') {
      return 'bg-green-100 text-green-800 border-green-300'
    }
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">通知</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                未読: {unreadCount}件
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                {markingAll ? '処理中...' : 'すべて既読にする'}
              </button>
            )}
            <Link
              href="/study/today"
              className="text-blue-600 hover:underline"
            >
              今日の復習へ
            </Link>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">通知がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition border-l-4 ${
                  notification.isRead
                    ? 'border-gray-300 opacity-75'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded border ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      次回復習: {new Date(notification.nextReviewAt).toLocaleString('ja-JP')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString('ja-JP')}
                    </p>
                    {notification.studyRecord && (
                      <Link
                        href={`/study/review/${notification.studyRecord.id}`}
                        className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                      >
                        復習を開始 →
                      </Link>
                    )}
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                    >
                      既読
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
