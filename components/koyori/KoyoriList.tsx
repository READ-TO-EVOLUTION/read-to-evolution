'use client'

import { useState } from 'react'
import Link from 'next/link'

type Koyori = {
  id: string
  title: string
  memo: string | null
  updatedAt: string
  _count?: {
    items: number
  }
}

type KoyoriListProps = {
  koyoris: Koyori[]
  nextCursor: string | null
  onLoadMore?: (cursor: string) => void
}

export default function KoyoriList({ koyoris, nextCursor, onLoadMore }: KoyoriListProps) {
  const [loading, setLoading] = useState(false)

  const handleLoadMore = async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      await onLoadMore?.(nextCursor)
    } finally {
      setLoading(false)
    }
  }

  if (koyoris.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 mb-4">こよりがまだありません</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {koyoris.map((koyori) => (
          <Link
            key={koyori.id}
            href={`/koyori/${koyori.id}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
          >
            <h2 className="font-semibold text-gray-900 mb-2">{koyori.title}</h2>
            {koyori.memo && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{koyori.memo}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{koyori._count?.items || 0}件の断片</span>
              <span>{new Date(koyori.updatedAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </Link>
        ))}
      </div>

      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? '読み込み中...' : 'さらに読み込む'}
          </button>
        </div>
      )}
    </div>
  )
}
