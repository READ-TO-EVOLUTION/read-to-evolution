'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type MeResponse = {
  user: { id: string; email: string; planType: string } | null
}

export default function AppHeader() {
  const [user, setUser] = useState<MeResponse['user']>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    // ログイン状態確認
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: MeResponse) => {
        setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const fetchUnreadCount = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications?unreadOnly=false')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // ページ遷移時に未読数を更新
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 10000) // 10秒ごとにポーリング

    return () => clearInterval(interval)
  }, [user]) // userが変わった時も再取得

  // グローバルに未読数更新関数を公開（他のコンポーネントから呼び出し可能）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).updateUnreadCount = fetchUnreadCount
    }
  }, [user])

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link href="/" className="font-bold text-gray-900">
          READ TO EVOLUTION
        </Link>

        {user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/study/today" className="text-gray-700 hover:text-gray-900">
              今日の復習
            </Link>
            <Link href="/books" className="text-gray-700 hover:text-gray-900">
              教材管理
            </Link>
            <Link href="/reviews" className="text-gray-700 hover:text-gray-900">
              レビュー
            </Link>
            <Link href="/notifications" className="relative text-gray-700 hover:text-gray-900">
              通知
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-red-600 text-white rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/revenue-shares" className="text-gray-700 hover:text-gray-900">
              収益還元
            </Link>
            <Link href="/gifts" className="text-gray-700 hover:text-gray-900">
              ギフト
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-700 hover:text-gray-900">
              ログイン
            </Link>
            <Link href="/register" className="text-gray-700 hover:text-gray-900">
              新規登録
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

