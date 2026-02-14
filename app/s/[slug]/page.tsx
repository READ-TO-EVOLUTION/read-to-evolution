'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function SnapshotDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchSnapshot()
    }
  }, [slug])

  const fetchSnapshot = async () => {
    try {
      setLoading(true)
      setError(null)
      // slugで個別取得APIを呼ぶ
      const res = await fetch(`/api/snapshots/${slug}`)
      if (res.ok) {
        const data = await res.json()
        if (data.snapshot) {
          setSnapshot(data.snapshot)
        } else {
          setError('Snapshotが見つかりません')
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Snapshotの取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch snapshot:', err)
      setError('Snapshotの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-600 mb-4">{error || 'Snapshotが見つかりません'}</p>
          <Link href="/r" className="text-blue-600 hover:underline">
            一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/r" className="text-blue-600 hover:underline text-sm">
            ← 一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {/* 書籍情報 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {snapshot.book.title}
            </h1>
            {snapshot.book.author && (
              <p className="text-sm text-gray-600">{snapshot.book.author}</p>
            )}
            <div className="text-lg text-yellow-600 mt-2">
              {'★'.repeat(snapshot.publicFields.rating)}{'☆'.repeat(5 - snapshot.publicFields.rating)}
            </div>
          </div>

          {/* 疑問見出し */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              {snapshot.publicFields.questionTitle}
            </h2>
          </div>

          {/* 主点 */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-semibold text-blue-700 mb-2">主点</div>
            <div className="text-base text-gray-700">{snapshot.publicFields.mainPoint}</div>
          </div>

          {/* 自分の答え */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-2">自分の答え</div>
            <div className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {snapshot.publicFields.myAnswer}
            </div>
          </div>

          {/* 根拠（引用） */}
          {snapshot.publicFields.evidenceQuote && (
            <div className="mb-6 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <div className="text-sm font-semibold text-purple-700 mb-2">根拠</div>
              <div className="text-base italic text-gray-700">"{snapshot.publicFields.evidenceQuote}"</div>
            </div>
          )}

          {/* 引用元 */}
          {snapshot.publicFields.citation && (
            <div className="mb-6 text-sm text-gray-500 border-t pt-4">
              <div className="font-semibold mb-1">引用元</div>
              <div>{snapshot.publicFields.citation.bookTitle}</div>
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
            <div className="mb-4 text-sm text-gray-500">
              読んだ日: {new Date(snapshot.publishedAt).toLocaleDateString('ja-JP')}
            </div>
          )}

          {/* 購入リンク（サーバー側リダイレクト経由） */}
          {snapshot.publicFields.affiliate && (
            <div className="mt-8 pt-6 border-t">
              <a
                href={`/out/snapshot/${snapshot.id}?to=${encodeURIComponent(snapshot.publicFields.affiliate.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition font-medium"
              >
                {snapshot.publicFields.affiliate.provider === 'AMAZON' ? 'Amazonで購入' : '楽天で購入'}
              </a>
            </div>
          )}

          <div className="mt-6 text-xs text-gray-400 text-center">
            {snapshot.publishedAt ? new Date(snapshot.publishedAt).toLocaleDateString('ja-JP') : new Date(snapshot.createdAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}
