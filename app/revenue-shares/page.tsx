'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type RevenueShare = {
  id: string
  userId: string
  reviewId: string | null
  amount: number
  revenueAmount: number
  status: string
  description: string | null
  paidAt: string | null
  createdAt: string
  review: {
    id: string
    book: {
      id: string
      title: string
    }
  } | null
}

export default function RevenueSharesPage() {
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueShares()
  }, [])

  const fetchRevenueShares = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/revenue-shares')
      if (res.ok) {
        const data = await res.json()
        setRevenueShares(data.revenueShares || [])
        setTotalAmount(data.totalAmount || 0)
        setPendingAmount(data.pendingAmount || 0)
      } else if (res.status === 403) {
        alert('有料会員のみ利用可能です')
      }
    } catch (error) {
      console.error('Fetch revenue shares error:', error)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">収益還元</h1>
          <p className="text-gray-600 mt-1">レビュー経由の購入による還元履歴</p>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">支払済み還元額</h2>
            <p className="text-3xl font-bold text-green-600">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-600 mb-2">未払い還元額</h2>
            <p className="text-3xl font-bold text-orange-600">
              ¥{pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 還元履歴 */}
        {revenueShares.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">還元履歴がありません</p>
            <p className="text-gray-500">
              レビュー経由の購入があると、運営収益の10%が還元されます
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">還元履歴</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {revenueShares.map((share) => (
                <div key={share.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            share.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : share.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {share.status === 'paid'
                            ? '支払済み'
                            : share.status === 'pending'
                            ? '未払い'
                            : 'キャンセル'}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ¥{share.amount.toLocaleString()}
                        </span>
                      </div>
                      {share.review && (
                        <p className="text-sm text-gray-600 mb-1">
                          レビュー: {share.review.book.title}
                        </p>
                      )}
                      {share.description && (
                        <p className="text-sm text-gray-500">{share.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(share.createdAt).toLocaleString('ja-JP')}
                        {share.paidAt && (
                          <span className="ml-2">
                            支払い: {new Date(share.paidAt).toLocaleString('ja-JP')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
