'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PaywallModal from '@/components/PaywallModal'
import { isBetaClosedClient } from '@/lib/feature-flags-client'

type AffiliateState = {
  affiliateState: string
  affiliatePlanType: string
  enabledAt: string | null
  suspendedAt: string | null
  suspendedReason: string | null
  requiresPaywall: boolean
}

type StateLog = {
  id: string
  fromState: string
  toState: string
  reason: string
  actorType: string
  createdAt: string
}

export default function AffiliateSettingsPage() {
  const router = useRouter()
  const [state, setState] = useState<AffiliateState | null>(null)
  const [logs, setLogs] = useState<StateLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Beta Closed: Redirect to home (replace to prevent back button)
  useEffect(() => {
    if (isBetaClosedClient()) {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    fetchState()
    fetchLogs()
  }, [])

  const fetchState = async () => {
    try {
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data = await res.json()
        setState(data)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate state:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/affiliate/state-logs?limit=10')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const handleOptIn = async () => {
    setProcessing(true)
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
          setShowPaywall(false)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '有効化に失敗しました')
      }
    } catch (error) {
      console.error('Failed to opt-in:', error)
      alert('有効化に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('アフィリエイト機能を解約しますか？')) return

    try {
      const res = await fetch('/api/affiliate/cancel', {
        method: 'POST',
      })

      if (res.ok) {
        fetchState()
        fetchLogs()
      } else {
        const data = await res.json()
        alert(data.error || '解約に失敗しました')
      }
    } catch (error) {
      console.error('Failed to cancel:', error)
      alert('解約に失敗しました')
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

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">状態の取得に失敗しました</p>
        </div>
      </div>
    )
  }

  const isStudySub = state.affiliatePlanType === 'STUDY_SUB'
  const isAffiliateSub = state.affiliatePlanType === 'AFFILIATE_SUB'
  const isSuspended = state.affiliateState === 'SUSPENDED'
  const isOn = state.affiliateState === 'ON'

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">アフィリエイト設定</h1>

        {/* 状態カード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">現在の状態</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状態:</span>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  isOn
                    ? 'bg-green-100 text-green-700'
                    : isSuspended
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {state.affiliateState}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">プラン:</span>
              <span className="text-sm text-gray-900">{state.affiliatePlanType}</span>
            </div>
            {state.enabledAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">有効化日:</span>
                <span className="text-sm text-gray-900">
                  {new Date(state.enabledAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 現在の権限説明 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">現在の権限</h2>
          {isOn ? (
            <p className="text-sm text-gray-700">
              成果計測・報酬履歴が有効です
              {isStudySub && '（勉強コース加入中のため追加料金なし）'}
            </p>
          ) : isSuspended ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                アフィリエイト機能が一時停止中です
              </p>
              {state.suspendedReason && (
                <p className="text-sm text-red-700">理由: {state.suspendedReason}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-700">成果計測・報酬履歴は使えません</p>
          )}
        </div>

        {/* 操作 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">操作</h2>
          <div className="space-y-3">
            {!isOn && !isSuspended && (
              <button
                onClick={() => setShowPaywall(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                有効にする
              </button>
            )}

            {isOn && isAffiliateSub && (
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                解約（次回更新日まで有効）
              </button>
            )}

            {isOn && isStudySub && (
              <button
                onClick={() => router.push('/study/today')}
                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                勉強コース管理へ
              </button>
            )}

            {isSuspended && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-red-800">
                  アフィリエイト機能が一時停止中です
                </p>
                <p className="text-sm text-red-700">
                  お支払いが確認できませんでした。再度ONにしてください。
                </p>
                {state.suspendedReason && (
                  <p className="text-xs text-red-600">
                    理由: {state.suspendedReason === 'PAYMENT_FAILED' ? '支払い失敗' : state.suspendedReason}
                  </p>
                )}
                <button
                  onClick={() => setShowPaywall(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  再度ONにする
                </button>
              </div>
            )}

            {/* 旧コード（削除予定） */}
            {false && isSuspended && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  復旧手順については、お問い合わせください
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  復旧手順を見る
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 状態履歴 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">状態履歴</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {log.fromState} → {log.toState}
                    </span>
                    <span className="text-gray-500">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    理由: {log.reason} / 実行者: {log.actorType}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onConfirm={handleOptIn}
          isStudySubscriber={isStudySub}
        />
      </div>
    </div>
  )
}
