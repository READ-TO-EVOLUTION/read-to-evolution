'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type PublicSnapshot = {
  id: string
  slug: string
  publicTitle: string
  publicText: string
  publicFields: {
    rating: number
    questionTitle: string
    mainPoint: string
    myAnswer: string
    evidenceQuote: string | null
    citation: {
      bookTitle: string
      edition?: string | null
      page?: string | null
    }
    affiliate: {
      provider: string
      url: string
    } | null
    permitted: {
      showComment: boolean
      showReadDate: boolean
      showStudyHistory: boolean
    }
  }
  publishedAt: string | null
  createdAt: string
  book: {
    id: string
    title: string
    author: string | null
    isbn13: string | null
  }
}

export default function PublicSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchPublicSnapshots()
  }, [offset])

  const fetchPublicSnapshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/snapshots/public?limit=${limit}&offset=${offset}`)
      if (res.ok) {
        const data = await res.json()
        setSnapshots(data.snapshots || [])
        setTotal(data.pagination?.total || 0)
      } else {
        const errorData = await res.json()
        setError(errorData.error || '公開Snapshotの取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch public snapshots:', err)
      setError('公開Snapshotの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading && snapshots.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">みんなのレビュー</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-blue-600 hover:underline"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="text-green-600 hover:underline"
            >
              新規登録
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {snapshots.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              まだ公開レビューがありません
            </p>
            <Link
              href="/register"
              className="text-blue-600 hover:underline"
            >
              新規登録して最初のレビューを投稿しましょう
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              全{total}件のレビュー
            </div>
            <div className="space-y-6">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="bg-white rounded-lg shadow p-6">
                  {/* 書籍情報 */}
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {snapshot.book.title}
                    </h2>
                    {snapshot.book.author && (
                      <p className="text-sm text-gray-600">{snapshot.book.author}</p>
                    )}
                    <div className="text-sm text-yellow-600 mt-1">
                      {'★'.repeat(snapshot.publicFields.rating)}{'☆'.repeat(5 - snapshot.publicFields.rating)}
                    </div>
                  </div>

                  {/* 疑問見出し */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {snapshot.publicFields.questionTitle}
                    </h3>
                  </div>

                  {/* 主点 */}
                  <div className="mb-4 bg-blue-50 p-3 rounded">
                    <div className="text-xs font-semibold text-blue-700 mb-1">主点</div>
                    <div className="text-sm text-gray-700">{snapshot.publicFields.mainPoint}</div>
                  </div>

                  {/* 自分の答え */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-1">自分の答え</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{snapshot.publicFields.myAnswer}</div>
                  </div>

                  {/* 根拠（引用） */}
                  {snapshot.publicFields.evidenceQuote && (
                    <div className="mb-4 bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                      <div className="text-xs font-semibold text-purple-700 mb-1">根拠</div>
                      <div className="text-sm italic text-gray-700">"{snapshot.publicFields.evidenceQuote}"</div>
                    </div>
                  )}

                  {/* 引用元 */}
                  {snapshot.publicFields.citation && (
                    <div className="mb-4 text-xs text-gray-500">
                      <div>引用元: {snapshot.publicFields.citation.bookTitle}</div>
                      {snapshot.publicFields.citation.edition && (
                        <div>版: {snapshot.publicFields.citation.edition}</div>
                      )}
                      {snapshot.publicFields.citation.page && (
                        <div>ページ: {snapshot.publicFields.citation.page}</div>
                      )}
                    </div>
                  )}

                  {/* 許可した情報 */}
                  {snapshot.publicFields.permitted.showReadDate && snapshot.publishedAt && (
                    <div className="mb-2 text-xs text-gray-500">
                      読んだ日: {new Date(snapshot.publishedAt).toLocaleDateString('ja-JP')}
                    </div>
                  )}

                  {/* 購入リンク（サーバー側リダイレクト経由） */}
                  {snapshot.publicFields.affiliate && (
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={`/out/snapshot/${snapshot.id}?to=${encodeURIComponent(snapshot.publicFields.affiliate.url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700 transition font-medium text-sm"
                      >
                        {snapshot.publicFields.affiliate.provider === 'AMAZON' ? 'Amazonで購入' : '楽天で購入'}
                      </a>
                    </div>
                  )}

                  {/* 個別ページへのリンク */}
                  <div className="mt-2 text-xs text-gray-400">
                    <Link href={`/s/${snapshot.slug}`} className="hover:underline">
                      詳細を見る →
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                    {snapshot.publishedAt ? new Date(snapshot.publishedAt).toLocaleDateString('ja-JP') : new Date(snapshot.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            <div className="mt-6 flex justify-center gap-4">
              {offset > 0 && (
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  前へ
                </button>
              )}
              {offset + limit < total && (
                <button
                  onClick={() => setOffset(offset + limit)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  次へ
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
