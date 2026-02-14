'use client'

import { useEffect, useState } from 'react'

type PublicReview = {
  id: string
  rating: number
  comment: string | null
  searchKeywords: string | null
  favoritePhrase: string | null
  emotionTag: string
  recommendedBooks: string | null
  hasSpoiler: boolean
  // 構造化フィールド
  buyReason: string | null
  goodPoints: string | null
  missingPoints: string | null
  badPoints: string | null
  readDate: string | null
  pagesRead: number | null
  ocrQuote: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string
  }
  book: {
    id: string
    title: string
    author: string | null
    isbn13: string | null
  }
}

type PublicReviewsListProps = {
  bookId: string
  limit?: number
}

export default function PublicReviewsList({ bookId, limit = 20 }: PublicReviewsListProps) {
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchPublicReviews()
  }, [bookId, limit])

  const fetchPublicReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/reviews/public?bookId=${bookId}&limit=${limit}&offset=0`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setTotal(data.pagination?.total || 0)
      } else {
        const errorData = await res.json()
        setError(errorData.error || '公開レビューの取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch public reviews:', err)
      setError('公開レビューの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">みんなのレビューを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">まだ公開レビューがありません</div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        みんなのレビュー ({total}件)
      </h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {review.user.name}
                </span>
                <span className="text-sm text-yellow-600">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('ja-JP')}
              </span>
            </div>

            {/* 構造化ブロック（優先表示） */}
            <div className="space-y-2 mb-3">
              {review.buyReason && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <span className="font-semibold text-blue-700">買う理由:</span>{' '}
                  <span className="text-gray-700">{review.buyReason}</span>
                </div>
              )}
              {review.goodPoints && (
                <div className="bg-green-50 p-2 rounded text-xs">
                  <span className="font-semibold text-green-700">良かった点:</span>{' '}
                  <span className="text-gray-700">{review.goodPoints}</span>
                </div>
              )}
              {review.missingPoints && (
                <div className="bg-yellow-50 p-2 rounded text-xs">
                  <span className="font-semibold text-yellow-700">足りない点:</span>{' '}
                  <span className="text-gray-700">{review.missingPoints}</span>
                </div>
              )}
              {review.badPoints && (
                <div className="bg-red-50 p-2 rounded text-xs">
                  <span className="font-semibold text-red-700">悪かった点:</span>{' '}
                  <span className="text-gray-700">{review.badPoints}</span>
                </div>
              )}
              {review.ocrQuote && (
                <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400 text-xs">
                  <span className="font-semibold text-purple-700">引用:</span>{' '}
                  <span className="text-gray-700 italic">"{review.ocrQuote}"</span>
                </div>
              )}
              {review.readDate && (
                <div className="text-xs text-gray-500">
                  読んだ日: {new Date(review.readDate).toLocaleDateString('ja-JP')}
                </div>
              )}
              {review.pagesRead && (
                <div className="text-xs text-gray-500">
                  ページ数: {review.pagesRead}ページ
                </div>
              )}
            </div>

            {/* 自由記述（補助） */}
            {review.comment && (
              <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                {review.comment}
              </div>
            )}
            {review.hasSpoiler && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                ネタバレあり
              </div>
            )}
            {review.favoritePhrase && (
              <div className="mt-2 text-xs text-gray-600 italic">
                「{review.favoritePhrase}」
              </div>
            )}
            {review.emotionTag && (
              <div className="mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {review.emotionTag}
                </span>
              </div>
            )}
            {/* 購入リンク（サーバー側リダイレクト経由） */}
            <div className="mt-3 pt-3 border-t">
              <a
                href={`/out/review/${review.id}?to=${encodeURIComponent(`https://www.amazon.co.jp/s?k=${encodeURIComponent(review.book.title)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-600 text-white px-4 py-1 rounded hover:bg-orange-700 transition text-xs font-medium"
              >
                Amazonで購入
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
