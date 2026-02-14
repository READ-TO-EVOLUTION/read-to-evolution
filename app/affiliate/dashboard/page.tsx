'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PaywallModal from '@/components/PaywallModal'

type AffiliateState = {
  affiliateState: string
  affiliatePlanType: string
  requiresPaywall: boolean
}

type GiftEvent = {
  id: string
  type: string
  createdAt: string
  gift: {
    id: string
    purchaseUrl: string
    book: {
      title: string
    } // bookId必須なのでbookも必須
  }
}

type KPI = {
  created: number
  opened: number
  outboundClicked: number
  registered: number
  subscribed: number
  openRate: number
  outboundCTR: number
  subscribeRate: number
}

export default function AffiliateDashboardPage() {
  const router = useRouter()
  const [state, setState] = useState<AffiliateState | null>(null)
  const [events, setEvents] = useState<GiftEvent[]>([])
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    fetchState()
    fetchEvents()
  }, [])

  const fetchState = async () => {
    try {
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data = await res.json()
        setState(data)
        if (data.requiresPaywall) {
          setShowPaywall(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch affiliate state:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/gift-events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setKpi(data.kpi || null)
      } else if (res.status === 403) {
        // Paywall
        const data = await res.json()
        if (data.requiresPaywall) {
          setShowPaywall(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const handleOptIn = async () => {
    try {
      const res = await fetch('/api/affiliate/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'ENABLE_AFFILIATE',
          source: 'DASHBOARD',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.requiresCheckout) {
          if (data.checkoutUrl) {
            // Stripe Checkoutに遷移
            window.location.href = data.checkoutUrl
          } else {
            alert('決済URLの取得に失敗しました。実装ミスの可能性があります。')
          }
        } else {
          // STUDY_SUBの場合は即ON
          fetchState()
          fetchEvents()
          setShowPaywall(false)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '有効化に失敗しました')
      }
    } catch (error) {
      console.error('Failed to opt-in:', error)
      alert('有効化に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!state || state.requiresPaywall) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">報酬ダッシュボード</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">
                アフィリエイト機能を有効にする必要があります
              </p>
            </div>
          </div>
        </div>
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => {
            setShowPaywall(false)
            router.push('/settings/affiliate')
          }}
          onConfirm={handleOptIn}
          isStudySubscriber={state?.affiliatePlanType === 'STUDY_SUB'}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">報酬ダッシュボード</h1>

        {/* サマリー */}
        {kpi && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">今月のクリック数</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.outboundClicked}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">今月の登録数</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.registered}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">今月の購読数</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.subscribed}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">開封率</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.openRate.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* トップギフト */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">トップギフト</h2>
          <p className="text-sm text-gray-500">
            <Link href="/gifts" className="text-blue-600 hover:underline">
              ギフト一覧
            </Link>
            から詳細を確認できます
          </p>
        </div>

        {/* 履歴 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">直近の成果イベント</h2>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">イベントがありません</p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 20).map((event) => (
                <div key={event.id} className="border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{event.type}</span>
                      <span className="text-gray-600 ml-2">
                        - {event.gift.book.title}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(event.createdAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
