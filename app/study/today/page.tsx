'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type StudyRecord = {
  id: string
  book: { id: string; title: string }
  problemAsset: { url: string }
  locationType: string
  locationValue: string
  locationNote?: string | null
  step: number
}

export default function TodayReviewPage() {
  const router = useRouter()
  const [normalReviews, setNormalReviews] = useState<StudyRecord[]>([])
  const [refreshReviews, setRefreshReviews] = useState<StudyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayReviews()
  }, [])

  const fetchTodayReviews = async () => {
    try {
      const res = await fetch('/api/study-records/today')
      const data = await res.json()

      if (res.ok) {
        setNormalReviews(data.normalReviews || [])
        setRefreshReviews(data.refreshReviews || [])
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

  const formatLocation = (record: StudyRecord) => {
    const typeMap: Record<string, string> = {
      page: 'ページ',
      chapter: '章',
      section: '節',
      problem: '問題',
      free: '',
    }
    const typeLabel = typeMap[record.locationType] || ''
    return `${typeLabel}${typeLabel ? ' ' : ''}${record.locationValue}${record.locationNote ? ` (${record.locationNote})` : ''}`
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
          <h1 className="text-3xl font-bold text-gray-900">今日の復習</h1>
          <Link
            href="/books"
            className="text-blue-600 hover:underline"
          >
            教材管理へ
          </Link>
        </div>

        {/* 通常復習 */}
        {normalReviews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              通常復習 ({normalReviews.length}件)
            </h2>
            <div className="space-y-4">
              {normalReviews.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.book.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatLocation(record)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Step {record.step}
                    </p>
                  </div>
                  {record.problemAsset && (
                    <div className="mb-4">
                      <img
                        src={record.problemAsset.url}
                        alt="問題"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  )}
                  <Link
                    href={`/study/review/${record.id}`}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    復習を開始
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 再確認 */}
        {refreshReviews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              再確認 ({refreshReviews.length}件)
            </h2>
            <div className="space-y-4">
              {refreshReviews.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition border-l-4 border-green-500"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.book.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatLocation(record)}
                    </p>
                    <p className="text-xs text-green-600 mt-1 font-semibold">
                      ✓ 卒業済み
                    </p>
                  </div>
                  {record.problemAsset && (
                    <div className="mb-4">
                      <img
                        src={record.problemAsset.url}
                        alt="問題"
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  )}
                  <Link
                    href={`/study/review/${record.id}`}
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    再確認を開始
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 復習がない場合 */}
        {normalReviews.length === 0 && refreshReviews.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              今日の復習はありません
            </p>
            <Link
              href="/books"
              className="text-blue-600 hover:underline"
            >
              教材を登録して復習を始めましょう
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
