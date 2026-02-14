'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import KurokoLottieCharacter from '@/components/character/KurokoLottieCharacter'
import Bookshelf from '@/components/home/Bookshelf'
import StatusBar from '@/components/home/StatusBar'
import Chair from '@/components/home/Chair'
import Desk from '@/components/home/Desk'
import QuickStartButtons from '@/components/home/QuickStartButtons'

import type { EmotionState } from '@/lib/emotion'

type HomeStats = {
  todayReviewCount: number
  unloggedBooksCount: number
  streak: number
}

type Book = {
  id: string
  title: string
  coverImageUrl?: string | null
  readingLogs?: Array<{ createdAt: Date }>
}

/**
 * ホーム画面（学習部屋）
 * コンセプト：自分の学習部屋
 * - 背景：本棚（登録した本の一覧）
 * - 中央：黒子キャラ＋椅子/机（行動誘導）
 * - 上部：今日の状態バー
 * - 下部：クイック開始ボタン
 */
export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string; affiliatePlanType?: string } | null>(null)
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, booksRes] = await Promise.all([
          fetch('/api/home/stats'),
          fetch('/api/books'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (booksRes.ok) {
          const booksData = await booksRes.json()
          setBooks(booksData.books || [])
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error)
      } finally {
        setLoading(false)
      }
    }

    // 認証状態確認
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          // 認証済みなら統計情報と本一覧を取得
          fetchHomeData()
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  // 状態判定：今日やることあり/なし（早期リターンの前に計算）
  const hasTasks = (stats?.todayReviewCount || 0) > 0 || (stats?.unloggedBooksCount || 0) > 0

  // 勉強コースユーザーかどうか（机を表示する条件）
  const isStudySubscriber = user?.affiliatePlanType === 'STUDY_SUB'

  /**
   * ホーム用EmotionState（暫定）
   * - タスクなし：安心(relief) weak
   * - タスクあり：迷い(confused) weak（顔だけ変化）
   * 注意：useMemoは早期リターンの前に配置（Hooksのルール）
   */
  const homeEmotion: EmotionState = useMemo(() => {
    if (!hasTasks) return { emotion: 'relief', intensity: 'weak' }
    return { emotion: 'confused', intensity: 'weak' }
  }, [hasTasks])

  // 未認証の場合はログイン画面へ誘導
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              READ TO EVOLUTION
            </h1>
            <p className="text-xl text-gray-600 mb-2">本から育つ一輪の花</p>
            <p className="text-gray-500">読書レビュー × 学習管理OS</p>
          </div>
          <div className="space-y-4">
            <Link
              href="/r"
              className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition"
            >
              みんなのレビューを見る
            </Link>
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition"
            >
              新規登録
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 relative overflow-hidden">
      {/* 背景：本棚 */}
      <Bookshelf books={books} />

      {/* 上部：状態バー */}
      {stats && (
        <div className="relative z-10">
          <StatusBar
            todayReviewCount={stats.todayReviewCount}
            unloggedBooksCount={stats.unloggedBooksCount}
            streak={stats.streak}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-8 mb-12">
          {/* 黒子キャラ */}
          <div className={`transition-all duration-500 ${hasTasks ? 'scale-110' : 'scale-100'}`}>
            <KurokoLottieCharacter state={homeEmotion} size={220} />
          </div>

          {/* 机（勉強コースユーザー）または椅子（一般ユーザー） */}
          {isStudySubscriber ? (
            <Desk
              onClick={() => {
                if (hasTasks) {
                  router.push('/study/today')
                }
              }}
              isActive={hasTasks}
            />
          ) : (
            <Chair
              onClick={() => {
                if (hasTasks) {
                  router.push('/study/today')
                }
              }}
              isActive={hasTasks}
            />
          )}

          {/* 状態メッセージ */}
          {hasTasks ? (
            <p className="text-lg text-gray-700 font-medium">
              今日やることが {stats?.todayReviewCount || 0}件あります
            </p>
          ) : (
            <div className="text-center">
              <p className="text-lg text-green-600 font-medium mb-2">
                🎉 今日のタスクは完了しました！
              </p>
              <p className="text-sm text-gray-600">
                新しいログを書いて学習を続けましょう
              </p>
            </div>
          )}
        </div>

        {/* 下部：クイック開始ボタン */}
        <QuickStartButtons
          todayReviewCount={stats?.todayReviewCount || 0}
          hasTasks={hasTasks}
        />
      </div>
    </div>
  )
}
