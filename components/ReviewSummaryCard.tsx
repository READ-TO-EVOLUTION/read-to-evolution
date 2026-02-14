'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ReviewSummary = {
  bookId: string
  avgRating: number
  publicReviewCount: number
  snippets: Array<{
    reviewId: string
    displayName: string
    rating: number
    comment: string
    hasSpoiler: boolean
    createdAt: string
  }>
}

type ReviewSummaryCardProps = {
  bookId: string
  includeSpoilers?: boolean
}

export default function ReviewSummaryCard({ bookId, includeSpoilers = false }: ReviewSummaryCardProps) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [bookId, includeSpoilers])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/books/${bookId}/review-summary?includeSpoilers=${includeSpoilers ? '1' : '0'}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Failed to fetch review summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">レビューを読み込み中...</div>
      </div>
    )
  }

  if (!summary || summary.publicReviewCount === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">まだ公開レビューがありません</div>
        <Link
          href={`/books/${bookId}/review`}
          className="text-sm text-blue-600 hover:underline"
        >
          最初のレビューを書く →
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            ★ {summary.avgRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-600">
            ({summary.publicReviewCount}件)
          </span>
        </div>
        <Link
          href={`/books/${bookId}/review`}
          className="text-sm text-blue-600 hover:underline"
        >
          もっと見る →
        </Link>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700 mb-2">みんなのひとこと</div>
        {summary.snippets.map((snippet) => (
          <div key={snippet.reviewId} className="text-sm text-gray-700 border-l-2 border-gray-200 pl-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">{snippet.displayName}</span>
              <span className="text-xs">★{snippet.rating}</span>
            </div>
            <div className="line-clamp-2">{snippet.comment}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
