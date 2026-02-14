'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StickFigure from '@/components/StickFigure'
import { EMOTION_TAGS } from '@/lib/emotion-tags'

type Review = {
  id: string
  book: { id: string; title: string }
  rating: number
  comment: string | null
  searchKeywords: string | null
  favoritePhrase: string | null
  emotionTag: string
  createdAt: string
}

export default function ReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async (q?: string) => {
    try {
      setLoading(true)
      const url = q && q.trim() ? `/api/reviews?q=${encodeURIComponent(q.trim())}` : '/api/reviews'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      } else {
        if (res.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchReviews(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    fetchReviews()
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('レビューを削除しますか？')) return

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchReviews()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      alert('削除に失敗しました')
    }
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">読書レビュー</h1>
          <div className="flex gap-4">
            <Link
              href="/books"
              className="text-blue-600 hover:underline"
            >
              書籍一覧へ
            </Link>
            <Link
              href="/r"
              className="text-purple-600 hover:underline"
            >
              みんなのレビュー
            </Link>
          </div>
        </div>

        {/* 検索ボックス */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索ワード・コメントで検索..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              検索
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                クリア
              </button>
            )}
          </form>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              レビューがありません
            </p>
            <Link
              href="/books"
              className="text-blue-600 hover:underline"
            >
              書籍を登録してレビューを投稿しましょう
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {review.book.title}
                  </h2>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex justify-center">
                  <StickFigure emotionTag={review.emotionTag} size={120} />
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                )}

                {review.favoritePhrase && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">お気に入りの言葉</p>
                    <p className="text-sm italic text-gray-600">
                      "{review.favoritePhrase}"
                    </p>
                  </div>
                )}

                {review.searchKeywords && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">検索ワード</p>
                    <p className="text-sm text-gray-600">{review.searchKeywords}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
