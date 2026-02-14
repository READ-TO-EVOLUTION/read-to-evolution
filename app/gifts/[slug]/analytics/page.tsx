'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PaywallModal from '@/components/PaywallModal'

type GiftEvent = {
  id: string
  type: string
  createdAt: string
  metadata: string | null
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

export default function GiftAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  // [slug]に統一したので、slugパラメータからgiftIdを取得（実際の値は gift.id）
  const giftId = params.slug as string

  const [events, setEvents] = useState<GiftEvent[]>([])
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [affiliateState, setAffiliateState] = useState<{
    affiliateState: string
    affiliatePlanType: string
    requiresPaywall: boolean
  } | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  useEffect(() => {
    fetchAffiliateState()
    fetchAnalytics()
  }, [giftId])

  const fetchAffiliateState = async () => {
    try {
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data = await res.json()
        setAffiliateState(data)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate state:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setAnalyticsError(null)
      const res = await fetch(`/api/gift-events?giftId=${giftId}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setKpi(data.kpi || null)
      } else if (res.status === 403) {
        const data = await res.json()
        if (data.requiresPaywall) {
          setAnalyticsError('AFFILIATE_REQUIRED')
        } else {
          setAnalyticsError('アクセスが拒否されました')
        }
      } else {
        setAnalyticsError('データの取得に失敗しました')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setAnalyticsError('エラーが発生しました')
    } finally {
      setLoading(false)
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
          await fetchAffiliateState()
          await fetchAnalytics()
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
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        </div>
      </div>
    )
  }

  // Paywallが必要な場合（操作した瞬間だけモーダル表示）
  if (analyticsError === 'AFFILIATE_REQUIRED' || (affiliateState && affiliateState.requiresPaywall)) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div className="mb-6">
              <Link
                href="/gifts"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← ギフト一覧に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📊 ギフト分析</h1>
            </div>

            {/* 有効にするカード */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  🔒 成果計測がOFFです
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  成果を確認するには「成果計測をON」にしてください。
                </p>
                <p className="text-xs text-gray-500">
                  （※ テスト決済です）
                </p>
              </div>
              <button
                onClick={() => setShowPaywall(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                成果計測をONにする
              </button>
            </div>
          </div>
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onConfirm={handleOptIn}
          isStudySubscriber={affiliateState?.affiliatePlanType === 'STUDY_SUB'}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/gifts"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← ギフト一覧に戻る
          </Link>
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900">📊 ギフト分析</h1>
            <p className="text-gray-700 mt-2 leading-relaxed">
              このギフト経由で、どれだけ閲覧・反応・購入があったかを確認できます。
            </p>
          </div>
        </div>

        {/* エラー表示 */}
        {analyticsError && analyticsError !== 'AFFILIATE_REQUIRED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{analyticsError}</p>
          </div>
        )}

        {/* KPI */}
        {kpi ? (
          <>
            {kpi.created === 0 && kpi.opened === 0 && kpi.outboundClicked === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  まだ成果データはありません。
                </p>
                <p className="text-sm text-gray-600">
                  このギフトが紹介・購入されると、ここに表示されます。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">作成数</div>
                  <div className="text-2xl font-bold text-gray-900">{kpi.created}</div>
                  <p className="text-xs text-gray-500 mt-1">ギフトが作成された回数（GIFT_CREATED）</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">開封数</div>
                  <div className="text-2xl font-bold text-blue-600">{kpi.opened}</div>
                  <p className="text-xs text-gray-500 mt-1">ギフトページが開かれた回数（GIFT_OPENED）</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">クリック数</div>
                  <div className="text-2xl font-bold text-green-600">
                    {kpi.outboundClicked}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">外部リンク（購入URL）がクリックされた回数（OUTBOUND_CLICKED）</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">開封率</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {kpi.openRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">開封数 ÷ 作成数 × 100</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">CTR</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {kpi.outboundCTR.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">クリック数 ÷ 開封数 × 100</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">登録数</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {kpi.registered}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">このギフト経由で登録された回数（REGISTERED）</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">購読数</div>
                  <div className="text-2xl font-bold text-pink-600">
                    {kpi.subscribed}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">このギフト経由で購読された回数（SUBSCRIBED）</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">購読率</div>
                  <div className="text-2xl font-bold text-red-600">
                    {kpi.subscribeRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">購読数 ÷ 開封数 × 100</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-700 mb-2">
              まだ成果データはありません。
            </p>
            <p className="text-sm text-gray-600">
              このギフトが紹介・購入されると、ここに表示されます。
            </p>
          </div>
        )}

        {/* イベント一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">イベント履歴</h2>
          </div>
          <div className="divide-y">
            {events.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                イベントがありません
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {event.type}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
