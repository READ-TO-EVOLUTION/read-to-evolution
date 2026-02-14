'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Book = {
  id: string
  title: string
}

type Gift = {
  id: string
  purchaseUrl: string
  message: string | null
  book: Book // bookId必須なのでbookも必須
}

export default function PublicGiftPage() {
  const params = useParams()
  // [slug]に統一したので、slugパラメータからgiftTokenを取得（実際にはgiftTokenが渡される）
  const giftToken = params.slug as string

  const [gift, setGift] = useState<Gift | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGift()
  }, [giftToken])

  const fetchGift = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/gifts/${giftToken}`)
      if (res.ok) {
        const data = await res.json()
        setGift(data.gift)
      } else if (res.status === 404) {
        setError('ギフトが見つかりません')
      } else {
        setError('ギフトの取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch gift:', err)
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleOutboundClick = async () => {
    if (!gift) return

    try {
      await fetch(`/api/gifts/${giftToken}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'OUTBOUND_CLICKED' }),
      })
    } catch (err) {
      console.error('Failed to log outbound click:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
          <p className="text-gray-600">{error || 'ギフトが見つかりません'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {gift.book.title}
            </h2>
          </div>

          {gift.message && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{gift.message}</p>
            </div>
          )}

          <div className="mb-6">
            <a
              href={gift.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOutboundClick}
              className="block w-full bg-pink-600 text-white text-center py-4 rounded-lg hover:bg-pink-700 transition font-medium text-lg"
            >
              購入ページへ
            </a>
          </div>

          <p className="text-xs text-gray-500 text-center">
            このリンクをクリックすると、購入ページに移動します
          </p>
        </div>
      </div>
    </div>
  )
}
